import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import {
  offeringEnumLabel,
  programEnumLabel,
  sowEnumLabel,
} from '../partnership.labels';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import {
  blankDisplay,
  buildSowPdfOptions,
  buildSowRelationshipChain,
  formatScopeDuration,
  formatScopeGroupSize,
  sowStatusClass,
  SowRelationshipLink,
} from './sow-display';
import {
  PartnershipSow,
  PartnershipSowChangeImpact,
  PartnershipSowStatus,
  SowScopeOffering,
} from './sow.models';
import { buildSowPdfHtml, openSowPdfWindow } from './sow-pdf';
import { buildSowPdfLabels } from './sow-pdf-labels';

/** Allowed UI transitions mirror the API ALLOWED_TRANSITIONS map. */
const STATUS_TRANSITIONS: Record<PartnershipSowStatus, PartnershipSowStatus[]> = {
  DRAFT: ['PENDING_SIGNATURE', 'CANCELLED'],
  PENDING_SIGNATURE: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED', 'EXPIRED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

@Component({
  selector: 'app-sow-details-page',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  templateUrl: './sow-details.page.html',
  styleUrl: './sow-details.page.scss',
})
export class SowDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly sow = signal<PartnershipSow | null>(null);
  readonly showChangeRequestForm = signal(false);

  readonly statusControl = new FormControl<PartnershipSowStatus | ''>('', { nonNullable: true });

  readonly changeRequestForm = new FormGroup({
    requestedBy: new FormControl('', { nonNullable: true }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1)],
    }),
    impact: new FormControl<PartnershipSowChangeImpact>('MINOR', { nonNullable: true }),
  });

  readonly impacts: PartnershipSowChangeImpact[] = ['MINOR', 'MAJOR'];

  readonly nextStatuses = computed(() => {
    const current = this.sow();
    if (!current) {
      return [] as PartnershipSowStatus[];
    }
    return STATUS_TRANSITIONS[current.status] ?? [];
  });

  readonly relationshipChain = computed<SowRelationshipLink[]>(() => {
    const current = this.sow();
    if (!current) {
      return [];
    }
    return buildSowRelationshipChain(current, {
      program: this.i18n.t('partnerships.sowChainProgram'),
      offering: this.i18n.t('partnerships.sowChainOffering'),
      proposal: this.i18n.t('partnerships.sowChainProposal'),
      sow: this.i18n.t('partnerships.sowChainSow'),
    });
  });

  readonly pendingChangeRequests = computed(() =>
    (this.sow()?.changeRequests ?? []).filter((cr) => cr.approvalStatus === 'PENDING'),
  );

  constructor() {
    this.reload();
  }

  sowLabel = (
    category: Parameters<typeof sowEnumLabel>[1],
    value: string | null | undefined,
  ) => sowEnumLabel((key) => this.i18n.t(key), category, value);

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

  statusClass(status: string): string {
    return sowStatusClass(status);
  }

  canEdit(current: PartnershipSow): boolean {
    return !current.isLocked && current.status === 'DRAFT';
  }

  durationText(line: SowScopeOffering): string {
    return (
      formatScopeDuration(line, (u) => this.offeringLabel('durationUnit', u)) ||
      this.i18n.t('partnerships.noValue')
    );
  }

  groupSizeText(line: SowScopeOffering): string {
    return formatScopeGroupSize(line) || this.i18n.t('partnerships.noValue');
  }

  institutionLocation(institution: { city?: string | null; governorate?: string | null }): string {
    return [institution.city, institution.governorate].filter((part) => !!part).join(', ');
  }

  inScopeItems(current: PartnershipSow) {
    return current.scopeItems.filter((item) => item.kind === 'IN_SCOPE');
  }

  outScopeItems(current: PartnershipSow) {
    return current.scopeItems.filter((item) => item.kind === 'OUT_OF_SCOPE');
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
        this.statusControl.setValue('');
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.sowsLoadError')));
      },
    });
  }

  back(): void {
    void this.router.navigateByUrl('/partnerships/sows');
  }

  archive(): void {
    const current = this.sow();
    if (!current || current.archivedAt) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.sowsArchiveConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.archiveSow(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.sow.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.sowsArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  duplicate(): void {
    const current = this.sow();
    if (!current) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.sowsDuplicateConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.duplicateSow(current.id).subscribe({
      next: (copy) => {
        this.busy.set(false);
        this.snackBar.open(this.i18n.t('partnerships.sowsDuplicated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/sows', copy.id, 'edit']);
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  changeStatus(): void {
    const current = this.sow();
    const next = this.statusControl.value;
    if (!current || !next) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.sowsStatusConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.changeSowStatus(current.id, next).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.sow.set(updated);
        this.statusControl.setValue('');
        this.snackBar.open(this.i18n.t('partnerships.statusUpdated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  toggleChangeRequestForm(): void {
    this.showChangeRequestForm.update((open) => !open);
  }

  submitChangeRequest(): void {
    const current = this.sow();
    if (!current) {
      return;
    }
    if (this.changeRequestForm.invalid) {
      this.changeRequestForm.markAllAsTouched();
      return;
    }
    const raw = this.changeRequestForm.getRawValue();
    this.busy.set(true);
    this.api
      .createSowChangeRequest(current.id, {
        requestedBy: raw.requestedBy.trim() || undefined,
        description: raw.description.trim(),
        impact: raw.impact,
      })
      .subscribe({
        next: (updated) => {
          this.busy.set(false);
          this.sow.set(updated);
          this.changeRequestForm.reset({ requestedBy: '', description: '', impact: 'MINOR' });
          this.showChangeRequestForm.set(false);
          this.snackBar.open(
            this.i18n.t('partnerships.sowsChangeRequestCreated'),
            this.i18n.t('common.ok'),
            { duration: 2500 },
          );
        },
        error: (err: unknown) => this.reportError(err),
      });
  }

  decideChangeRequest(crId: string, decision: 'APPROVED' | 'REJECTED'): void {
    const current = this.sow();
    if (!current) {
      return;
    }
    const confirmKey =
      decision === 'APPROVED'
        ? 'partnerships.sowsApproveCrConfirm'
        : 'partnerships.sowsRejectCrConfirm';
    if (!confirm(this.i18n.t(confirmKey))) {
      return;
    }
    this.busy.set(true);
    this.api.decideSowChangeRequest(current.id, crId, { decision }).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.sow.set(updated);
        this.snackBar.open(
          this.i18n.t('partnerships.sowsChangeRequestDecided'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  async generatePdf(): Promise<void> {
    const current = this.sow();
    if (!current) {
      return;
    }
    try {
      const html = await buildSowPdfHtml(
        current,
        buildSowPdfLabels(this.i18n),
        buildSowPdfOptions(this.i18n),
      );
      const win = openSowPdfWindow(html);
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

  private reportError(err: unknown): void {
    this.busy.set(false);
    this.snackBar.open(
      partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
      this.i18n.t('common.ok'),
      { duration: 4000 },
    );
  }
}
