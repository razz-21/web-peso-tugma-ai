import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { COMPANY_TYPE_LABELS, CompanyGet } from '../../../core/models/company.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';

@Component({
  selector: 'app-company-profile',
  imports: [MatButtonModule, MatIconModule, AvatarComponent],
  templateUrl: './company-profile.component.html',
  styleUrl: './company-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfileComponent {
  readonly company = input.required<CompanyGet>();
  readonly openRoles = input.required<number>();
  readonly applicants = input.required<number>();

  readonly edit = output<CompanyGet>();
  readonly delete = output<CompanyGet>();

  protected readonly typeLabel = computed(() => COMPANY_TYPE_LABELS[this.company().company_type]);
}
