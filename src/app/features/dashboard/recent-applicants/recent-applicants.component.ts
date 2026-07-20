import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';

/** Status pill tone shown at the end of each applicant row. */
type ApplicantStatusTone = 'hired' | 'interview' | 'new' | 'referred';

interface RecentApplicant {
  name: string;
  role: string;
  location: string;
  when: string;
  status: string;
  tone: ApplicantStatusTone;
}

@Component({
  selector: 'app-recent-applicants',
  imports: [AvatarComponent],
  template: `<ul class="recent-applicants">
    @for (applicant of applicants; track applicant.name) {
      <li class="recent-applicants__row">
        <app-avatar [name]="applicant.name" [seed]="applicant.name" [size]="44" />
        <div class="recent-applicants__body">
          <p class="recent-applicants__name">{{ applicant.name }}</p>
          <p class="recent-applicants__meta">
            {{ applicant.role }} · {{ applicant.location }} · {{ applicant.when }}
          </p>
        </div>
        <span
          class="recent-applicants__status"
          [class]="'recent-applicants__status--' + applicant.tone"
        >
          {{ applicant.status }}
        </span>
      </li>
    }
  </ul>`,
  styleUrl: './recent-applicants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentApplicantsComponent {
  protected readonly applicants: RecentApplicant[] = [
    {
      name: 'Maria Santos',
      role: 'UI/UX Designer',
      location: 'Cagayan de Oro',
      when: '2h ago',
      status: 'Hired',
      tone: 'hired',
    },
    {
      name: 'Juan Miguel Dela Cruz',
      role: 'Frontend Developer',
      location: 'Cagayan de Oro',
      when: '5h ago',
      status: 'Interview',
      tone: 'interview',
    },
    {
      name: 'Jose Ramon Cruz',
      role: 'Construction Worker',
      location: 'Iligan City',
      when: 'Yesterday',
      status: 'New',
      tone: 'new',
    },
    {
      name: 'Andrea Villanueva',
      role: 'Registered Nurse',
      location: 'Davao City',
      when: 'Yesterday',
      status: 'Referred',
      tone: 'referred',
    },
    {
      name: 'Paolo Mendoza',
      role: 'Web Developer',
      location: 'Remote',
      when: '2d ago',
      status: 'New',
      tone: 'new',
    },
  ];
}
