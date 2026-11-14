import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet, NgOptimizedImage, MatIconModule, ThemeToggleComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {}
