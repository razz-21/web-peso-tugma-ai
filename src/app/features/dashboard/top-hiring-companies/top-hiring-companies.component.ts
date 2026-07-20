import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';

interface HiringCompany {
  name: string;
  type: string;
  hires: number;
}

@Component({
  selector: 'app-top-hiring-companies',
  imports: [AvatarComponent],
  template: `<ul class="top-hiring">
    @for (company of companies; track company.name) {
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
  </ul>`,
  styleUrl: './top-hiring-companies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopHiringCompaniesComponent {
  protected readonly companies: HiringCompany[] = [
    { name: 'Company 1sadadasd', type: 'Sole Proprietorship', hires: 34 },
    { name: 'Northwind Robotics', type: 'Corporation', hires: 28 },
    { name: 'Davao Tech Solutions', type: 'Corporation', hires: 22 },
    { name: 'Cebu Pacific Logistics', type: 'Corporation', hires: 19 },
    { name: 'BrightPath Staffing', type: 'Partnership', hires: 15 },
  ];
}
