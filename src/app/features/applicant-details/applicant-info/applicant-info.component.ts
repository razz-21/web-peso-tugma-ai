import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { APPLICANT_STATUS_LABELS, ApplicantGet } from '../../../core/models/applicant.model';
import { DetailFieldComponent } from '../detail-field/detail-field.component';
import { SectionLink } from '../types/applicant-details.type';
import { EditSectionId } from '../types/applicant-edit-dialog.type';
import { addressLines, sameAddress } from '../utils/address.util';

const SECTIONS: readonly SectionLink[] = [
  { id: 'personal', label: 'Personal information', icon: 'person' },
  { id: 'contact', label: 'Contact', icon: 'call' },
  { id: 'address', label: 'Address', icon: 'location_on' },
  { id: 'education', label: 'Educational background', icon: 'school' },
  { id: 'skills', label: 'Skills & training', icon: 'edit' },
  { id: 'work', label: 'Work experience', icon: 'work' },
  { id: 'preferences', label: 'Job preferences', icon: 'star' },
];

/** Request to open an edit dialog for one of the applicant's detail sections. */
export interface EditSectionRequest {
  readonly section: EditSectionId;
  readonly label: string;
}

/**
 * Information tab: the applicant's detail sections (personal, contact, address,
 * education, skills, work, preferences) plus the sticky Sections rail and
 * Overview. Owns its scroll-spy; edit actions bubble up to the parent.
 */
@Component({
  selector: 'app-applicant-info',
  imports: [DatePipe, MatButtonModule, MatIconModule, DetailFieldComponent],
  templateUrl: './applicant-info.component.html',
  styleUrl: './applicant-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantInfoComponent {
  readonly applicant = input.required<ApplicantGet>();

  readonly editSection = output<EditSectionRequest>();

  protected readonly sections = SECTIONS;
  protected readonly statusLabels = APPLICANT_STATUS_LABELS;
  private readonly datePipe = new DatePipe('en-US');

  /** Section currently in view, highlighted in the Sections rail. */
  protected readonly activeSection = signal<string>(SECTIONS[0].id);

  private readonly sectionEls = viewChildren<ElementRef<HTMLElement>>('section');

  private readonly age = computed(() => {
    const dob = this.applicant().date_of_birth;
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

  protected readonly salaryLabel = computed(() => {
    const raw = this.applicant().salary_expectation?.trim();
    if (!raw) {
      return '—';
    }
    const digits = raw.replace(/[^\d.]/g, '');
    const value = Number(digits);
    return digits && !Number.isNaN(value) ? `₱${value.toLocaleString('en-PH')}` : raw;
  });

  protected readonly dobLabel = computed(() => {
    const dob = this.applicant().date_of_birth;
    if (!dob) {
      return null;
    }
    const formatted = this.datePipe.transform(dob, 'MMM d, y');
    const age = this.age();
    return age === null ? formatted : `${formatted} (${age})`;
  });

  protected readonly heightLabel = computed(() => {
    const height = this.applicant().height_in_cm;
    return height === null || height === undefined ? null : `${height} cm`;
  });

  protected readonly weightLabel = computed(() => {
    const weight = this.applicant().weight_in_kg;
    return weight === null || weight === undefined ? null : `${weight} kg`;
  });

  protected readonly presentAddressLines = computed(() =>
    addressLines(this.applicant().present_address ?? null),
  );

  protected readonly permanentSameAsPresent = computed(() => {
    const a = this.applicant();
    return a.permanent_address === null || sameAddress(a.present_address, a.permanent_address);
  });

  protected readonly permanentAddressLines = computed(() => {
    const a = this.applicant();
    return this.permanentSameAsPresent()
      ? addressLines(a.present_address)
      : addressLines(a.permanent_address);
  });

  protected readonly applicantId = computed(() => this.applicant().id.slice(0, 8));

  constructor() {
    // Scroll-spy: highlight the section nearest the top of the viewport.
    effect((onCleanup) => {
      const els = this.sectionEls();
      if (els.length === 0) {
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) {
            this.activeSection.set(visible[0].target.id);
          }
        },
        { rootMargin: '-88px 0px -60% 0px', threshold: 0 },
      );
      for (const el of els) {
        observer.observe(el.nativeElement);
      }
      onCleanup(() => observer.disconnect());
    });
  }

  protected scrollToSection(id: string): void {
    this.activeSection.set(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected onEditSection(section: EditSectionId, label: string): void {
    this.editSection.emit({ section, label });
  }
}
