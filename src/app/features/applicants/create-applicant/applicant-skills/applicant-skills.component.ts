import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

@Component({
  selector: 'app-applicant-skills',
  imports: [MatChipsModule, MatFormFieldModule, MatIconModule],
  templateUrl: './applicant-skills.component.html',
  styleUrl: '../wizard-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantSkillsComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
  protected readonly separatorKeys = [ENTER, COMMA] as const;

  protected add(event: MatChipInputEvent): void {
    this.store.addSkill(event.value);
    event.chipInput.clear();
  }
}
