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
import { REPORT_STATUSES, REPORT_TYPES, reportEnumLabel } from '../partnership.labels';
import { Institution, Paginated } from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { DeliveryListItem } from '../delivery/delivery.models';
import { formatPeriod, reportStatusClass } from './report-display';
import {
  PartnershipReportStatus,
  PartnershipReportType,
  ReportListItem,
} from './report.models';

@Component({
  selector: 'app-reports-list-page',
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
  templateUrl: './reports-list.page.html',
  styleUrl: './reports-list.page.scss',
})
export class ReportsListPage {
  private readonly api = inject(PartnershipsApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly reportTypes = REPORT_TYPES;
  readonly reportStatuses = REPORT_STATUSES;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly institutionControl = new FormControl('', { nonNullable: true });
  readonly deliveryControl = new FormControl('', { nonNullable: true });
  readonly typeControl = new FormControl<PartnershipReportType | ''>('', { nonNullable: true });
  readonly statusControl = new FormControl<PartnershipReportStatus | ''>('', {
    nonNullable: true,
  });
  readonly dateFromControl = new FormControl('', { nonNullable: true });
  readonly dateToControl = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly institutions = signal<Institution[]>([]);
  readonly deliveries = signal<DeliveryListItem[]>([]);
  readonly result = signal<Paginated<ReportListItem>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });

  constructor() {
    this.loadInstitutions();
    this.loadDeliveries();
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.load(1));
    this.institutionControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.deliveryControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.typeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.dateFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.dateToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  reportLabel = (
    category: Parameters<typeof reportEnumLabel>[1],
    value: string | null | undefined,
  ) => reportEnumLabel((key) => this.i18n.t(key), category, value);

  statusClass(status: PartnershipReportStatus): string {
    return reportStatusClass(status);
  }

  periodText(row: ReportListItem): string {
    return formatPeriod(row);
  }

  private loadInstitutions(): void {
    this.api.listInstitutions({ pageSize: 100, sortBy: 'name', sortOrder: 'asc' }).subscribe({
      next: (result) => this.institutions.set(result.items),
      error: () => this.institutions.set([]),
    });
  }

  private loadDeliveries(): void {
    this.api.listDeliveries({ pageSize: 100 }).subscribe({
      next: (result) => this.deliveries.set(result.items),
      error: () => this.deliveries.set([]),
    });
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listReports({
        search: this.searchControl.value || undefined,
        institutionId: this.institutionControl.value || undefined,
        deliveryId: this.deliveryControl.value || undefined,
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
    this.deliveryControl.setValue('');
    this.typeControl.setValue('');
    this.statusControl.setValue('');
    this.dateFromControl.setValue('');
    this.dateToControl.setValue('');
  }

  duplicate(row: ReportListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.reportsDuplicateConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.duplicateReport(row.id).subscribe({
      next: (copy) => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.reportsDuplicated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/reports', copy.id, 'edit']);
      },
      error: (error: unknown) => this.reportError(error),
    });
  }

  publish(row: ReportListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.reportsPublishConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.changeReportStatus(row.id, 'PUBLISHED').subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.reportsPublished'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        this.load();
      },
      error: (error: unknown) => this.reportError(error),
    });
  }

  archive(row: ReportListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.reportsArchiveConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.archiveReport(row.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.reportsArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        this.load();
      },
      error: (error: unknown) => this.reportError(error),
    });
  }

  async generatePdf(row: ReportListItem, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.busyId.set(row.id);
    this.api.getReport(row.id).subscribe({
      next: async (report) => {
        try {
          const { buildReportPdfHtml, downloadHtmlAsPdf } = await import('./report-pdf');
          const { buildReportPdfLabels } = await import('./report-pdf-labels');
          const { buildReportPdfFilename, buildReportPdfOptions } = await import('./report-display');
          const html = await buildReportPdfHtml(
            report,
            buildReportPdfLabels(this.i18n),
            buildReportPdfOptions(this.i18n),
            { schoolFacing: report.status === 'PUBLISHED' },
          );
          await downloadHtmlAsPdf(html, buildReportPdfFilename(report));
          this.api.markReportPdfGenerated(report.id).subscribe();
          this.busyId.set(null);
        } catch {
          this.busyId.set(null);
          this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
            duration: 4000,
          });
        }
      },
      error: (error: unknown) => this.reportError(error),
    });
  }

  canPublish(row: ReportListItem): boolean {
    return row.status === 'IN_REVIEW';
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
