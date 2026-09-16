import { Component, inject, signal } from '@angular/core';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { Timeline } from '../../shared/timeline';
import { httpErrorMessage } from '../../shared/http-error';
import { DashboardApi } from '../dashboard/dashboard.api';
import { DashboardActivityItem } from '../dashboard/dashboard.models';

@Component({
  selector: 'app-activity-page',
  imports: [PageHeader, EmptyState, ErrorState, LoadingSkeleton, Timeline, TPipe],
  template: `
    <app-page-header [title]="'hubs.activityTitle' | t" [subtitle]="'hubs.activitySubtitle' | t" />
    @if (loading()) {
      <app-loading-skeleton [rows]="6" />
    } @else if (error(); as message) {
      <app-error-state [message]="message" (retry)="load()" />
    } @else if (items().length === 0) {
      <app-empty-state [title]="'hubs.noActivity' | t" [message]="'hubs.noActivityHint' | t" />
    } @else {
      <section class="ra-card panel">
        <app-timeline [items]="timeline()" />
      </section>
    }
  `,
  styles: `
    .panel { padding: 20px; }
  `,
})
export class ActivityPage {
  private readonly api = inject(DashboardApi);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<DashboardActivityItem[]>([]);

  constructor() {
    this.load();
  }

  timeline() {
    return this.items().map((item) => ({
      title: item.title,
      occurredAt: item.occurredAt,
      href: item.href,
    }));
  }

  load(): void {
    this.loading.set(true);
    this.api.getDashboard().subscribe({
      next: (dashboard) => {
        this.items.set(dashboard.recentActivity);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }
}
