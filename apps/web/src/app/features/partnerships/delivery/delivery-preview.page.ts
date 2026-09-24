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
import { buildDeliveryPdfFilename, buildDeliveryPdfOptions } from './delivery-display';
import { PartnershipDelivery } from './delivery.models';
import { buildDeliveryPdfHtml, downloadHtmlAsPdf, openDeliveryPdfWindow } from './delivery-pdf';
import { buildDeliveryPdfLabels } from './delivery-pdf-labels';

@Component({
  selector: 'app-delivery-preview-page',
  imports: [RouterLink, MatButtonModule, ErrorState, LoadingSkeleton, TPipe],
  templateUrl: './delivery-preview.page.html',
  styleUrl: './delivery-preview.page.scss',
})
export class DeliveryPreviewPage implements OnDestroy {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloading = signal(false);
  readonly delivery = signal<PartnershipDelivery | null>(null);
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
    this.api.getDelivery(id).subscribe({
      next: (delivery) => {
        this.delivery.set(delivery);
        void this.refreshPreview(delivery).finally(() => this.loading.set(false));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.deliveryLoadError')));
      },
    });
  }

  async openPrintPreview(): Promise<void> {
    const html = await this.buildHtml(true);
    if (!html) {
      return;
    }
    const win = openDeliveryPdfWindow(html);
    if (!win) {
      this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  async downloadPdf(): Promise<void> {
    const current = this.delivery();
    this.downloading.set(true);
    try {
      const html = await this.buildHtml();
      if (!current || !html) {
        return;
      }
      await downloadHtmlAsPdf(
        html,
        buildDeliveryPdfFilename(current.institution?.name || '', current.deliveryNumber),
      );
    } catch (err: unknown) {
      console.error('Delivery PDF download failed', err);
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    } finally {
      this.downloading.set(false);
    }
  }

  private async buildHtml(autoPrint = false): Promise<string | null> {
    const current = this.delivery();
    if (!current) {
      return null;
    }
    return buildDeliveryPdfHtml(
      current,
      buildDeliveryPdfLabels(this.i18n),
      buildDeliveryPdfOptions(this.i18n, autoPrint),
    );
  }

  private async refreshPreview(delivery: PartnershipDelivery): Promise<void> {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    try {
      const html = await buildDeliveryPdfHtml(
        delivery,
        buildDeliveryPdfLabels(this.i18n),
        buildDeliveryPdfOptions(this.i18n, false),
      );
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      this.blobUrl = URL.createObjectURL(blob);
      this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
    } catch (err: unknown) {
      console.error('Delivery PDF preview failed', err);
      this.previewUrl.set(null);
      this.error.set(this.i18n.t('partnerships.pdfDownloadFailed'));
    }
  }
}
