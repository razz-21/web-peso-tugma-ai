import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FilesPanelComponent } from '../../../core/components/files-panel/files-panel.component';

/** Files tab: the applicant's uploaded files, wrapped in the details card. */
@Component({
  selector: 'app-applicant-files',
  imports: [FilesPanelComponent],
  template: `
    <div class="applicant-details__panel">
      <article class="applicant-details__card">
        <app-files-panel [foreignId]="foreignId()" [disabled]="disabled()" />
      </article>
    </div>
  `,
  styleUrl: './applicant-files.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantFilesComponent {
  /** The applicant id the files belong to. */
  readonly foreignId = input.required<string>();
  /** When true, uploads/deletes are disabled (e.g. inactive applicant). */
  readonly disabled = input<boolean>(false);
}
