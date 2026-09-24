import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { EmptyState } from '../../../shared/empty-state';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { reportEnumLabel } from '../partnership.labels';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import {
  blankDisplay,
  buildReportPdfFilename,
  buildReportPdfOptions,
  formatCount,
  formatPercent,
  formatPeriod,
  reportStatusClass,
} from './report-display';
import { PartnershipReport, PartnershipReportStatus } from './report.models';
import { buildReportPdfHtml, downloadHtmlAsPdf } from './report-pdf';
import { buildReportPdfLabels } from './report-pdf-labels';

const STATUS_TRANSITIONS: Record<PartnershipReportStatus, PartnershipReportStatus[]> = {
  DRAFT: ['IN_REVIEW', 'ARCHIVED'],
  IN_REVIEW: ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
};

@Component({
  selector: 'app-report-details-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    ErrorState,
    LoadingSkeleton,
    EmptyState,
    TPipe,
  ],
  templateUrl: './report-details.page.html',
  styleUrl: './report-details.page.scss',
})
export class ReportDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly report = signal<PartnershipReport | null>(null);

  readonly statusControl = new FormControl<PartnershipReportStatus | ''>('', {
    nonNullable: true,
  });

  readonly nextStatuses = computed(() => {
    const current = this.report();
    if (!current) {
      return [] as PartnershipReportStatus[];
    }
    return STATUS_TRANSITIONS[current.status] ?? [];
  });

  readonly snapshot = computed(() => this.report()?.dataSnapshot ?? null);

  constructor() {
    this.reload();
  }

  reportLabel = (
    category: Parameters<typeof reportEnumLabel>[1],
    value: string | null | undefined,
  ) => reportEnumLabel((key) => this.i18n.t(key), category, value);

  statusClass(status: PartnershipReportStatus): string {
    return reportStatusClass(status);
  }

  blank = blankDisplay;
  pct = formatPercent;
  count = formatCount;
  period = formatPeriod;

  sessionsText(kpis: PartnershipReport['kpis'] | null | undefined): string {
    if (!kpis || kpis.sessions === null) {
      return '—';
    }
    if (kpis.sessionsCompleted === null) {
      return String(kpis.sessions);
    }
    return `${kpis.sessionsCompleted} / ${kpis.sessions}`;
  }

  deliverablesText(kpis: PartnershipReport['kpis'] | null | undefined): string {
    if (!kpis || kpis.deliverables === null) {
      return '—';
    }
    if (kpis.deliverablesAccepted === null) {
      return String(kpis.deliverables);
    }
    return `${kpis.deliverablesAccepted} / ${kpis.deliverables}`;
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.getReport(id).subscribe({
      next: (report) => {
        this.report.set(report);
        this.statusControl.setValue('');
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.reportsLoadError')));
      },
    });
  }

  back(): void {
    void this.router.navigate(['/partnerships/reports']);
  }

  changeStatus(): void {
    const current = this.report();
    const next = this.statusControl.value;
    if (!current || !next) {
      return;
    }
    this.busy.set(true);
    this.api.changeReportStatus(current.id, next).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.report.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.reportsStatusChanged'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  publish(): void {
    const current = this.report();
    if (!current) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.reportsPublishConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.changeReportStatus(current.id, 'PUBLISHED').subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.report.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.reportsPublished'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  refreshSnapshot(): void {
    const current = this.report();
    if (!current) {
      return;
    }
    this.busy.set(true);
    this.api.refreshReportSnapshot(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.report.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.reportsSnapshotRefreshed'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  duplicate(): void {
    const current = this.report();
    if (!current) {
      return;
    }
    this.busy.set(true);
    this.api.duplicateReport(current.id).subscribe({
      next: (copy) => {
        this.busy.set(false);
        void this.router.navigate(['/partnerships/reports', copy.id, 'edit']);
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  archive(): void {
    const current = this.report();
    if (!current || current.status === 'ARCHIVED') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.reportsArchiveConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.archiveReport(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.report.set(updated);
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  createFollowOn(intent: 'renewal' | 'expansion'): void {
    const current = this.report();
    if (!current) {
      return;
    }
    void this.router.navigate(['/partnerships/proposals/new'], {
      queryParams: {
        intent,
        institutionId: current.institutionId,
        sourceDeliveryId: current.deliveryId,
        sourceSowId: current.sowId,
      },
    });
  }

  async generatePdf(): Promise<void> {
    const current = this.report();
    if (!current) {
      return;
    }
    try {
      const html = await buildReportPdfHtml(
        current,
        buildReportPdfLabels(this.i18n),
        buildReportPdfOptions(this.i18n),
        { schoolFacing: current.status === 'PUBLISHED' },
      );
      await downloadHtmlAsPdf(html, buildReportPdfFilename(current));
      this.api.markReportPdfGenerated(current.id).subscribe();
    } catch {
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  private reportError(err: unknown): void {
    this.busy.set(false);
    this.snackBar.open(
      partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
      this.i18n.t('common.ok'),
      { duration: 4000 },
    );
  }
}
