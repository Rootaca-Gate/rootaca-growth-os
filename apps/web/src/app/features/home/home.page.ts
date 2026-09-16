import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { DashboardApi } from '../dashboard/dashboard.api';
import { DashboardBar, DashboardBarChart } from '../dashboard/dashboard-bar-chart';
import { DashboardLineChart } from '../dashboard/dashboard-line-chart';
import { ATTENTION_META, CARD_META } from '../dashboard/dashboard.labels';
import { DashboardCards, DashboardResponse } from '../dashboard/dashboard.models';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';

const KPI_TONES: Record<string, string> = {
  ON_TRACK: 'on-track',
  AT_RISK: 'at-risk',
  BEHIND: 'behind',
  COMPLETED: 'completed',
};

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
    PageHeader,
    EmptyState,
    DashboardBarChart,
    DashboardLineChart,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly api = inject(DashboardApi);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<DashboardResponse | null>(null);
  readonly cards = CARD_META;
  readonly attention = ATTENTION_META;

  readonly levelBars = computed(() => countBars(this.dashboard()?.charts.studentsByLevel ?? []));
  readonly pathBars = computed(() => countBars(this.dashboard()?.charts.studentsByPath ?? []));
  readonly skillBars = computed(
    (): DashboardBar[] =>
      this.dashboard()?.charts.averageSkillScores.map((item) => ({
        key: item.key,
        label: item.label,
        value: item.score,
      })) ?? [],
  );
  readonly kpiBars = computed((): DashboardBar[] => {
    const items = this.dashboard()?.charts.kpiStatus ?? [];
    if (items.every((item) => item.count === 0)) {
      return [];
    }
    return items.map((item) => ({
      key: item.key,
      label: item.label,
      value: item.count,
      tone: KPI_TONES[item.key] ?? 'default',
    }));
  });
  readonly monthlyPoints = computed(() => this.dashboard()?.charts.monthlyProgress ?? []);
  readonly kpiStatusMax = computed(() => {
    const counts = this.dashboard()?.charts.kpiStatus.map((item) => item.count) ?? [];
    return Math.max(1, ...counts);
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

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Unable to load the dashboard.';
  }
}

function countBars(items: Array<{ key: string; label: string; count: number }>): DashboardBar[] {
  return items.map((item) => ({ key: item.key, label: item.label, value: item.count }));
}
