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
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import {
  offeringEnumLabel,
  programEnumLabel,
  proposalEnumLabel,
} from '../partnership.labels';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import {
  blankDisplay,
  buildProposalPdfOptions,
  formatSnapshotDuration,
  formatSnapshotGroupSize,
} from './proposal-display';
import { formatMoney } from './proposal-pricing';
import {
  PartnershipProposal,
  PartnershipProposalStatus,
  ProposalOfferingLine,
} from './proposal.models';
import { buildProposalPdfHtml, openProposalPdfWindow } from './proposal-pdf';
import { buildProposalPdfLabels } from './proposal-pdf-labels';
import { SowListItem } from '../sows/sow.models';
import { EmptyState } from '../../../shared/empty-state';
import {
  PartnershipBreadcrumb,
  PartnershipBreadcrumbs,
  partnershipJourneyCrumbs,
} from '../shared/partnership-breadcrumbs';

/** Allowed UI transitions (ARCHIVED via archive; SENT prefer send). */
const STATUS_TRANSITIONS: Record<PartnershipProposalStatus, PartnershipProposalStatus[]> = {
  DRAFT: [],
  SENT: ['VIEWED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  VIEWED: ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  UNDER_REVIEW: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
  ARCHIVED: [],
};

@Component({
  selector: 'app-proposal-details-page',
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
    PartnershipBreadcrumbs,
    TPipe,
  ],
  templateUrl: './proposal-details.page.html',
  styleUrl: './proposal-details.page.scss',
})
export class ProposalDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly proposal = signal<PartnershipProposal | null>(null);
  readonly relatedSows = signal<SowListItem[]>([]);
  readonly statusControl = new FormControl<PartnershipProposalStatus | ''>('', {
    nonNullable: true,
  });

  readonly breadcrumbs = computed<PartnershipBreadcrumb[]>(() => {
    const current = this.proposal();
    if (!current) {
      return [];
    }
    return partnershipJourneyCrumbs(
      (key) => this.i18n.t(key),
      'sales',
      'nav.proposals',
      '/partnerships/proposals',
      current.proposalNumber || this.i18n.t('partnerships.breadcrumbProposal'),
    );
  });

  readonly nextStatuses = computed(() => {
    const current = this.proposal();
    if (!current) {
      return [] as PartnershipProposalStatus[];
    }
    return STATUS_TRANSITIONS[current.status] ?? [];
  });

  constructor() {
    this.reload();
  }

  proposalLabel = (
    category: Parameters<typeof proposalEnumLabel>[1],
    value: string | null | undefined,
  ) => proposalEnumLabel((key) => this.i18n.t(key), category, value);

  programLabel = (
    category: Parameters<typeof programEnumLabel>[1],
    value: string | null | undefined,
  ) => programEnumLabel((key) => this.i18n.t(key), category, value);

  offeringLabel = (
    category: Parameters<typeof offeringEnumLabel>[1],
    value: string | null | undefined,
  ) => offeringEnumLabel((key) => this.i18n.t(key), category, value);

  display(value: string | null | undefined): string {
    return blankDisplay(value, this.i18n.t('partnerships.noValue'));
  }

  money(value: number | null | undefined, currency?: string | null): string {
    const current = this.proposal();
    return formatMoney(
      value,
      currency ?? current?.currency,
      this.i18n.t('partnerships.noValue'),
    );
  }

  statusClass(status: string): string {
    return `status-badge status-${status.toLowerCase().replace(/_/g, '-')}`;
  }

  canEdit(current: PartnershipProposal): boolean {
    return !current.isLocked && current.status === 'DRAFT';
  }

  durationText(line: ProposalOfferingLine): string {
    return (
      formatSnapshotDuration(line, (u) => this.offeringLabel('durationUnit', u)) ||
      this.i18n.t('partnerships.noValue')
    );
  }

  groupSizeText(line: ProposalOfferingLine): string {
    return formatSnapshotGroupSize(line) || this.i18n.t('partnerships.noValue');
  }

  institutionLocation(institution: {
    city?: string | null;
    governorate?: string | null;
  }): string {
    return [institution.city, institution.governorate].filter((part) => !!part).join(', ');
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
        this.statusControl.setValue('');
        this.loading.set(false);
        this.loadRelatedSows(proposal.id);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(
          partnershipErrorMessage(err, this.i18n.t('partnerships.proposalsLoadError')),
        );
      },
    });
  }

  private loadRelatedSows(proposalId: string): void {
    this.relatedSows.set([]);
    this.api.listSows({ proposalId, pageSize: 20 }).subscribe({
      next: (page) => this.relatedSows.set(page.items),
      error: () => this.relatedSows.set([]),
    });
  }

  back(): void {
    void this.router.navigateByUrl('/partnerships/proposals');
  }

  archive(): void {
    const current = this.proposal();
    if (!current || current.status === 'ARCHIVED') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.proposalsArchiveConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.archiveProposal(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.proposal.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.proposalsArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  duplicate(): void {
    const current = this.proposal();
    if (!current) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.proposalsDuplicateConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.duplicateProposal(current.id).subscribe({
      next: (copy) => {
        this.busy.set(false);
        this.snackBar.open(
          this.i18n.t('partnerships.proposalsDuplicated'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        void this.router.navigate(['/partnerships/proposals', copy.id, 'edit']);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  send(): void {
    const current = this.proposal();
    if (!current || current.status !== 'DRAFT') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.proposalsSendConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.sendProposal(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.proposal.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.proposalsSent'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  revise(): void {
    const current = this.proposal();
    if (!current || !current.isLocked) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.proposalsReviseConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.reviseProposal(current.id).subscribe({
      next: (draft) => {
        this.busy.set(false);
        this.snackBar.open(this.i18n.t('partnerships.proposalsRevised'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/proposals', draft.id, 'edit']);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  share(): void {
    const current = this.proposal();
    if (!current) {
      return;
    }
    this.busy.set(true);
    this.api.ensureProposalShareToken(current.id).subscribe({
      next: async (result) => {
        this.busy.set(false);
        const token = result.shareToken?.trim();
        if (!token) {
          this.snackBar.open(
            partnershipErrorMessage(null, this.i18n.t('partnerships.saveFailed')),
            this.i18n.t('common.ok'),
            { duration: 4000 },
          );
          return;
        }
        this.proposal.update((p) => (p ? { ...p, shareToken: token } : p));
        try {
          await navigator.clipboard.writeText(token);
          this.snackBar.open(
            this.i18n.t('partnerships.proposalsShareCopied'),
            this.i18n.t('common.ok'),
            { duration: 2500 },
          );
        } catch {
          this.snackBar.open(
            `${this.i18n.t('partnerships.proposalsShareReady')}: ${token}`,
            this.i18n.t('common.ok'),
            { duration: 5000 },
          );
        }
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  changeStatus(): void {
    const current = this.proposal();
    const next = this.statusControl.value;
    if (!current || !next) {
      return;
    }
    this.busy.set(true);
    this.api.changeProposalStatus(current.id, next).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.proposal.set(updated);
        this.statusControl.setValue('');
        this.snackBar.open(this.i18n.t('partnerships.statusUpdated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  canCreateSow(current: PartnershipProposal): boolean {
    return current.status === 'ACCEPTED' && this.permissions.canWrite();
  }

  createSow(): void {
    const current = this.proposal();
    if (!current || !this.canCreateSow(current)) {
      return;
    }
    this.busy.set(true);
    this.api.createSowFromProposal(current.id).subscribe({
      next: (sow) => {
        this.busy.set(false);
        this.snackBar.open(this.i18n.t('partnerships.sowsCreated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/sows', sow.id, 'edit']);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  async generatePdf(): Promise<void> {
    const current = this.proposal();
    if (!current) {
      return;
    }
    try {
      const html = await buildProposalPdfHtml(
        current,
        buildProposalPdfLabels(this.i18n),
        buildProposalPdfOptions(this.i18n),
      );
      const win = openProposalPdfWindow(html);
      if (!win) {
        this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
          duration: 4000,
        });
      }
    } catch {
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }
}
