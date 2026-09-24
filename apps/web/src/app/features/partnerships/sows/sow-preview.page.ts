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
import { buildSowPdfFilename, buildSowPdfOptions } from './sow-display';
import { PartnershipSow } from './sow.models';
import { buildSowPdfHtml, downloadHtmlAsPdf, openSowPdfWindow } from './sow-pdf';
import { buildSowPdfLabels } from './sow-pdf-labels';

@Component({
  selector: 'app-sow-preview-page',
  imports: [RouterLink, MatButtonModule, ErrorState, LoadingSkeleton, TPipe],
  templateUrl: './sow-preview.page.html',
  styleUrl: './sow-preview.page.scss',
})
export class SowPreviewPage implements OnDestroy {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloading = signal(false);
  readonly sow = signal<PartnershipSow | null>(null);
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
    this.api.getSow(id).subscribe({
      next: (sow) => {
        this.sow.set(sow);
        void this.refreshPreview(sow).finally(() => this.loading.set(false));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.sowsLoadError')));
      },
    });
  }

  async openPrintPreview(): Promise<void> {
    const html = await this.buildHtml();
    if (!html) {
      return;
    }
    const win = openSowPdfWindow(html);
    if (!win) {
      this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  async downloadPdf(): Promise<void> {
    const current = this.sow();
    this.downloading.set(true);
    try {
      const html = await this.buildHtml();
      if (!current || !html) {
        return;
      }
      await downloadHtmlAsPdf(
        html,
        buildSowPdfFilename(
          current.institutionName || current.institution?.name || '',
          current.sowNumber,
          current.version,
        ),
      );
    } catch (err: unknown) {
      console.error('SOW PDF download failed', err);
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    } finally {
      this.downloading.set(false);
    }
  }

  private async buildHtml(autoPrint = false): Promise<string | null> {
    const current = this.sow();
    if (!current) {
      return null;
    }
    return buildSowPdfHtml(
      current,
      buildSowPdfLabels(this.i18n),
      buildSowPdfOptions(this.i18n, autoPrint),
    );
  }

  private async refreshPreview(sow: PartnershipSow): Promise<void> {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    try {
      const html = await buildSowPdfHtml(
        sow,
        buildSowPdfLabels(this.i18n),
        buildSowPdfOptions(this.i18n, false),
      );
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      this.blobUrl = URL.createObjectURL(blob);
      this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
    } catch (err: unknown) {
      console.error('SOW PDF preview failed', err);
      this.previewUrl.set(null);
      this.error.set(this.i18n.t('partnerships.pdfDownloadFailed'));
    }
  }
}
