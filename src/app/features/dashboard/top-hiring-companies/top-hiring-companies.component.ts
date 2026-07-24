import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../core/components/empty-state/empty-state.component';
import { COMPANY_TYPE_LABELS } from '../../../core/models/company.model';
import { TopHiringCompany } from '../../../core/models/dashboard.model';

interface HiringCompanyRow {
  id: string;
  name: string;
  type: string;
  hires: number;
}

@Component({
  selector: 'app-top-hiring-companies',
  imports: [AvatarComponent, EmptyStateComponent],
  template: `@if (rows().length === 0) {
      <app-empty-state
        icon="apartment"
        title="No placements this month"
        text="No company has recorded a hire in the selected month yet. Placements will appear here as applicants get hired."
      />
    } @else {
      <ul class="top-hiring">
        @for (company of rows(); track company.id) {
          <li class="top-hiring__row">
            <app-avatar [name]="company.name" [seed]="company.name" [size]="44" />
            <div class="top-hiring__body">
              <p class="top-hiring__name">{{ company.name }}</p>
              <p class="top-hiring__type">{{ company.type }}</p>
            </div>
            <div class="top-hiring__metric">
              <span class="top-hiring__count">{{ company.hires }}</span>
              <span class="top-hiring__unit">hires</span>
            </div>
          </li>
        }
      </ul>
    }`,
  styleUrl: './top-hiring-companies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopHiringCompaniesComponent {
  readonly companies = input.required<TopHiringCompany[]>();

  protected readonly rows = computed<HiringCompanyRow[]>(() =>
    this.companies().map((company) => ({
      id: company.id,
      name: company.name,
      type: COMPANY_TYPE_LABELS[company.company_type],
      hires: company.hires,
    })),
  );
}
