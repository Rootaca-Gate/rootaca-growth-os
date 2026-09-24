import { Component, OnDestroy, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { offeringEnumLabel, programEnumLabel } from '../partnership.labels';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { PartnershipOffering } from './offering.models';
import {
  buildOfferingPdfFilename,
  buildOfferingPdfHtml,
  openOfferingPdfWindow,
} from './offering-pdf';
import { downloadHtmlAsPdf } from './offering-pdf-download';
import { buildOfferingPdfLabels } from './offering-pdf-labels';

@Component({
  selector: 'app-offering-preview-page',
  imports: [RouterLink, MatButtonModule, ErrorState, LoadingSkeleton, TPipe],
  templateUrl: './offering-preview.page.html',
  styleUrl: './offering-preview.page.scss',
})
export class OfferingPreviewPage implements OnDestroy {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloading = signal(false);
  readonly offering = signal<PartnershipOffering | null>(null);
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

  enumLabel = (category: Parameters<typeof programEnumLabel>[1], value: string | null | undefined) =>
    programEnumLabel((key) => this.i18n.t(key), category, value);

  offeringLabel = (
    category: Parameters<typeof offeringEnumLabel>[1],
    value: string | null | undefined,
  ) => offeringEnumLabel((key) => this.i18n.t(key), category, value);

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.getOffering(id).subscribe({
      next: (offering) => {
        this.offering.set(offering);
        void this.refreshPreview(offering).finally(() => this.loading.set(false));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.offeringsLoadError')));
      },
    });
  }

  async openPrintPreview(): Promise<void> {
    const html = await this.buildHtml();
    if (!html) {
      return;
    }
    const win = openOfferingPdfWindow(html);
    if (!win) {
      this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  async downloadPdf(): Promise<void> {
    const current = this.offering();
    this.downloading.set(true);
    try {
      const html = await this.buildHtml();
      if (!current || !html) {
        return;
      }
      await downloadHtmlAsPdf(html, buildOfferingPdfFilename(current.program.name, current.name));
    } catch (err: unknown) {
      console.error('Offering PDF download failed', err);
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    } finally {
      this.downloading.set(false);
    }
  }

  private async buildHtml(autoPrint = false): Promise<string | null> {
    const current = this.offering();
    if (!current) {
      return null;
    }
    return buildOfferingPdfHtml(current, buildOfferingPdfLabels(this.i18n), {
      dir: this.i18n.direction(),
      deliveryFormatLabel: this.enumLabel('deliveryFormat', current.deliveryFormat),
      deliveryModeLabel: this.offeringLabel('deliveryMode', current.deliveryMode),
      durationUnitLabel: current.durationUnit
        ? this.offeringLabel('durationUnit', current.durationUnit)
        : '',
      levelLabel: this.enumLabel('level', current.resolved?.recommendedLevel),
      autoPrint,
    });
  }

  private async refreshPreview(offering: PartnershipOffering): Promise<void> {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    try {
      const html = await buildOfferingPdfHtml(offering, buildOfferingPdfLabels(this.i18n), {
        dir: this.i18n.direction(),
        deliveryFormatLabel: this.enumLabel('deliveryFormat', offering.deliveryFormat),
        deliveryModeLabel: this.offeringLabel('deliveryMode', offering.deliveryMode),
        durationUnitLabel: offering.durationUnit
          ? this.offeringLabel('durationUnit', offering.durationUnit)
          : '',
        levelLabel: this.enumLabel('level', offering.resolved?.recommendedLevel),
        autoPrint: false,
      });
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      this.blobUrl = URL.createObjectURL(blob);
      this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
    } catch (err: unknown) {
      console.error('Offering PDF preview failed', err);
      this.previewUrl.set(null);
      this.error.set(this.i18n.t('partnerships.pdfDownloadFailed'));
    }
  }
}
