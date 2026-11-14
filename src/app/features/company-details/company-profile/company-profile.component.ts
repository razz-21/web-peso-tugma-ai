import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CompanyGet } from '../../../core/models/company.model';

/** Sidebar card (About + Contact) on the company details page. */
@Component({
  selector: 'app-company-profile',
  imports: [MatIconModule],
  templateUrl: './company-profile.component.html',
  styleUrl: './company-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfileComponent {
  readonly company = input.required<CompanyGet>();

  /** Email split after the "@" so long addresses wrap there instead of mid-word. */
  protected readonly emailParts = computed(() => {
    const email = this.company().email;
    if (!email) {
      return null;
    }
    const at = email.indexOf('@') + 1;
    return { local: email.slice(0, at), domain: email.slice(at) };
  });
}
