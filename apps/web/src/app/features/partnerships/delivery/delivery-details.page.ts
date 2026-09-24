import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { deliveryEnumLabel } from '../partnership.labels';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import {
  blankDisplay,
  buildDeliveryPdfOptions,
  buildDeliveryRelationshipChain,
  deliveryStatusClass,
  DeliveryRelationshipLink,
  formatProgressPercent,
} from './delivery-display';
import { PartnershipDelivery, PartnershipDeliveryStatus } from './delivery.models';
import { buildDeliveryPdfHtml, openDeliveryPdfWindow } from './delivery-pdf';
import { buildDeliveryPdfLabels } from './delivery-pdf-labels';

/** Allowed UI transitions mirror the API status machine. */
const STATUS_TRANSITIONS: Record<PartnershipDeliveryStatus, PartnershipDeliveryStatus[]> = {
  PREPARING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Component({
  selector: 'app-delivery-details-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  templateUrl: './delivery-details.page.html',
  styleUrl: './delivery-details.page.scss',
})
export class DeliveryDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly delivery = signal<PartnershipDelivery | null>(null);

  readonly statusControl = new FormControl<PartnershipDeliveryStatus | ''>('', {
    nonNullable: true,
  });

  readonly nextStatuses = computed(() => {
    const current = this.delivery();
    if (!current) {
      return [] as PartnershipDeliveryStatus[];
    }
    return STATUS_TRANSITIONS[current.status] ?? [];
  });

  readonly progressBars = computed(() => {
    const current = this.delivery();
    if (!current?.progress) {
      return [] as { label: string; completed: number; total: number; ratio: number }[];
    }
    const p = current.progress;
    return [
      { label: 'partnerships.deliveryPhaseProgress', dim: p.phaseProgress },
      { label: 'partnerships.deliveryMilestoneProgress', dim: p.milestoneProgress },
      { label: 'partnerships.deliveryTaskProgress', dim: p.taskProgress },
      { label: 'partnerships.deliverySessionProgress', dim: p.sessionProgress },
      { label: 'partnerships.deliveryDeliverableProgress', dim: p.deliverableProgress },
    ]
      .filter((b) => b.dim != null && b.dim.ratio !== null)
      .map((b) => ({
        label: b.label,
        completed: b.dim.completed,
        total: b.dim.total,
        ratio: b.dim.ratio as number,
      }));
  });

  readonly relationshipChain = computed<DeliveryRelationshipLink[]>(() => {
    const current = this.delivery();
    if (!current) {
      return [];
    }
    return buildDeliveryRelationshipChain(current, {
      proposal: this.i18n.t('partnerships.deliveryRelProposal'),
      sow: this.i18n.t('partnerships.deliveryRelSow'),
      delivery: this.i18n.t('partnerships.deliveryRelDelivery'),
    });
  });

  constructor() {
    this.reload();
  }

  deliveryLabel = (
    category: Parameters<typeof deliveryEnumLabel>[1],
    value: string | null | undefined,
  ) => deliveryEnumLabel((key) => this.i18n.t(key), category, value);

  display(value: string | null | undefined): string {
    return blankDisplay(value, this.i18n.t('partnerships.noValue'));
  }

  statusClass(status: string): string {
    return deliveryStatusClass(status);
  }

  progressText(percent: number | null | undefined): string {
    return formatProgressPercent(percent);
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
        this.statusControl.setValue('');
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.deliveryLoadError')));
      },
    });
  }

  back(): void {
    void this.router.navigateByUrl('/partnerships/delivery');
  }

  changeStatus(): void {
    const current = this.delivery();
    const next = this.statusControl.value;
    if (!current || !next) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.deliveryStatusConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.changeDeliveryStatus(current.id, next).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.delivery.set(updated);
        this.statusControl.setValue('');
        this.snackBar.open(this.i18n.t('partnerships.statusUpdated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  duplicate(): void {
    const current = this.delivery();
    if (!current) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.deliveryDuplicateConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.duplicateDelivery(current.id).subscribe({
      next: (copy) => {
        this.busy.set(false);
        this.snackBar.open(this.i18n.t('partnerships.deliveryDuplicated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/delivery', copy.id, 'edit']);
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  archive(): void {
    const current = this.delivery();
    if (!current || current.archivedAt) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.deliveryArchiveConfirm'))) {
      return;
    }
    this.busy.set(true);
    this.api.archiveDelivery(current.id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.delivery.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.deliveryArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => this.reportError(err),
    });
  }

  /** Navigate to New Proposal with renewal/expansion hints — never auto-creates. */
  createFollowOn(intent: 'renewal' | 'expansion'): void {
    const current = this.delivery();
    if (!current) {
      return;
    }
    void this.router.navigate(['/partnerships/proposals/new'], {
      queryParams: {
        intent,
        institutionId: current.institutionId,
        sourceDeliveryId: current.id,
        sourceSowId: current.sowId,
      },
    });
  }

  async generatePdf(): Promise<void> {
    const current = this.delivery();
    if (!current) {
      return;
    }
    try {
      const html = await buildDeliveryPdfHtml(
        current,
        buildDeliveryPdfLabels(this.i18n),
        buildDeliveryPdfOptions(this.i18n),
      );
      const win = openDeliveryPdfWindow(html);
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
