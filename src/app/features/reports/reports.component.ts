import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { APP_ROUTES } from '../../core/constants/routes.constant';

/** Visual tone applied to a report card's icon tile. */
type ReportTone = 'green' | 'teal' | 'grey' | 'amber';

interface ReportCard {
  id: string;
  icon: string;
  tone: ReportTone;
  title: string;
  description: string;
  /** Detail page for the report; cards without one are not yet implemented. */
  route?: string;
}

interface ReportGroup {
  label: string;
  reports: ReportCard[];
}

@Component({
  selector: 'app-reports',
  imports: [MatIconModule, RouterLink],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  protected readonly groups: ReportGroup[] = [
    {
      label: 'Summary',
      reports: [
        {
          id: 'peso-accomplishment',
          icon: 'assignment_turned_in',
          tone: 'green',
          title: 'Accomplishment Report',
          description: 'The roll-up of all facilitation services for the period.',
          route: `${APP_ROUTES.reports}/peso-accomplishment`,
        },
        {
          id: 'employment-summary',
          icon: 'insights',
          tone: 'teal',
          title: 'Employment Summary Report',
          description: 'A one-glance snapshot of employment facilitation for the period.',
          route: `${APP_ROUTES.reports}/employment-summary`,
        },
      ],
    },
    {
      label: 'Employment Facilitation',
      reports: [
        {
          id: 'job-solicited',
          icon: 'work',
          tone: 'green',
          title: 'Job Solicited',
          description: 'Job vacancies solicited from partner establishments.',
          route: `${APP_ROUTES.reports}/job-solicited`,
        },
        {
          id: 'applicant-referred',
          icon: 'send',
          tone: 'grey',
          title: 'Applicant Referred',
          description: 'Job seekers referred to employers for vacancies.',
          route: `${APP_ROUTES.reports}/applicant-referred`,
        },
        {
          id: 'applicant-placed',
          icon: 'check_box',
          tone: 'green',
          title: 'Applicant Placed',
          description: 'Job seekers successfully hired through the office.',
          route: `${APP_ROUTES.reports}/applicant-placed`,
        },
        {
          id: 'referral-to-placement-funnel',
          icon: 'filter_alt',
          tone: 'teal',
          title: 'Referral-to-Placement Funnel',
          description: 'Conversion at each stage from referral through to hire, with drop-off.',
          route: `${APP_ROUTES.reports}/referral-to-placement-funnel`,
        },
      ],
    },
    {
      label: 'Registration',
      reports: [
        {
          id: 'applicant-registered',
          icon: 'person_add',
          tone: 'teal',
          title: 'Applicant Registered',
          description: 'New job seekers registered in the system.',
          route: `${APP_ROUTES.reports}/applicant-registered`,
        },
        {
          id: 'establishments-registered',
          icon: 'apartment',
          tone: 'amber',
          title: 'Establishments Registered',
          description: 'Partner employers registered in the system.',
          route: `${APP_ROUTES.reports}/establishments-registered`,
        },
      ],
    },
  ];

  protected onSelectReport(report: ReportCard): void {
    // TODO: open the report generator / export flow for `report.id`.
    void report;
  }
}
