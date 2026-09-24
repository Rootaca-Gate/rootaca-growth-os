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
import { opportunityEnumLabel } from '../partnership.labels';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import {
  blankDisplay,
  formatCount,
  formatDate,
  formatPercent,
  opportunityStatusClass,
  opportunityTypeClass,
} from './opportunity-display';
import { OpportunityStatus, PartnershipOpportunity } from './opportunity.models';
import {
  PartnershipBreadcrumb,
  PartnershipBreadcrumbs,
  partnershipJourneyCrumbs,
} from '../shared/partnership-breadcrumbs';

@Component({
  selector: 'app-opportunity-details-page',
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
  templateUrl: './opportunity-details.page.html',
  styleUrl: './opportunity-details.page.scss',
})
export class OpportunityDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly opportunity = signal<PartnershipOpportunity | null>(null);

  readonly statusControl = new FormControl<OpportunityStatus | ''>('', {
    nonNullable: true,
  });

  readonly nextStatuses = computed(
    () => this.opportunity()?.allowedTransitions ?? [],
  );

  readonly snapshot = computed(() => this.opportunity()?.historicalSnapshot ?? null);

  readonly breadcrumbs = computed<PartnershipBreadcrumb[]>(() => {
    const current = this.opportunity();
    if (!current) {
      return [];
    }
    return partnershipJourneyCrumbs(
      (key) => this.i18n.t(key),
      'growth',
      'nav.renewals',
      '/partnerships/renewals',
      current.opportunityNumber || this.i18n.t('partnerships.breadcrumbRenewal'),
    );
  });

  constructor() {
    this.reload();
  }

  oppLabel = (
    category: Parameters<typeof opportunityEnumLabel>[1],
    value: string | null | undefined,
  ) => opportunityEnumLabel((key) => this.i18n.t(key), category, value);

  statusClass(status: OpportunityStatus): string {
    return opportunityStatusClass(status);
  }

  typeClass = opportunityTypeClass;
  blank = blankDisplay;
  pct = formatPercent;
  count = formatCount;
  dateText = formatDate;

  canCreateProposal(opp: PartnershipOpportunity): boolean {
    return (
      !opp.newProposal &&
      !opp.archivedAt &&
      opp.status !== 'CONVERTED' &&
      opp.status !== 'CLOSED'
    );
  }

  canCreateSow(opp: PartnershipOpportunity): boolean {
    return (
      !opp.newSow &&
      !!opp.newProposal &&
      !opp.archivedAt &&
      (opp.status === 'ACCEPTED' || opp.newProposal.number !== null)
    );
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.getOpportunity(id).subscribe({
      next: (opp) => {
        this.opportunity.set(opp);
        this.statusControl.setValue('');
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.renewalsLoadError')));
      },
    });
  }

  back(): void {
    void this.router.navigate(['/partnerships/renewals']);
  }

  changeStatus(): void {
    const current = this.opportunity();
    const next = this.statusControl.value;
    if (!current || !next) {
      return;
    }
    if (next === 'CLOSED' && !confirm(this.i18n.t('partnerships.renewalsCloseConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.changeOpportunityStatus(current.id, next).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.opportunity.set(updated);
        this.statusControl.setValue('');
        this.snackBar.open(
          this.i18n.t('partnerships.renewalsStatusChanged'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  createProposal(): void {
    const current = this.opportunity();
    if (!current) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.renewalsCreateProposalConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.createOpportunityProposal(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.opportunity.set(updated);
        this.snackBar.open(
          this.i18n.t('partnerships.renewalsProposalCreated'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        if (updated.newProposal?.id) {
          void this.router.navigate(['/partnerships/proposals', updated.newProposal.id, 'edit'], {
            queryParams: { opportunityId: updated.id },
          });
        }
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  createSow(): void {
    const current = this.opportunity();
    if (!current) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.renewalsCreateSowConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.createOpportunitySow(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.opportunity.set(updated);
        this.snackBar.open(
          this.i18n.t('partnerships.renewalsSowCreated'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        if (updated.newSow?.id) {
          void this.router.navigate(['/partnerships/sows', updated.newSow.id]);
        }
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  archive(): void {
    const current = this.opportunity();
    if (!current || current.archivedAt) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.renewalsArchiveConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.archiveOpportunity(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.opportunity.set(updated);
      },
      error: (err: unknown) => this.reportError(err),
    });
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
