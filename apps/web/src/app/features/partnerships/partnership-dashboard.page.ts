import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, forkJoin, of, switchMap } from 'rxjs';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { SectionHeader } from '../../shared/section-header';
import { StatCard } from '../../shared/stat-card';
import { LEAD_STATUSES, enumLabel } from './partnership.labels';
import {
  Activity,
  FollowUp,
  PartnershipDashboard,
  PartnershipSearchGroup,
  PartnershipSearchResult,
} from './partnership.models';
import { usePartnershipPermissions } from './partnership.permissions';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

type QuickCreateItem = { labelKey: string; path: string; requiresWrite?: boolean };

@Component({
  selector: 'app-partnership-dashboard-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
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
  readonly permissions = usePartnershipPermissions();
  readonly label = enumLabel;
  readonly leadStatuses = LEAD_STATUSES;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<PartnershipDashboard | null>(null);
  readonly dueToday = signal<FollowUp[]>([]);
  readonly overdue = signal<FollowUp[]>([]);
  readonly upcoming = signal<FollowUp[]>([]);
  readonly recent = signal<Activity[]>([]);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly searchLoading = signal(false);
  readonly searchResult = signal<PartnershipSearchResult | null>(null);
  readonly createOpen = signal(false);

  readonly quickCreateItems: QuickCreateItem[] = [
    { labelKey: 'nav.leads', path: '/partnerships/leads', requiresWrite: true },
    { labelKey: 'nav.institutions', path: '/partnerships/institutions/new', requiresWrite: true },
    { labelKey: 'nav.programs', path: '/partnerships/programs/new', requiresWrite: true },
    { labelKey: 'nav.offerings', path: '/partnerships/offerings/new', requiresWrite: true },
    { labelKey: 'nav.proposals', path: '/partnerships/proposals/new', requiresWrite: true },
    { labelKey: 'nav.sows', path: '/partnerships/sows/new', requiresWrite: true },
    { labelKey: 'nav.delivery', path: '/partnerships/delivery/new', requiresWrite: true },
    { labelKey: 'nav.reports', path: '/partnerships/reports/new', requiresWrite: true },
    { labelKey: 'nav.renewals', path: '/partnerships/renewals/new', requiresWrite: true },
  ];

  readonly attentionTotal = computed(() => {
    const data = this.dashboard();
    if (!data) return 0;
    return (
      data.overdueFollowUps +
      data.attentionProposalFollowUp +
      data.attentionSowPendingSignature +
      data.attentionDeliveryPaused +
      data.attentionReportInReview +
      data.attentionRenewalPlanning
    );
  });

  constructor() {
    this.load();
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
    return this.dashboard()?.leadsByStatus.find((row) => row.key === status)?.count ?? 0;
  }

  searchGroupLabel(group: PartnershipSearchGroup['group']): string {
    const key = `partnerships.searchGroup_${group}`;
    const translated = this.i18n.t(key);
    return translated === key ? group : translated;
  }

  toggleCreate(): void {
    this.createOpen.update((open) => !open);
  }
}
