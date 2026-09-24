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
import { buildProposalPdfOptions } from './proposal-display';
import { PartnershipProposal } from './proposal.models';
import {
  buildProposalPdfFilename,
  buildProposalPdfHtml,
  openProposalPdfWindow,
} from './proposal-pdf';
import { downloadHtmlAsPdf } from './proposal-pdf-download';
import { buildProposalPdfLabels } from './proposal-pdf-labels';

@Component({
  selector: 'app-proposal-preview-page',
  imports: [RouterLink, MatButtonModule, ErrorState, LoadingSkeleton, TPipe],
  templateUrl: './proposal-preview.page.html',
  styleUrl: './proposal-preview.page.scss',
})
export class ProposalPreviewPage implements OnDestroy {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloading = signal(false);
  readonly proposal = signal<PartnershipProposal | null>(null);
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
    this.api.getProposal(id).subscribe({
      next: (proposal) => {
        this.proposal.set(proposal);
        void this.refreshPreview(proposal).finally(() => this.loading.set(false));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(
          partnershipErrorMessage(err, this.i18n.t('partnerships.proposalsLoadError')),
        );
      },
    });
  }

  async openPrintPreview(): Promise<void> {
    const html = await this.buildHtml();
    if (!html) {
      return;
    }
    const win = openProposalPdfWindow(html);
    if (!win) {
      this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  async downloadPdf(): Promise<void> {
    const current = this.proposal();
    this.downloading.set(true);
    try {
      const html = await this.buildHtml();
      if (!current || !html) {
        return;
      }
      await downloadHtmlAsPdf(
        html,
        buildProposalPdfFilename(current.institutionName || current.institution?.name || '', current.title),
      );
    } catch (err: unknown) {
      console.error('Proposal PDF download failed', err);
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    } finally {
      this.downloading.set(false);
    }
  }

  private async buildHtml(autoPrint = false): Promise<string | null> {
    const current = this.proposal();
    if (!current) {
      return null;
    }
    return buildProposalPdfHtml(
      current,
      buildProposalPdfLabels(this.i18n),
      buildProposalPdfOptions(this.i18n, autoPrint),
    );
  }

  private async refreshPreview(proposal: PartnershipProposal): Promise<void> {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    try {
      const html = await buildProposalPdfHtml(
        proposal,
        buildProposalPdfLabels(this.i18n),
        buildProposalPdfOptions(this.i18n, false),
      );
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      this.blobUrl = URL.createObjectURL(blob);
      this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
    } catch (err: unknown) {
      console.error('Proposal PDF preview failed', err);
      this.previewUrl.set(null);
      this.error.set(this.i18n.t('partnerships.pdfDownloadFailed'));
    }
  }
}
