import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

type NavItem = {
  label: string;
  icon: string;
  link: string;
};

@Component({
  selector: 'app-sidebar',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', link: '/main/dashboard' },
    { label: 'Companies', icon: 'apartment', link: '/main/companies' },
    { label: 'Applicants', icon: 'group', link: '/main/applicants' },
    { label: 'Job Listings', icon: 'work', link: '/main/job-listings' },
    { label: 'User Management', icon: 'groups', link: '/main/user-management' },
    { label: 'Workspaces', icon: 'computer_arrow_up', link: '/main/workspaces' },
  ];
}
