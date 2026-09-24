import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { EmptyState } from '../../../shared/empty-state';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { offeringEnumLabel, programEnumLabel, proposalEnumLabel } from '../partnership.labels';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { formatDuration, formatGroupSize, offeringFieldDisplay, skillTags } from './offering-display';
import { PartnershipOffering } from './offering.models';
import { ProposalListItem } from '../proposals/proposal.models';
import { buildOfferingPdfHtml, openOfferingPdfWindow } from './offering-pdf';
import { buildOfferingPdfLabels } from './offering-pdf-labels';
import {
  PartnershipBreadcrumb,
  PartnershipBreadcrumbs,
  partnershipJourneyCrumbs,
} from '../shared/partnership-breadcrumbs';

@Component({
  selector: 'app-offering-details-page',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    PartnershipBreadcrumbs,
    TPipe,
  ],
  templateUrl: './offering-details.page.html',
  styleUrl: './offering-details.page.scss',
})
export class OfferingDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly archiving = signal(false);
  readonly offering = signal<PartnershipOffering | null>(null);
  readonly usedInProposals = signal<ProposalListItem[]>([]);

  readonly breadcrumbs = computed<PartnershipBreadcrumb[]>(() => {
    const current = this.offering();
    if (!current) {
      return [];
    }
    return partnershipJourneyCrumbs(
      (key) => this.i18n.t(key),
      'catalog',
      'nav.offerings',
      '/partnerships/offerings',
      current.name || this.i18n.t('partnerships.breadcrumbOffering'),
    );
  });

  readonly durationText = computed(() => {
    const current = this.offering();
    return current ? formatDuration(current, (u) => this.offeringLabel('durationUnit', u)) : null;
  });
  readonly groupSizeText = computed(() => {
    const current = this.offering();
    return current ? formatGroupSize(current) : null;
  });

  constructor() {
    this.reload();
  }

  enumLabel = (category: Parameters<typeof programEnumLabel>[1], value: string | null | undefined) =>
    programEnumLabel((key) => this.i18n.t(key), category, value);

  offeringLabel = (
    category: Parameters<typeof offeringEnumLabel>[1],
    value: string | null | undefined,
  ) => offeringEnumLabel((key) => this.i18n.t(key), category, value);

  proposalLabel = (
    category: Parameters<typeof proposalEnumLabel>[1],
    value: string | null | undefined,
  ) => proposalEnumLabel((key) => this.i18n.t(key), category, value);

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
        this.loading.set(false);
        this.loadUsedInProposals(offering.id);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.offeringsLoadError')));
      },
    });
  }

  private loadUsedInProposals(offeringId: string): void {
    this.usedInProposals.set([]);
    this.api.listProposals({ offeringId, pageSize: 20 }).subscribe({
      next: (page) => this.usedInProposals.set(page.items),
      error: () => this.usedInProposals.set([]),
    });
  }

  displayText(value: string | null | undefined): string {
    return offeringFieldDisplay(value, this.i18n.t('partnerships.notConfigured'));
  }

  tags(value: string | null | undefined): string[] {
    return skillTags(value);
  }

  statusClass(status: string): string {
    return `status-badge status-${status.toLowerCase()}`;
  }

  archive(): void {
    const current = this.offering();
    if (!current || current.status === 'ARCHIVED') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.offeringsArchiveConfirm'))) {
      return;
    }
    this.archiving.set(true);
    this.api.archiveOffering(current.id).subscribe({
      next: (updated) => {
        this.archiving.set(false);
        this.offering.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.offeringsArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => {
        this.archiving.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  duplicate(): void {
    const current = this.offering();
    if (!current) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.offeringsDuplicateConfirm'))) {
      return;
    }
    this.api.duplicateOffering(current.id).subscribe({
      next: (copy) => {
        this.snackBar.open(
          this.i18n.t('partnerships.offeringsDuplicated'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        void this.router.navigate(['/partnerships/offerings', copy.id, 'edit']);
      },
      error: (err: unknown) => {
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  async generatePdf(): Promise<void> {
    const current = this.offering();
    if (!current) {
      return;
    }
    try {
      const html = await buildOfferingPdfHtml(current, buildOfferingPdfLabels(this.i18n), {
        dir: this.i18n.direction(),
        deliveryFormatLabel: this.enumLabel('deliveryFormat', current.deliveryFormat),
        deliveryModeLabel: this.offeringLabel('deliveryMode', current.deliveryMode),
        durationUnitLabel: current.durationUnit
          ? this.offeringLabel('durationUnit', current.durationUnit)
          : '',
        levelLabel: this.enumLabel('level', current.resolved?.recommendedLevel),
      });
      const win = openOfferingPdfWindow(html);
      if (!win) {
        this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
          duration: 4000,
        });
      }
    } catch (err: unknown) {
      console.error('Offering PDF preview failed', err);
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  back(): void {
    void this.router.navigateByUrl('/partnerships/offerings');
  }
}
