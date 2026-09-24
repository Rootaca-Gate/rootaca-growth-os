import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { EmptyState } from '../../../shared/empty-state';
import { ErrorState } from '../../../shared/error-state';
import { FilterBar } from '../../../shared/filter-bar';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import { SearchInput } from '../../../shared/search-input';
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
  opportunityEnumLabel,
} from '../partnership.labels';
import { Institution, Paginated } from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { formatDate, opportunityStatusClass, opportunityTypeClass } from './opportunity-display';
import {
  OpportunityDashboard,
  OpportunityListItem,
  OpportunityStatus,
  OpportunityType,
  OpportunityUserOption,
} from './opportunity.models';

@Component({
  selector: 'app-renewals-list-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    FilterBar,
    SearchInput,
    TPipe,
  ],
  templateUrl: './renewals-list.page.html',
  styleUrl: './renewals-list.page.scss',
})
export class RenewalsListPage {
  private readonly api = inject(PartnershipsApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly opportunityTypes = OPPORTUNITY_TYPES;
  readonly opportunityStatuses = OPPORTUNITY_STATUSES;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly institutionControl = new FormControl('', { nonNullable: true });
  readonly ownerControl = new FormControl('', { nonNullable: true });
  readonly typeControl = new FormControl<OpportunityType | ''>('', { nonNullable: true });
  readonly statusControl = new FormControl<OpportunityStatus | ''>('', {
    nonNullable: true,
  });
  readonly dateFromControl = new FormControl('', { nonNullable: true });
  readonly dateToControl = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly institutions = signal<Institution[]>([]);
  readonly owners = signal<OpportunityUserOption[]>([]);
  readonly dashboard = signal<OpportunityDashboard | null>(null);
  readonly upcoming = signal<OpportunityListItem[]>([]);
  readonly result = signal<Paginated<OpportunityListItem>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });

  constructor() {
    this.loadInstitutions();
    this.loadOwners();
    this.loadDashboard();
    this.loadUpcoming();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.load(1));
    this.institutionControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.ownerControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.typeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.dateFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.dateToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  oppLabel = (
    category: Parameters<typeof opportunityEnumLabel>[1],
    value: string | null | undefined,
  ) => opportunityEnumLabel((key) => this.i18n.t(key), category, value);

  statusClass(status: OpportunityStatus): string {
    return opportunityStatusClass(status);
  }

  typeClass(type: OpportunityType): string {
    return opportunityTypeClass(type);
  }

  dateText(value: string | null): string {
    return formatDate(value);
  }

  previousPartnership(row: OpportunityListItem): string {
    return (
      row.previousSowNumber ||
      row.previousDeliveryNumber ||
      row.previousReportNumber ||
      '—'
    );
  }

  private loadInstitutions(): void {
    this.api.listInstitutions({ pageSize: 100, sortBy: 'name', sortOrder: 'asc' }).subscribe({
      next: (result) => this.institutions.set(result.items),
      error: () => this.institutions.set([]),
    });
  }

  private loadOwners(): void {
    this.api.listOpportunityUsers().subscribe({
      next: (users) => this.owners.set(users),
      error: () => this.owners.set([]),
    });
  }

  private loadDashboard(): void {
    this.api.getOpportunityDashboard().subscribe({
      next: (data) => this.dashboard.set(data),
      error: () => this.dashboard.set(null),
    });
  }

  private loadUpcoming(): void {
    this.api
      .listOpportunities({ pageSize: 5, page: 1 })
      .subscribe({
        next: (result) =>
          this.upcoming.set(result.items.filter((item) => !!item.expectedDate)),
        error: () => this.upcoming.set([]),
      });
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listOpportunities({
        search: this.searchControl.value || undefined,
        institutionId: this.institutionControl.value || undefined,
        ownerId: this.ownerControl.value || undefined,
        type: this.typeControl.value || undefined,
        status: this.statusControl.value || undefined,
        dateFrom: this.dateFromControl.value || undefined,
        dateTo: this.dateToControl.value || undefined,
        page,
        pageSize: this.result().pageSize,
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
        },
      });
  }

  onPage(event: PageEvent): void {
    this.result.update((current) => ({
      ...current,
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    }));
    this.load(event.pageIndex + 1);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.institutionControl.setValue('');
    this.ownerControl.setValue('');
    this.typeControl.setValue('');
    this.statusControl.setValue('');
    this.dateFromControl.setValue('');
    this.dateToControl.setValue('');
  }

  canCreateProposal(row: OpportunityListItem): boolean {
    return !row.newProposalId;
  }

  createProposal(row: OpportunityListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.renewalsCreateProposalConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.createOpportunityProposal(row.id).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.snackBar.open(
          this.i18n.t('partnerships.renewalsProposalCreated'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        if (updated.newProposal?.id) {
          void this.router.navigate(['/partnerships/proposals', updated.newProposal.id, 'edit'], {
            queryParams: { opportunityId: updated.id },
          });
        } else {
          this.load();
        }
      },
      error: (error: unknown) => this.reportError(error),
    });
  }

  archive(row: OpportunityListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.renewalsArchiveConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.archiveOpportunity(row.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(
          this.i18n.t('partnerships.renewalsArchived'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        this.load();
      },
      error: (error: unknown) => this.reportError(error),
    });
  }

  private reportError(error: unknown): void {
    this.busyId.set(null);
    this.snackBar.open(
      partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
      this.i18n.t('common.ok'),
      { duration: 4000 },
    );
  }
}
