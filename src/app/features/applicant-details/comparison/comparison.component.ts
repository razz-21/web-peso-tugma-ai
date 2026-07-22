import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApplicantGet } from '../../../core/models/applicant.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { JobMatch } from '../job-match.model';

/** Data handed to the full-page comparison dialog. */
export interface ComparisonDialogData {
  readonly applicant: ApplicantGet;
  readonly match: JobMatch;
}

type RequirementStatus = 'met' | 'partial' | 'unmet' | 'unknown';

/** One requirement row (skills / experience / education / location). */
interface RequirementView {
  readonly key: string;
  readonly label: string;
  /** Lower-cased label, for the summary sentence. */
  readonly lower: string;
  readonly icon: string;
  readonly status: RequirementStatus;
  /** Header badge, e.g. "3 of 5 matched" or "Met". */
  readonly badge: string;
  readonly coverage: number;
  readonly coverageColor: string;
  readonly isSkills: boolean;
  // Skills detail.
  readonly matchedSkills: readonly string[];
  readonly missingSkills: readonly string[];
  readonly additionalSkills: readonly string[];
  readonly note: string | null;
  // Generic detail (experience / education / location).
  readonly requiredItems: readonly string[];
  readonly requiredText: string | null;
  readonly applicantItems: readonly string[];
  readonly applicantText: string | null;
}

interface ComparisonSummary {
  readonly title: string;
  readonly subtitle: string;
  readonly metCount: number;
  readonly partialCount: number;
  readonly unmetCount: number;
  readonly unknownCount: number;
}

/** Outcome of a single hard primary-requirement gate. */
type RequirementState = 'pass' | 'fail' | 'na' | 'unknown';

/** One primary-requirement gate row (vacancies / age / sex / civil status). */
interface RequirementRow {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly state: RequirementState;
  readonly reason: string;
}

interface RequirementSummary {
  readonly rows: readonly RequirementRow[];
  readonly met: boolean;
}

/** Applicant-vs-job eligibility comparison (licenses / civil-service, ...). */
interface EligibilityView {
  /** Whether the job states an eligibility requirement at all. */
  readonly hasRequirement: boolean;
  /** The job's free-text requirement, when stated. */
  readonly required: string | null;
  /** Titles of the eligibilities the applicant holds. */
  readonly applicantHeld: readonly string[];
  /** pass = eligible, fail = not eligible, na = no requirement. */
  readonly state: RequirementState;
  /** Header pill text. */
  readonly badge: string;
  /** One-line explanation shown under the columns. */
  readonly reason: string;
}

// "Female/Male" on either side means "no sex restriction" (mirrors the backend).
const BOTH_SEXES = 'female/male';

const AGE_RANGE_RE = /(\d{1,3})\s*(?:-|–|—|to)\s*(\d{1,3})/;
const AGE_MIN_RES = [
  /(\d{1,3})\s*(?:\+|and above|and older|or above|or older|and up)/,
  /(?:at least|minimum|min|over|above|older than|from)\D{0,4}(\d{1,3})/,
];
const AGE_MAX_RES = [
  /(\d{1,3})\s*(?:and below|and under|or below|or younger)/,
  /(?:up to|at most|maximum|max|under|below|younger than|no more than)\D{0,4}(\d{1,3})/,
];

/** Parse a free-text age requirement into `[min, max]` bounds (mirrors the backend). */
const parseAgeRange = (text: string): [number | null, number | null] => {
  const lowered = text.trim().toLowerCase();
  const range = AGE_RANGE_RE.exec(lowered);
  if (range) {
    const low = Number(range[1]);
    const high = Number(range[2]);
    return [Math.min(low, high), Math.max(low, high)];
  }
  for (const pattern of AGE_MIN_RES) {
    const match = pattern.exec(lowered);
    if (match) {
      return [Number(match[1]), null];
    }
  }
  for (const pattern of AGE_MAX_RES) {
    const match = pattern.exec(lowered);
    if (match) {
      return [null, Number(match[1])];
    }
  }
  return [null, null];
};

/** Human-readable label for parsed age bounds. */
const ageRangeLabel = (low: number | null, high: number | null): string => {
  if (low !== null && high !== null) {
    return `${low}–${high}`;
  }
  if (low !== null) {
    return `${low}+`;
  }
  return `up to ${high}`;
};

const MET_COLOR = '#4d6a24';
const PARTIAL_COLOR = '#9a7b1e';
const UNMET_COLOR = '#b3261e';
const UNKNOWN_COLOR = '#7c857a';

const norm = (value: string): string => value.trim().toLowerCase();

const capitalize = (text: string): string =>
  text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);

/** Join phrases with commas and a trailing "and": "a, b and c". */
const joinList = (items: readonly string[]): string =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** Status from a 0–100 coverage score, for non-skills requirements. */
const statusFromScore = (score: number): RequirementStatus =>
  score >= 80 ? 'met' : score >= 40 ? 'partial' : 'unmet';

const statusColor = (status: RequirementStatus): string =>
  status === 'met'
    ? MET_COLOR
    : status === 'partial'
      ? PARTIAL_COLOR
      : status === 'unmet'
        ? UNMET_COLOR
        : UNKNOWN_COLOR;

const STATUS_LABEL: Record<RequirementStatus, string> = {
  met: 'Met',
  partial: 'Partial',
  unmet: 'Not met',
  unknown: 'No data',
};

/** Side-by-side applicant-vs-job requirement comparison, shown as a full-page dialog. */
@Component({
  selector: 'app-comparison',
  imports: [MatButtonModule, MatIconModule, AvatarComponent],
  templateUrl: './comparison.component.html',
  styleUrl: './comparison.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonComponent {
  private readonly data = inject<ComparisonDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ComparisonComponent>);

  protected readonly match = this.data.match;
  protected readonly applicant = this.data.applicant;

  protected readonly applicantName = computed(() =>
    [
      this.applicant.firstname,
      this.applicant.middlename,
      this.applicant.lastname,
      this.applicant.suffix,
    ]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(' '),
  );

  protected readonly applicantAge = computed<number | null>(() => {
    const dob = this.applicant.date_of_birth;
    if (!dob) {
      return null;
    }
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) {
      return null;
    }
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      years -= 1;
    }
    return years >= 0 ? years : null;
  });

  protected readonly applicantCity = computed(
    () => this.applicant.present_address?.municipality_city ?? null,
  );

  /** Applicant sub-line: "28 · Cagayan de Oro City". */
  protected readonly applicantMeta = computed(() =>
    [this.applicantAge()?.toString() ?? null, this.applicantCity()].filter((part): part is string =>
      Boolean(part),
    ),
  );

  /** Job sub-line: "Company 3 · 2 vacancies". */
  protected readonly jobMeta = computed(() => {
    const vacancies = this.match.vacancies;
    const vacancyText =
      vacancies === null ? null : `${vacancies} ${vacancies === 1 ? 'vacancy' : 'vacancies'}`;
    return [this.match.company?.name ?? null, vacancyText].filter((part): part is string =>
      Boolean(part),
    );
  });

  protected readonly requirements = computed<readonly RequirementView[]>(() => {
    const breakdown = new Map(this.match.breakdown.map((dimension) => [dimension.key, dimension]));
    const skillScore = breakdown.get('skills')?.value ?? 0;

    // --- Skills ------------------------------------------------------------
    const required = this.match.skillsRequired;
    const applicantSkills = this.applicant.technical_skills;
    const applicantSet = new Set(applicantSkills.map(norm));
    const requiredSet = new Set(required.map(norm));
    const matchedSkills = required.filter((skill) => applicantSet.has(norm(skill)));
    const missingSkills = required.filter((skill) => !applicantSet.has(norm(skill)));
    const additionalSkills = applicantSkills.filter((skill) => !requiredSet.has(norm(skill)));
    // Only classify when both the job and the applicant list skills.
    const skillsHasData = required.length > 0 && applicantSkills.length > 0;
    const skillsStatus: RequirementStatus = !skillsHasData
      ? 'unknown'
      : missingSkills.length === 0
        ? 'met'
        : matchedSkills.length > 0
          ? 'partial'
          : 'unmet';
    const skillsCoverage =
      required.length === 0
        ? skillScore
        : Math.round((matchedSkills.length / required.length) * 100);
    const skillsNote =
      !skillsHasData || missingSkills.length === 0
        ? null
        : `Missing ${joinList(missingSkills)}. ${
            missingSkills.length > 1 ? 'These are' : 'This is'
          } often picked up on the job — consider referring anyway, or suggest a short TESDA course first.`;

    const skills: RequirementView = {
      key: 'skills',
      label: 'Skills',
      lower: 'skills',
      icon: 'edit',
      status: skillsStatus,
      badge: !skillsHasData
        ? STATUS_LABEL.unknown
        : `${matchedSkills.length} of ${required.length} matched`,
      coverage: skillsCoverage,
      coverageColor: statusColor(skillsStatus),
      isSkills: true,
      matchedSkills,
      missingSkills,
      additionalSkills,
      note: skillsNote,
      requiredItems: [],
      requiredText: null,
      applicantItems: [],
      applicantText: null,
    };

    // --- Experience --------------------------------------------------------
    const experienceScore = breakdown.get('experience')?.value ?? 0;
    const experienceRequired = this.match.experienceRequired?.trim() ?? '';
    const experienceHasData =
      experienceRequired.length > 0 && this.applicant.work_experience.length > 0;
    const experienceStatus: RequirementStatus = experienceHasData
      ? statusFromScore(experienceScore)
      : 'unknown';
    const experience: RequirementView = {
      key: 'experience',
      label: 'Experience',
      lower: 'experience',
      icon: 'work',
      status: experienceStatus,
      badge: STATUS_LABEL[experienceStatus],
      coverage: experienceScore,
      coverageColor: statusColor(experienceStatus),
      isSkills: false,
      matchedSkills: [],
      missingSkills: [],
      additionalSkills: [],
      note: null,
      requiredItems: [],
      requiredText: this.match.experienceRequired ?? 'No specific experience required',
      applicantItems: this.applicant.work_experience
        .map((work) => work.position?.trim())
        .filter((position): position is string => Boolean(position)),
      applicantText:
        this.applicant.work_experience.length === 0 ? 'No work experience on file' : null,
    };

    // --- Education ---------------------------------------------------------
    const educationScore = breakdown.get('educational_background')?.value ?? 0;
    const applicantEducation =
      this.applicant.educational_background?.highest_education_level?.trim() || null;
    const educationHasData = this.match.educationRequired.length > 0 && applicantEducation !== null;
    const educationStatus: RequirementStatus = educationHasData
      ? statusFromScore(educationScore)
      : 'unknown';
    const education: RequirementView = {
      key: 'educational_background',
      label: 'Education',
      lower: 'education',
      icon: 'school',
      status: educationStatus,
      badge: STATUS_LABEL[educationStatus],
      coverage: educationScore,
      coverageColor: statusColor(educationStatus),
      isSkills: false,
      matchedSkills: [],
      missingSkills: [],
      additionalSkills: [],
      note: null,
      requiredItems: this.match.educationRequired,
      requiredText: this.match.educationRequired.length === 0 ? 'No minimum education' : null,
      applicantItems: applicantEducation ? [applicantEducation] : [],
      applicantText: applicantEducation ? null : 'Not indicated',
    };

    // --- Location ----------------------------------------------------------
    const locationScore = breakdown.get('location_preference')?.value ?? 0;
    const locationRequired = this.match.location?.trim() ?? '';
    const applicantHasLocation =
      this.applicant.preferred_work_location.length > 0 || this.applicantCity() !== null;
    const locationHasData = locationRequired.length > 0 && applicantHasLocation;
    const locationStatus: RequirementStatus = locationHasData
      ? statusFromScore(locationScore)
      : 'unknown';
    const location: RequirementView = {
      key: 'location_preference',
      label: 'Location',
      lower: 'location',
      icon: 'location_on',
      status: locationStatus,
      badge: STATUS_LABEL[locationStatus],
      coverage: locationScore,
      coverageColor: statusColor(locationStatus),
      isSkills: false,
      matchedSkills: [],
      missingSkills: [],
      additionalSkills: [],
      note: null,
      requiredItems: [],
      requiredText: this.match.location ?? 'No location specified',
      applicantItems: this.applicant.preferred_work_location,
      applicantText:
        this.applicant.preferred_work_location.length === 0
          ? (this.applicantCity() ?? 'Not indicated')
          : null,
    };

    return [skills, experience, education, location];
  });

  protected readonly summary = computed<ComparisonSummary>(() => {
    const requirements = this.requirements();
    const met = requirements.filter((requirement) => requirement.status === 'met');
    // "No data" requirements are neither met nor a described gap.
    const gaps = requirements.filter(
      (requirement) => requirement.status === 'partial' || requirement.status === 'unmet',
    );
    const partialCount = requirements.filter((r) => r.status === 'partial').length;
    const unmetCount = requirements.filter((r) => r.status === 'unmet').length;
    const unknownCount = requirements.filter((r) => r.status === 'unknown').length;

    const score = this.match.score;
    const band =
      score >= 85
        ? 'Strong match'
        : score >= 70
          ? 'Good match'
          : score >= 50
            ? 'Moderate match'
            : 'Low match';

    let subtitle: string;
    if (met.length === requirements.length) {
      subtitle = 'All four requirements are fully met.';
    } else if (gaps.length === 0 && met.length === 0) {
      subtitle = 'Not enough data to compare these requirements yet.';
    } else {
      const gapSentence =
        gaps.length === 0
          ? ''
          : `${gaps.length === 1 ? 'Only ' : ''}${capitalize(
              joinList(gaps.map((requirement) => requirement.lower)),
            )} ${gaps.length === 1 ? 'has' : 'have'} gaps.`;
      const metSentence =
        met.length === 0
          ? ''
          : `${capitalize(joinList(met.map((requirement) => requirement.lower)))} ${
              met.length === 1 ? 'qualifies' : 'all qualify'
            }.`;
      subtitle = [gapSentence, metSentence].filter(Boolean).join(' ');
    }

    return {
      title: `${band} — ${met.length} of ${requirements.length} requirements fully met`,
      subtitle,
      metCount: met.length,
      partialCount,
      unmetCount,
      unknownCount,
    };
  });

  /**
   * Eligibility comparison. `eligible` is computed and stored on the
   * recommendation at generation time; here we pair it with the job's
   * requirement text and the applicant's held eligibilities for display.
   */
  protected readonly eligibility = computed<EligibilityView>(() => {
    const required = this.match.eligibilityRequired?.trim() ?? '';
    const applicantHeld = this.applicant.eligibility
      .map((item) => item.title?.trim())
      .filter((title): title is string => Boolean(title));

    if (required.length === 0) {
      return {
        hasRequirement: false,
        required: null,
        applicantHeld,
        state: 'na',
        badge: 'No requirement',
        reason: 'This job lists no eligibility requirement.',
      };
    }
    if (this.match.eligible) {
      return {
        hasRequirement: true,
        required: this.match.eligibilityRequired,
        applicantHeld,
        state: 'pass',
        badge: 'Eligible',
        reason:
          applicantHeld.length > 0
            ? `Applicant holds ${joinList(applicantHeld)}.`
            : 'Applicant meets the eligibility requirement.',
      };
    }
    return {
      hasRequirement: true,
      required: this.match.eligibilityRequired,
      applicantHeld,
      state: 'fail',
      badge: 'Not eligible',
      reason:
        applicantHeld.length > 0
          ? `Applicant holds ${joinList(applicantHeld)}, which does not match the requirement.`
          : 'Applicant has no matching eligibility on file.',
    };
  });

  /** Hard primary-requirement gates enforced during generation, shown with reasons. */
  protected readonly primaryRequirements = computed<RequirementSummary>(() => {
    const rows: RequirementRow[] = [
      this.vacancyRow(),
      this.ageRow(),
      this.sexRow(),
      this.civilStatusRow(),
    ];
    return { rows, met: rows.every((row) => row.state !== 'fail') };
  });

  private vacancyRow(): RequirementRow {
    const vacancies = this.match.vacancies;
    const base = { key: 'vacancies', label: 'Vacancies', icon: 'event_seat' } as const;
    if (vacancies === null) {
      return { ...base, state: 'na', reason: 'Number of vacancies not specified' };
    }
    if (vacancies > 0) {
      return {
        ...base,
        state: 'pass',
        reason: `${vacancies} open ${vacancies === 1 ? 'position' : 'positions'}`,
      };
    }
    return { ...base, state: 'fail', reason: 'No open positions left' };
  }

  private ageRow(): RequirementRow {
    const base = { key: 'age', label: 'Age range', icon: 'cake' } as const;
    const ageRange = this.match.ageRange?.trim() ?? '';
    if (ageRange.length === 0) {
      return { ...base, state: 'na', reason: 'Open to all ages' };
    }
    const [low, high] = parseAgeRange(ageRange);
    if (low === null && high === null) {
      return { ...base, state: 'na', reason: `No age limit ("${ageRange}")` };
    }
    const age = this.applicantAge();
    if (age === null) {
      return { ...base, state: 'unknown', reason: 'Applicant birth date not on file' };
    }
    const label = ageRangeLabel(low, high);
    const withinLow = low === null || age >= low;
    const withinHigh = high === null || age <= high;
    return withinLow && withinHigh
      ? { ...base, state: 'pass', reason: `Age ${age} fits ${label}` }
      : { ...base, state: 'fail', reason: `Age ${age} is outside ${label}` };
  }

  private sexRow(): RequirementRow {
    const base = { key: 'sex', label: 'Sex', icon: 'wc' } as const;
    const required = this.match.requiredSex?.trim() ?? '';
    if (required.length === 0 || required.toLowerCase() === BOTH_SEXES) {
      return { ...base, state: 'na', reason: 'Open to all applicants' };
    }
    const applicantSex = this.applicant.sex?.trim() ?? '';
    if (applicantSex.length === 0) {
      return { ...base, state: 'unknown', reason: 'Applicant sex not on file' };
    }
    const matches =
      applicantSex.toLowerCase() === BOTH_SEXES ||
      applicantSex.toLowerCase() === required.toLowerCase();
    return matches
      ? { ...base, state: 'pass', reason: `Applicant is ${applicantSex}` }
      : { ...base, state: 'fail', reason: `Requires ${required}, applicant is ${applicantSex}` };
  }

  private civilStatusRow(): RequirementRow {
    const base = { key: 'civil_status', label: 'Civil status', icon: 'diversity_1' } as const;
    const allowed = this.match.civilStatusAllowed;
    if (allowed.length === 0) {
      return { ...base, state: 'na', reason: 'No civil status requirement' };
    }
    const applicantCivil = this.applicant.civil_status?.trim() ?? '';
    if (applicantCivil.length === 0) {
      return { ...base, state: 'unknown', reason: 'Applicant civil status not on file' };
    }
    const matches = allowed.some((status) => norm(status) === norm(applicantCivil));
    return matches
      ? { ...base, state: 'pass', reason: `${applicantCivil} is accepted` }
      : { ...base, state: 'fail', reason: `Requires ${joinList(allowed)}` };
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
