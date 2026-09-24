import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { ProgressBar } from '../../shared/progress-bar';
import { SearchInput } from '../../shared/search-input';
import { SectionHeader } from '../../shared/section-header';
import { StatCard } from '../../shared/stat-card';
import { enumLabel } from './partnership.labels';
import {
  PartnershipCommandCenter,
  PartnershipDashboard,
  PartnershipSearchGroup,
  PartnershipSearchResult,
  PipelineStage,
} from './partnership.models';
import { usePartnershipPermissions } from './partnership.permissions';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

type CreateItem = { labelKey: string; path: string; queryParams?: Record<string, string> };
type PeriodKey = 'all' | 'today' | 'week' | 'month' | 'quarter';

@Component({
  selector: 'app-partnership-dashboard-page',
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    PageHeader,
    SectionHeader,
    StatCard,
    SearchInput,
    ProgressBar,
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
  readonly permissions = usePartnershipPermissions();
  readonly label = enumLabel;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<PartnershipDashboard | null>(null);
  readonly lastUpdated = signal<string | null>(null);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly periodControl = new FormControl<PeriodKey>('all', { nonNullable: true });
  readonly searchLoading = signal(false);
  readonly searchResult = signal<PartnershipSearchResult | null>(null);
  readonly createOpen = signal(false);

  readonly headerCreateItems: CreateItem[] = [
    { labelKey: 'partnerships.ccCreateLead', path: '/partnerships/leads' },
    { labelKey: 'partnerships.ccCreateInstitution', path: '/partnerships/institutions/new' },
    { labelKey: 'partnerships.ccCreateProposal', path: '/partnerships/proposals/new' },
    { labelKey: 'partnerships.ccCreateOpportunity', path: '/partnerships/renewals/new' },
  ];

  readonly quickActions: CreateItem[] = [
    { labelKey: 'partnerships.ccCreateLead', path: '/partnerships/leads' },
    { labelKey: 'partnerships.ccCreateInstitution', path: '/partnerships/institutions/new' },
    { labelKey: 'partnerships.ccCreateProposal', path: '/partnerships/proposals/new' },
    { labelKey: 'partnerships.ccCreateSow', path: '/partnerships/sows/new' },
    { labelKey: 'partnerships.ccCreateDelivery', path: '/partnerships/delivery/new' },
    { labelKey: 'partnerships.ccCreateReport', path: '/partnerships/reports/new' },
    { labelKey: 'partnerships.ccCreateOpportunity', path: '/partnerships/renewals/new' },
  ];

  readonly cc = computed<PartnershipCommandCenter | null>(
    () => this.dashboard()?.commandCenter ?? null,
  );

  readonly isEmpty = computed(() => {
    const data = this.dashboard();
    if (!data) return false;
    return data.totalInstitutions === 0 && data.totalLeads === 0 && data.proposalsTotal === 0;
  });

  constructor() {
    this.load();
    this.periodControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load());
    this.searchControl.valueChanges
      .pipe(
        debounceTime(280),
        distinctUntilChanged(),
        switchMap((q) => {
          const trimmed = q.trim();
          if (trimmed.length < 2) {
            this.searchLoading.set(false);
            this.searchResult.set(null);
            return of(null);
          }
          this.searchLoading.set(true);
          return this.api.searchPartnerships(trimmed);
        }),
      )
      .subscribe({
        next: (result) => {
          this.searchLoading.set(false);
          this.searchResult.set(result);
        },
        error: () => {
          this.searchLoading.set(false);
          this.searchResult.set({ query: this.searchControl.value, groups: [] });
        },
      });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getDashboard(this.periodControl.value).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.lastUpdated.set(data.commandCenter?.generatedAt ?? new Date().toISOString());
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(error, this.i18n.t('partnerships.loadError')));
      },
    });
  }

  refresh(): void {
    this.load();
  }

  toggleCreate(): void {
    this.createOpen.update((open) => !open);
  }

  searchGroupLabel(group: PartnershipSearchGroup['group']): string {
    const key = `partnerships.searchGroup_${group}`;
    const translated = this.i18n.t(key);
    return translated === key ? group : translated;
  }

  pipelineLabel(stage: PipelineStage): string {
    return this.i18n.t(`partnerships.ccPipeline_${stage.key}`);
  }

  pipelineHighlight(stage: PipelineStage): string {
    if (stage.highlight == null || !stage.highlightKey) {
      return '';
    }
    return this.i18n.t(`partnerships.ccHighlight_${stage.highlightKey}`, {
      count: String(stage.highlight),
    });
  }

  attentionKindLabel(kind: string): string {
    const key = `partnerships.ccAttentionKind_${kind}`;
    const translated = this.i18n.t(key);
    return translated === key ? kind : translated;
  }

  blank(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  progressText(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return `${Math.round(value)}%`;
  }

  relativeTime(isoValue: string | null | undefined): string {
    if (!isoValue) {
      return '—';
    }
    const then = new Date(isoValue).getTime();
    if (Number.isNaN(then)) {
      return '—';
    }
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return this.i18n.t('partnerships.ccJustNow');
    if (mins < 60) return this.i18n.t('partnerships.ccMinutesAgo', { count: String(mins) });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return this.i18n.t('partnerships.ccHoursAgo', { count: String(hours) });
    const days = Math.floor(hours / 24);
    if (days === 1) return this.i18n.t('partnerships.ccYesterday');
    return this.i18n.t('partnerships.ccDaysAgo', { count: String(days) });
  }
}
