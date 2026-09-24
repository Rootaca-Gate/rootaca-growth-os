import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import {
  OPPORTUNITY_EXPANSION_KINDS,
  OPPORTUNITY_TYPES,
  opportunityEnumLabel,
} from '../partnership.labels';
import { Institution } from '../partnership.models';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { DeliveryListItem } from '../delivery/delivery.models';
import { ProposalListItem } from '../proposals/proposal.models';
import { SowListItem } from '../sows/sow.models';
import { ReportListItem } from '../reports/report.models';
import {
  OpportunityExpansionKind,
  OpportunityType,
  OpportunityUserOption,
  PartnershipOpportunity,
} from './opportunity.models';

@Component({
  selector: 'app-opportunity-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  templateUrl: './opportunity-form.page.html',
  styleUrl: './opportunity-form.page.scss',
})
export class OpportunityFormPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);

  readonly opportunityTypes = OPPORTUNITY_TYPES;
  readonly expansionKinds = OPPORTUNITY_EXPANSION_KINDS;

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;

  readonly loading = signal(this.isEdit);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly institutions = signal<Institution[]>([]);
  readonly deliveries = signal<DeliveryListItem[]>([]);
  readonly sows = signal<SowListItem[]>([]);
  readonly proposals = signal<ProposalListItem[]>([]);
  readonly reports = signal<ReportListItem[]>([]);
  readonly owners = signal<OpportunityUserOption[]>([]);

  readonly createForm = this.fb.group({
    type: ['' as OpportunityType | '', Validators.required],
    institutionId: ['', Validators.required],
    title: [''],
    previousDeliveryId: [''],
    previousSowId: [''],
    previousProposalId: [''],
    previousReportId: [''],
    ownerId: [''],
    expectedDate: [''],
  });

  readonly editForm = this.fb.group({
    title: ['', Validators.required],
    ownerId: [''],
    expectedDate: [''],
    previousDeliveryId: [''],
    previousSowId: [''],
    previousProposalId: [''],
    previousReportId: [''],
    expansionKinds: [[] as OpportunityExpansionKind[]],
    renewalGrades: [''],
    renewalGroupsNote: [''],
    renewalDurationNote: [''],
    renewalDeliveryMode: [''],
    renewalScopeNotes: [''],
    expansionScopeNotes: [''],
    existingScopeNotes: [''],
    proposedScopeNotes: [''],
    reason: [''],
    nextSteps: [''],
    internalNotes: [''],
    schoolFeedback: [''],
    feedbackSummary: [''],
    feedbackScore: [''],
    feedbackRequestedPrograms: [''],
    feedbackRequestedChanges: [''],
    feedbackKeyComments: [''],
    feedbackDate: [''],
    feedbackRecordedBy: [''],
  });

  constructor() {
    this.loadInstitutions();
    this.loadOwners();
    this.loadDeliveries();
    this.loadSows();
    this.loadProposals();
    this.loadReports();
    if (this.isEdit && this.editId) {
      this.load(this.editId);
    } else {
      const qp = this.route.snapshot.queryParamMap;
      const type = qp.get('type');
      if (type) {
        this.createForm.controls.type.setValue(type as OpportunityType);
      }
      const deliveryId = qp.get('deliveryId');
      if (deliveryId) {
        this.createForm.controls.previousDeliveryId.setValue(deliveryId);
      }
      const reportId = qp.get('reportId');
      if (reportId) {
        this.createForm.controls.previousReportId.setValue(reportId);
      }
      const institutionId = qp.get('institutionId');
      if (institutionId) {
        this.createForm.controls.institutionId.setValue(institutionId);
      }
      const sowId = qp.get('sowId');
      if (sowId) {
        this.createForm.controls.previousSowId.setValue(sowId);
      }
    }
  }

  oppLabel = (
    category: Parameters<typeof opportunityEnumLabel>[1],
    value: string | null | undefined,
  ) => opportunityEnumLabel((key) => this.i18n.t(key), category, value);

  private loadInstitutions(): void {
    this.api.listInstitutions({ pageSize: 200, sortBy: 'name', sortOrder: 'asc' }).subscribe({
      next: (result) => this.institutions.set(result.items),
      error: () => this.institutions.set([]),
    });
  }

  private loadOwners(): void {
    this.api.listOpportunityUsers().subscribe({
      next: (users) => this.owners.set(users),
      error: () => this.owners.set([]),
    });
  }

  private loadDeliveries(): void {
    this.api.listDeliveries({ pageSize: 200 }).subscribe({
      next: (result) => this.deliveries.set(result.items),
      error: () => this.deliveries.set([]),
    });
  }

  private loadSows(): void {
    this.api.listSows({ pageSize: 200 }).subscribe({
      next: (result) => this.sows.set(result.items),
      error: () => this.sows.set([]),
    });
  }

  private loadProposals(): void {
    this.api.listProposals({ pageSize: 200 }).subscribe({
      next: (result) => this.proposals.set(result.items),
      error: () => this.proposals.set([]),
    });
  }

  private loadReports(): void {
    this.api.listReports({ pageSize: 200 }).subscribe({
      next: (result) => this.reports.set(result.items),
      error: () => this.reports.set([]),
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.api.getOpportunity(id).subscribe({
      next: (opp) => {
        if (opp.archivedAt || opp.status === 'CONVERTED' || opp.status === 'CLOSED') {
          void this.router.navigate(['/partnerships/renewals', id]);
          return;
        }
        this.patchEditForm(opp);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.renewalsLoadError')));
      },
    });
  }

  private patchEditForm(opp: PartnershipOpportunity): void {
    this.editForm.patchValue({
      title: opp.title,
      ownerId: opp.ownerId ?? '',
      expectedDate: opp.expectedDate?.slice(0, 10) ?? '',
      previousDeliveryId: opp.previousDelivery?.id ?? '',
      previousSowId: opp.previousSow?.id ?? '',
      previousProposalId: opp.previousProposal?.id ?? '',
      previousReportId: opp.previousReport?.id ?? '',
      expansionKinds: opp.expansionKinds.map((k) => k.kind),
      renewalGrades: opp.renewalGrades,
      renewalGroupsNote: opp.renewalGroupsNote,
      renewalDurationNote: opp.renewalDurationNote,
      renewalDeliveryMode: opp.renewalDeliveryMode,
      renewalScopeNotes: opp.renewalScopeNotes,
      expansionScopeNotes: opp.expansionScopeNotes,
      existingScopeNotes: opp.existingScopeNotes,
      proposedScopeNotes: opp.proposedScopeNotes,
      reason: opp.reason,
      nextSteps: opp.nextSteps,
      internalNotes: opp.internalNotes,
      schoolFeedback: opp.schoolFeedback,
      feedbackSummary: opp.feedbackSummary,
      feedbackScore: opp.feedbackScore === null ? '' : String(opp.feedbackScore),
      feedbackRequestedPrograms: opp.feedbackRequestedPrograms,
      feedbackRequestedChanges: opp.feedbackRequestedChanges,
      feedbackKeyComments: opp.feedbackKeyComments,
      feedbackDate: opp.feedbackDate?.slice(0, 10) ?? '',
      feedbackRecordedBy: opp.feedbackRecordedBy,
    });
  }

  create(): void {
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) {
      return;
    }
    const raw = this.createForm.getRawValue();
    const type = raw.type as OpportunityType;
    const institutionId = String(raw.institutionId ?? '').trim();
    if (!type || !institutionId) {
      return;
    }
    this.submitting.set(true);
    this.api
      .createOpportunity({
        type,
        institutionId,
        title: raw.title?.trim() || undefined,
        previousDeliveryId: raw.previousDeliveryId || undefined,
        previousSowId: raw.previousSowId || undefined,
        previousProposalId: raw.previousProposalId || undefined,
        previousReportId: raw.previousReportId || undefined,
        ownerId: raw.ownerId || undefined,
        expectedDate: raw.expectedDate || null,
      })
      .subscribe({
        next: (opp) => {
          this.submitting.set(false);
          this.snackBar.open(
            this.i18n.t('partnerships.renewalsCreated'),
            this.i18n.t('common.ok'),
            { duration: 2500 },
          );
          void this.router.navigate(['/partnerships/renewals', opp.id, 'edit']);
        },
        error: (err: unknown) => this.reportError(err),
      });
  }

  save(): void {
    if (!this.editId) {
      return;
    }
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) {
      return;
    }
    const raw = this.editForm.getRawValue();
    const scoreRaw = String(raw.feedbackScore ?? '').trim();
    const feedbackScore = scoreRaw === '' ? undefined : Number(scoreRaw);
    this.submitting.set(true);
    this.api
      .updateOpportunity(this.editId, {
        title: raw.title ?? undefined,
        ownerId: raw.ownerId || null,
        expectedDate: raw.expectedDate || null,
        previousDeliveryId: raw.previousDeliveryId || null,
        previousSowId: raw.previousSowId || null,
        previousProposalId: raw.previousProposalId || null,
        previousReportId: raw.previousReportId || null,
        expansionKinds: (raw.expansionKinds ?? []).map((kind, index) => ({
          kind,
          sortOrder: index,
        })),
        renewalGrades: raw.renewalGrades ?? undefined,
        renewalGroupsNote: raw.renewalGroupsNote ?? undefined,
        renewalDurationNote: raw.renewalDurationNote ?? undefined,
        renewalDeliveryMode: raw.renewalDeliveryMode ?? undefined,
        renewalScopeNotes: raw.renewalScopeNotes ?? undefined,
        expansionScopeNotes: raw.expansionScopeNotes ?? undefined,
        existingScopeNotes: raw.existingScopeNotes ?? undefined,
        proposedScopeNotes: raw.proposedScopeNotes ?? undefined,
        reason: raw.reason ?? undefined,
        nextSteps: raw.nextSteps ?? undefined,
        internalNotes: raw.internalNotes ?? undefined,
        schoolFeedback: raw.schoolFeedback ?? undefined,
        feedbackSummary: raw.feedbackSummary ?? undefined,
        feedbackScore,
        feedbackRequestedPrograms: raw.feedbackRequestedPrograms ?? undefined,
        feedbackRequestedChanges: raw.feedbackRequestedChanges ?? undefined,
        feedbackKeyComments: raw.feedbackKeyComments ?? undefined,
        feedbackDate: raw.feedbackDate || null,
        feedbackRecordedBy: raw.feedbackRecordedBy ?? undefined,
      })
      .subscribe({
        next: (opp) => {
          this.submitting.set(false);
          this.snackBar.open(
            this.i18n.t('partnerships.renewalsSaved'),
            this.i18n.t('common.ok'),
            { duration: 2500 },
          );
          void this.router.navigate(['/partnerships/renewals', opp.id]);
        },
        error: (err: unknown) => this.reportError(err),
      });
  }

  private reportError(err: unknown): void {
    this.submitting.set(false);
    this.snackBar.open(
      partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
      this.i18n.t('common.ok'),
      { duration: 4000 },
    );
  }
}
