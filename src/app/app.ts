import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgOptimizedImage,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);

  protected readonly title = signal('web-peso-tugma-ai');
  protected readonly isDark = signal(false);
  protected readonly themeLabel = computed(() => (this.isDark() ? 'Dark' : 'Light'));

  protected toggleTheme(): void {
    this.isDark.update((value) => !value);
    const body = this.document.body;
    body.classList.toggle('light', !this.isDark());
    body.classList.toggle('dark', this.isDark());
  }
}
