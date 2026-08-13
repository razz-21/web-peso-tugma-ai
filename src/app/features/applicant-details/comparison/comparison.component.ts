import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import {
  ComparisonDialogData,
  ComparisonSummary,
  EligibilityView,
  RequirementRow,
  RequirementStatus,
  RequirementSummary,
  RequirementView,
  SkillChip,
  SkillTierItem,
} from '../types/comparison.type';
import { BOTH_SEXES, ageRangeLabel, parseAgeRange } from '../utils/age.util';
import { STATUS_LABEL, statusColor, statusFromScore } from '../utils/comparison.util';
import { capitalize, joinList, norm } from '../utils/text.util';

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
    const requiredSet = new Set(required.map(norm));

    // Prefer the backend's per-skill classification (matched / related /
    // missing), which carries the MiniLM cosine and the covering applicant
    // skill — so a related skill (e.g. "Google Sheets" for a required "Excel")
    // surfaces as its own tier with a "via" hint. Falls back to an
    // exact-token + keyMatched overlap for recommendations generated before
    // `skill_matches` existed (no related tier then).
    let matchedSkills: SkillTierItem[];
    let relatedSkills: SkillChip[];
    let missingSkills: SkillTierItem[];
    let matchingSkills: string[];
    if (this.match.skillMatches.length > 0) {
      const skillMatches = this.match.skillMatches;
      matchedSkills = skillMatches
        .filter((m) => m.state === 'matched')
        .map((m) => ({ name: m.required, tier: m.tier }));
      relatedSkills = skillMatches
        .filter((m) => m.state === 'related')
        .map((m) => ({
          required: m.required,
          via: m.applicant,
          similarity: m.similarity,
          tier: m.tier,
        }));
      missingSkills = skillMatches
        .filter((m) => m.state === 'missing')
        .map((m) => ({ name: m.required, tier: m.tier }));
      // The applicant's own skills that cover a requirement: the exact skill
      // (state matched, no `via`) or the covering skill for a semantic/related
      // match.
      matchingSkills = skillMatches
        .filter((m) => m.state === 'matched' || m.state === 'related')
        .map((m) => m.applicant ?? m.required);
    } else {
      // Fallback for recommendations generated before `skill_matches` existed:
      // no tier info, so every required skill is treated as mandatory.
      const matchedSet = new Set(this.match.keyMatched.map(norm));
      const applicantSet = new Set(applicantSkills.map(norm));
      const matchedNames = required.filter(
        (skill) => matchedSet.has(norm(skill)) || applicantSet.has(norm(skill)),
      );
      const matchedNorms = new Set(matchedNames.map(norm));
      matchedSkills = matchedNames.map((name) => ({ name, tier: 'mandatory' as const }));
      relatedSkills = [];
      missingSkills = required
        .filter((skill) => !matchedNorms.has(norm(skill)))
        .map((name) => ({ name, tier: 'mandatory' as const }));
      matchingSkills = matchedNames;
    }

    // Exclude any applicant skill already surfaced as a covering ("via") skill
    // so it isn't also listed under Additional.
    const coveredSet = new Set(matchingSkills.map(norm));
    const additionalSkills = applicantSkills.filter(
      (skill) => !requiredSet.has(norm(skill)) && !coveredSet.has(norm(skill)),
    );

    // Status and the "X of N matched" badge summarize the *mandatory* required
    // skills (must-haves), so count only mandatory-tier chips — a missing
    // preferred skill shows as a muted chip but never drops the status or the
    // count. `required.length` is the mandatory denominator.
    const matchedCount = matchedSkills.filter((skill) => skill.tier === 'mandatory').length;
    const relatedCount = relatedSkills.filter((skill) => skill.tier === 'mandatory').length;
    const mandatoryMissing = missingSkills.filter((skill) => skill.tier === 'mandatory');

    // Data exists once either tier lists a skill and the applicant lists skills.
    const totalConsidered = matchedSkills.length + relatedSkills.length + missingSkills.length;
    const skillsHasData = totalConsidered > 0 && applicantSkills.length > 0;
    const skillsStatus: RequirementStatus = !skillsHasData
      ? 'unknown'
      : mandatoryMissing.length === 0 && relatedCount === 0
        ? 'met'
        : matchedCount > 0 || relatedCount > 0
          ? 'partial'
          : 'unmet';
    // Use the backend's calibrated skills score so a related skill earns partial
    // coverage (e.g. 71%) instead of the old count-based 0%.
    const skillsCoverage = skillScore;
    // Advice focuses on the missing must-haves (preferred gaps don't block a referral).
    const skillsNote =
      !skillsHasData || mandatoryMissing.length === 0
        ? null
        : `Missing ${joinList(mandatoryMissing.map((skill) => skill.name))}. ${
            mandatoryMissing.length > 1 ? 'These are' : 'This is'
          } often picked up on the job — consider referring anyway, or suggest a short TESDA course first.`;
    const skills: RequirementView = {
      key: 'skills',
      label: 'Skills',
      lower: 'skills',
      icon: 'edit',
      status: skillsStatus,
      badge: !skillsHasData
        ? STATUS_LABEL.unknown
        : relatedCount > 0
          ? `${matchedCount} of ${required.length} matched · ${relatedCount} related`
          : `${matchedCount} of ${required.length} matched`,
      coverage: skillsCoverage,
      coverageColor: statusColor(skillsStatus),
      isSkills: true,
      matchedSkills,
      relatedSkills,
      missingSkills,
      matchingSkills,
      additionalSkills,
      note: skillsNote,
      requiredItems: [],
      requiredText: null,
      applicantItems: [],
      applicantText: null,
    };

    // --- Experience --------------------------------------------------------
    // Experience compares the job's `experience_required` against the
    // applicant's work history (roles), mirroring the backend's work-only
    // qualitative experience vector. Course of study is scored under Education.
    const experienceScore = breakdown.get('experience')?.value ?? 0;
    const experienceRequired = this.match.experienceRequired?.trim() ?? '';
    const workPositions = this.applicant.work_experience
      .map((work) => work.position?.trim())
      .filter((position): position is string => Boolean(position));
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
      relatedSkills: [],
      missingSkills: [],
      matchingSkills: [],
      additionalSkills: [],
      note: null,
      requiredItems: [],
      requiredText: this.match.experienceRequired ?? 'No specific experience required',
      applicantItems: workPositions,
      applicantText: workPositions.length === 0 ? 'No work experience on file' : null,
    };

    // --- Education ---------------------------------------------------------
    // Education compares the job's minimum attainment *and* preferred course of
    // study against the applicant's highest level and course, matching the
    // backend's combined level + course education score.
    const educationScore = breakdown.get('educational_background')?.value ?? 0;
    const courseRequired = this.match.courseRequired?.trim() || null;
    const educationRequiredItems = [
      ...this.match.educationRequired,
      ...(courseRequired ? [courseRequired] : []),
    ];
    const applicantLevel =
      this.applicant.educational_background?.highest_education_level?.trim() || null;
    const applicantCourse = this.applicant.educational_background?.course_program?.trim() || null;
    const applicantEducationItems = [
      ...(applicantLevel ? [applicantLevel] : []),
      ...(applicantCourse ? [applicantCourse] : []),
    ];
    const educationHasData =
      educationRequiredItems.length > 0 && applicantEducationItems.length > 0;
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
      relatedSkills: [],
      missingSkills: [],
      matchingSkills: [],
      additionalSkills: [],
      note: null,
      requiredItems: educationRequiredItems,
      requiredText: educationRequiredItems.length === 0 ? 'No minimum education' : null,
      applicantItems: applicantEducationItems,
      applicantText: applicantEducationItems.length === 0 ? 'Not indicated' : null,
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
      relatedSkills: [],
      missingSkills: [],
      matchingSkills: [],
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
