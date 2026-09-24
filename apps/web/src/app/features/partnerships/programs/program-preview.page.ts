import { Component, OnDestroy, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { programEnumLabel } from '../partnership.labels';
import { PartnershipProgram } from '../partnership.models';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import {
  buildProgramPdfFilename,
  buildProgramPdfHtml,
  openProgramPdfWindow,
} from './program-pdf';
import { downloadHtmlAsPdf } from './program-pdf-download';
import { buildProgramPdfLabels } from './program-pdf-labels';

@Component({
  selector: 'app-program-preview-page',
  imports: [RouterLink, MatButtonModule, ErrorState, LoadingSkeleton, TPipe],
  templateUrl: './program-preview.page.html',
  styleUrl: './program-preview.page.scss',
})
export class ProgramPreviewPage implements OnDestroy {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloading = signal(false);
  readonly program = signal<PartnershipProgram | null>(null);
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

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.getProgram(id).subscribe({
      next: (program) => {
        this.program.set(program);
        void this.refreshPreview(program).finally(() => this.loading.set(false));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.programsLoadError')));
      },
    });
  }

  async openPrintPreview(): Promise<void> {
    const html = await this.buildHtml();
    if (!html) {
      return;
    }
    const win = openProgramPdfWindow(html);
    if (!win) {
      this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  async downloadPdf(): Promise<void> {
    const current = this.program();
    this.downloading.set(true);
    try {
      const html = await this.buildHtml();
      if (!current || !html) {
        return;
      }
      await downloadHtmlAsPdf(html, buildProgramPdfFilename(current.name));
    } catch (err: unknown) {
      console.error('PDF download failed', err);
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    } finally {
      this.downloading.set(false);
    }
  }

  private async buildHtml(): Promise<string | null> {
    const current = this.program();
    if (!current) {
      return null;
    }
    return buildProgramPdfHtml(current, buildProgramPdfLabels(this.i18n), {
      dir: this.i18n.direction(),
      typeLabel: this.enumLabel('programType', current.programType),
      levelLabel: this.enumLabel('level', current.recommendedLevel),
      deliveryLabels: current.deliveryFormats.map((f) => this.enumLabel('deliveryFormat', f)),
      autoPrint: false,
    });
  }

  private async refreshPreview(program: PartnershipProgram): Promise<void> {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    const html = await buildProgramPdfHtml(program, buildProgramPdfLabels(this.i18n), {
      dir: this.i18n.direction(),
      typeLabel: this.enumLabel('programType', program.programType),
      levelLabel: this.enumLabel('level', program.recommendedLevel),
      deliveryLabels: program.deliveryFormats.map((f) => this.enumLabel('deliveryFormat', f)),
      autoPrint: false,
    });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    this.blobUrl = URL.createObjectURL(blob);
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
  }
}
