import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { SectionHeader } from '../../shared/section-header';
import { StatCard } from '../../shared/stat-card';
import { LEAD_STATUSES, enumLabel } from './partnership.labels';
import { Activity, FollowUp, PartnershipDashboard } from './partnership.models';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

@Component({
  selector: 'app-partnership-dashboard-page',
  imports: [
    RouterLink,
    MatButtonModule,
    PageHeader,
    SectionHeader,
    StatCard,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  templateUrl: './partnership-dashboard.page.html',
  styleUrl: './partnership-dashboard.page.scss',
})
export class PartnershipDashboardPage {
  private readonly api = inject(PartnershipsApi);
  readonly i18n = inject(DirectionService);
  readonly label = enumLabel;
  readonly leadStatuses = LEAD_STATUSES;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<PartnershipDashboard | null>(null);
  readonly dueToday = signal<FollowUp[]>([]);
  readonly overdue = signal<FollowUp[]>([]);
  readonly upcoming = signal<FollowUp[]>([]);
  readonly recent = signal<Activity[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const today = new Date().toISOString().slice(0, 10);
    forkJoin({
      dashboard: this.api.getDashboard(),
      dueToday: this.api.listFollowUps({ status: 'PENDING', dueDate: today, pageSize: 10 }),
      overdue: this.api.listFollowUps({ status: 'PENDING', overdue: true, pageSize: 10 }),
      upcoming: this.api.listFollowUps({ status: 'PENDING', pageSize: 10 }),
      recent: this.api.listActivities({ pageSize: 10 }),
    }).subscribe({
      next: (data) => {
        this.dashboard.set(data.dashboard);
        this.dueToday.set(data.dueToday.items);
        this.overdue.set(data.overdue.items);
        this.upcoming.set(
          data.upcoming.items.filter((item) => item.dueDate > today).slice(0, 10),
        );
        this.recent.set(data.recent.items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(error, this.i18n.t('partnerships.loadError')));
      },
    });
  }

  statusCount(status: string): number {
    return this.dashboard()?.leadsByStatus.find((item) => item.key === status)?.count ?? 0;
  }
}
