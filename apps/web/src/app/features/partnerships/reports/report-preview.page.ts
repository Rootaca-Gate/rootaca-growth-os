import { Component, OnDestroy, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { buildReportPdfFilename, buildReportPdfOptions } from './report-display';
import { PartnershipReport } from './report.models';
import { buildReportPdfHtml, downloadHtmlAsPdf, openReportPdfWindow } from './report-pdf';
import { buildReportPdfLabels } from './report-pdf-labels';

@Component({
  selector: 'app-report-preview-page',
  imports: [RouterLink, MatButtonModule, ErrorState, LoadingSkeleton, TPipe],
  templateUrl: './report-preview.page.html',
  styleUrl: './report-preview.page.scss',
})
export class ReportPreviewPage implements OnDestroy {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloading = signal(false);
  readonly report = signal<PartnershipReport | null>(null);
  readonly previewUrl = signal<SafeResourceUrl | null>(null);

  private blobUrl: string | null = null;

  constructor() {
    this.reload();
  }

  ngOnDestroy(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
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
        void this.refreshPreview(report).finally(() => this.loading.set(false));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.reportsLoadError')));
      },
    });
  }

  async openPrintPreview(): Promise<void> {
    const html = await this.buildHtml(true);
    if (!html) {
      return;
    }
    const win = openReportPdfWindow(html);
    if (!win) {
      this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  async downloadPdf(): Promise<void> {
    const current = this.report();
    const html = await this.buildHtml(false);
    if (!current || !html) {
      return;
    }
    this.downloading.set(true);
    try {
      await downloadHtmlAsPdf(html, buildReportPdfFilename(current));
      this.api.markReportPdfGenerated(current.id).subscribe();
    } catch {
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    } finally {
      this.downloading.set(false);
    }
  }

  private async buildHtml(schoolFacing: boolean): Promise<string | null> {
    const current = this.report();
    if (!current) {
      return null;
    }
    return buildReportPdfHtml(
      current,
      buildReportPdfLabels(this.i18n),
      buildReportPdfOptions(this.i18n),
      { schoolFacing: schoolFacing || current.status === 'PUBLISHED' },
    );
  }

  private async refreshPreview(report: PartnershipReport): Promise<void> {
    const html = await buildReportPdfHtml(
      report,
      buildReportPdfLabels(this.i18n),
      buildReportPdfOptions(this.i18n),
      { schoolFacing: report.status === 'PUBLISHED' },
    );
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    this.blobUrl = URL.createObjectURL(blob);
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
  }
}
