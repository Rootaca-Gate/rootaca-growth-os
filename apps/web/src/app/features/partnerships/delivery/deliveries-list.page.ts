import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import { DELIVERY_STATUSES, deliveryEnumLabel } from '../partnership.labels';
import { Institution, Paginated } from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { deliveryStatusClass, formatProgressPercent } from './delivery-display';
import { DeliveryListItem, PartnershipDeliveryStatus } from './delivery.models';
import { SowListItem } from '../sows/sow.models';

@Component({
  selector: 'app-deliveries-list-page',
  imports: [
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
  templateUrl: './deliveries-list.page.html',
  styleUrl: './deliveries-list.page.scss',
})
export class DeliveriesListPage {
  private readonly api = inject(PartnershipsApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly deliveryStatuses = DELIVERY_STATUSES;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly institutionControl = new FormControl('', { nonNullable: true });
  readonly sowControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<PartnershipDeliveryStatus | ''>('', {
    nonNullable: true,
  });
  readonly startDateFromControl = new FormControl('', { nonNullable: true });
  readonly startDateToControl = new FormControl('', { nonNullable: true });
  readonly endDateFromControl = new FormControl('', { nonNullable: true });
  readonly endDateToControl = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly institutions = signal<Institution[]>([]);
  readonly sows = signal<SowListItem[]>([]);
  readonly result = signal<Paginated<DeliveryListItem>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });

  constructor() {
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status && (DELIVERY_STATUSES as readonly string[]).includes(status)) {
      this.statusControl.setValue(status as PartnershipDeliveryStatus, { emitEvent: false });
    }
    this.loadInstitutions();
    this.loadSows();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.load(1));
    this.institutionControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.sowControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.startDateFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.startDateToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.endDateFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.endDateToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  deliveryLabel = (
    category: Parameters<typeof deliveryEnumLabel>[1],
    value: string | null | undefined,
  ) => deliveryEnumLabel((key) => this.i18n.t(key), category, value);

  statusClass(status: PartnershipDeliveryStatus): string {
    return deliveryStatusClass(status);
  }

  progressText(percent: number): string {
    return formatProgressPercent(percent);
  }

  private loadInstitutions(): void {
    this.api.listInstitutions({ pageSize: 100, sortBy: 'name', sortOrder: 'asc' }).subscribe({
      next: (result) => this.institutions.set(result.items),
      error: () => this.institutions.set([]),
    });
  }

  private loadSows(): void {
    this.api.listSows({ status: 'ACTIVE', pageSize: 100 }).subscribe({
      next: (result) => this.sows.set(result.items),
      error: () => this.sows.set([]),
    });
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listDeliveries({
        search: this.searchControl.value || undefined,
        institutionId: this.institutionControl.value || undefined,
        sowId: this.sowControl.value || undefined,
        status: this.statusControl.value || undefined,
        startDateFrom: this.startDateFromControl.value || undefined,
        startDateTo: this.startDateToControl.value || undefined,
        endDateFrom: this.endDateFromControl.value || undefined,
        endDateTo: this.endDateToControl.value || undefined,
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
    this.sowControl.setValue('');
    this.statusControl.setValue('');
    this.startDateFromControl.setValue('');
    this.startDateToControl.setValue('');
    this.endDateFromControl.setValue('');
    this.endDateToControl.setValue('');
  }

  duplicate(row: DeliveryListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.deliveryDuplicateConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.duplicateDelivery(row.id).subscribe({
      next: (copy) => {
        this.busyId.set(null);
        this.snackBar.open(
          this.i18n.t('partnerships.deliveryDuplicated'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        void this.router.navigate(['/partnerships/delivery', copy.id, 'edit']);
      },
      error: (error: unknown) => this.reportError(error),
    });
  }

  archive(row: DeliveryListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.deliveryArchiveConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.archiveDelivery(row.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.deliveryArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
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
