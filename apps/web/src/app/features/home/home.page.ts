import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { ProgressBar } from '../../shared/progress-bar';
import { SectionHeader } from '../../shared/section-header';
import { StatCard } from '../../shared/stat-card';
import { StatusBadge } from '../../shared/status-badge';
import { StudentAvatar } from '../../shared/student-avatar';
import { Timeline } from '../../shared/timeline';
import { DashboardApi } from '../dashboard/dashboard.api';
import {
  DashboardCards,
  DashboardResponse,
} from '../dashboard/dashboard.models';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    StatCard,
    SectionHeader,
    ProgressBar,
    StatusBadge,
    StudentAvatar,
    Timeline,
    TPipe,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly api = inject(DashboardApi);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<DashboardResponse | null>(null);

  readonly greeting = computed(() => {
    this.i18n.locale();
    const hour = new Date().getHours();
    const hello =
      hour < 12
        ? this.i18n.t('dashboard.goodMorning')
        : hour < 18
          ? this.i18n.t('dashboard.goodAfternoon')
          : this.i18n.t('dashboard.goodEvening');
    const name = this.auth.currentUser()?.displayName?.split(' ')[0];
    const sep = this.i18n.locale() === 'ar' ? '، ' : ', ';
    return name ? `${hello}${sep}${name}` : hello;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.dashboard.set(null);
        this.error.set(this.toMessage(error));
        this.loading.set(false);
      },
    });
  }

  cardValue(cards: DashboardCards, key: keyof DashboardCards): string {
    const value = cards[key];
    if (value === null) {
      return '—';
    }
    return String(value);
  }

  progressLabel(value: number | null): string {
    return value === null ? '—' : `${value}%`;
  }

  skillLabel(value: number | null): string {
    this.i18n.locale();
    return value === null ? this.i18n.t('dashboard.notAssessed') : String(value);
  }

  kpiLabel(count: number): string {
    this.i18n.locale();
    if (count === 0) {
      return this.i18n.t('dashboard.onTrack');
    }
    return this.i18n.t('dashboard.belowTarget', { count });
  }

  statusLabel(status: string): string {
    this.i18n.locale();
    return this.i18n.statusLabel(status);
  }

  attentionCards(dashboard: DashboardResponse) {
    this.i18n.locale();
    return [
      {
        count: dashboard.attention.orientationNotCompleted.length,
        title: this.i18n.t('dashboard.orientationNotCompleted'),
        href: '/orientation?status=not_started',
      },
      {
        count: dashboard.attention.kpiBelowTarget.length,
        title: this.i18n.t('dashboard.kpiBelowTarget'),
        href: '/kpis?status=behind',
      },
      {
        count: dashboard.attention.noRecentActivity.length,
        title: this.i18n.t('dashboard.noRecentActivity'),
        href: '/students?activity=inactive',
      },
      {
        count: dashboard.attention.roadmapOverdue.length,
        title: this.i18n.t('dashboard.roadmapOverdue'),
        href: '/roadmaps?status=overdue',
      },
    ];
  }

  timeline(dashboard: DashboardResponse) {
    return dashboard.recentActivity.map((item) => ({
      title: item.title,
      occurredAt: item.occurredAt,
      href: item.href,
    }));
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return this.i18n.t('errors.connection');
  }
}
