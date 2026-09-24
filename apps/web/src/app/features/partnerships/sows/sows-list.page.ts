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
import { SOW_STATUSES, sowEnumLabel } from '../partnership.labels';
import { Institution, Paginated } from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { buildSowPdfOptions, sowStatusClass } from './sow-display';
import { PartnershipSowStatus, SowListItem } from './sow.models';
import { buildSowPdfHtml, openSowPdfWindow } from './sow-pdf';
import { buildSowPdfLabels } from './sow-pdf-labels';

@Component({
  selector: 'app-sows-list-page',
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
  templateUrl: './sows-list.page.html',
  styleUrl: './sows-list.page.scss',
})
export class SowsListPage {
  private readonly api = inject(PartnershipsApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly sowStatuses = SOW_STATUSES;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly institutionControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<PartnershipSowStatus | ''>('', { nonNullable: true });
  readonly startDateFromControl = new FormControl('', { nonNullable: true });
  readonly startDateToControl = new FormControl('', { nonNullable: true });
  readonly endDateFromControl = new FormControl('', { nonNullable: true });
  readonly endDateToControl = new FormControl('', { nonNullable: true });
  readonly createdFromControl = new FormControl('', { nonNullable: true });
  readonly createdToControl = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly institutions = signal<Institution[]>([]);
  readonly result = signal<Paginated<SowListItem>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });

  constructor() {
    this.loadInstitutions();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.load(1));
    this.institutionControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.startDateFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.startDateToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.endDateFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.endDateToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.createdFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.createdToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  sowLabel = (
    category: Parameters<typeof sowEnumLabel>[1],
    value: string | null | undefined,
  ) => sowEnumLabel((key) => this.i18n.t(key), category, value);

  statusClass(status: PartnershipSowStatus): string {
    return sowStatusClass(status);
  }

  canEdit(row: SowListItem): boolean {
    return !row.isLocked && row.status === 'DRAFT';
  }

  private loadInstitutions(): void {
    this.api.listInstitutions({ pageSize: 100, sortBy: 'name', sortOrder: 'asc' }).subscribe({
      next: (result) => this.institutions.set(result.items),
      error: () => this.institutions.set([]),
    });
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listSows({
        search: this.searchControl.value,
        institutionId: this.institutionControl.value || undefined,
        status: this.statusControl.value,
        startDateFrom: this.startDateFromControl.value || undefined,
        startDateTo: this.startDateToControl.value || undefined,
        endDateFrom: this.endDateFromControl.value || undefined,
        endDateTo: this.endDateToControl.value || undefined,
        createdFrom: this.createdFromControl.value || undefined,
        createdTo: this.createdToControl.value || undefined,
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
    this.statusControl.setValue('');
    this.startDateFromControl.setValue('');
    this.startDateToControl.setValue('');
    this.endDateFromControl.setValue('');
    this.endDateToControl.setValue('');
    this.createdFromControl.setValue('');
    this.createdToControl.setValue('');
  }

  duplicate(row: SowListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.sowsDuplicateConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.duplicateSow(row.id).subscribe({
      next: (copy) => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.sowsDuplicated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/sows', copy.id, 'edit']);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  archive(row: SowListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.sowsArchiveConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.archiveSow(row.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.sowsArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        this.load();
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  generatePdf(row: SowListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.busyId.set(row.id);
    this.api.getSow(row.id).subscribe({
      next: async (sow) => {
        try {
          const html = await buildSowPdfHtml(
            sow,
            buildSowPdfLabels(this.i18n),
            buildSowPdfOptions(this.i18n),
          );
          const win = openSowPdfWindow(html);
          this.busyId.set(null);
          if (!win) {
            this.snackBar.open(
              this.i18n.t('partnerships.pdfPopupBlocked'),
              this.i18n.t('common.ok'),
              { duration: 4000 },
            );
          }
        } catch {
          this.busyId.set(null);
          this.snackBar.open(
            this.i18n.t('partnerships.pdfDownloadFailed'),
            this.i18n.t('common.ok'),
            { duration: 4000 },
          );
        }
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.sowsLoadError')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }
}
