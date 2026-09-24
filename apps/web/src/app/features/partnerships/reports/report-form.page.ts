import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  REPORT_RECOMMENDATION_PRIORITIES,
  REPORT_TYPES,
  reportEnumLabel,
} from '../partnership.labels';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { DeliveryListItem } from '../delivery/delivery.models';
import { PartnershipReport, PartnershipReportType } from './report.models';

@Component({
  selector: 'app-report-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  templateUrl: './report-form.page.html',
  styleUrl: './report-form.page.scss',
})
export class ReportFormPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);

  readonly reportTypes = REPORT_TYPES;
  readonly recommendationPriorities = REPORT_RECOMMENDATION_PRIORITIES;

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;

  readonly loading = signal(this.isEdit);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly deliveries = signal<DeliveryListItem[]>([]);

  readonly createForm = this.fb.group({
    deliveryId: ['', Validators.required],
    type: ['' as PartnershipReportType | '', Validators.required],
  });

  readonly editForm = this.fb.group({
    title: ['', Validators.required],
    periodStart: [''],
    periodEnd: [''],
    periodLabel: [''],
    preparedBy: [''],
    executiveSummary: [''],
    achievements: [''],
    nextSteps: [''],
    renewalNotes: [''],
    internalNotes: [''],
    recommendations: this.fb.array([]),
  });

  constructor() {
    if (this.isEdit && this.editId) {
      this.load(this.editId);
    } else {
      this.loadDeliveries();
      const deliveryId = this.route.snapshot.queryParamMap.get('deliveryId');
      if (deliveryId) {
        this.createForm.controls.deliveryId.setValue(deliveryId);
      }
    }
  }

  reportLabel = (
    category: Parameters<typeof reportEnumLabel>[1],
    value: string | null | undefined,
  ) => reportEnumLabel((key) => this.i18n.t(key), category, value);

  get recommendations(): FormArray {
    return this.editForm.controls.recommendations;
  }

  addRecommendation(): void {
    this.recommendations.push(
      this.fb.group({
        text: [''],
        priority: ['MEDIUM'],
        owner: [''],
        targetDate: [''],
        isInternal: [false],
      }),
    );
  }

  removeRecommendation(index: number): void {
    this.recommendations.removeAt(index);
  }

  private loadDeliveries(): void {
    this.api.listDeliveries({ pageSize: 200 }).subscribe({
      next: (result) => this.deliveries.set(result.items),
      error: () => this.deliveries.set([]),
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.api.getReport(id).subscribe({
      next: (report) => {
        if (report.status === 'PUBLISHED' || report.status === 'ARCHIVED') {
          void this.router.navigate(['/partnerships/reports', id]);
          return;
        }
        this.patchEditForm(report);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.reportsLoadError')));
      },
    });
  }

  private patchEditForm(report: PartnershipReport): void {
    this.editForm.patchValue({
      title: report.title,
      periodStart: report.periodStart?.slice(0, 10) ?? '',
      periodEnd: report.periodEnd?.slice(0, 10) ?? '',
      periodLabel: report.periodLabel,
      preparedBy: report.preparedBy,
      executiveSummary: report.executiveSummary,
      achievements: report.achievements,
      nextSteps: report.nextSteps,
      renewalNotes: report.renewalNotes,
      internalNotes: report.internalNotes,
    });
    this.recommendations.clear();
    for (const rec of report.recommendations) {
      this.recommendations.push(
        this.fb.group({
          text: [rec.text],
          priority: [rec.priority],
          owner: [rec.owner],
          targetDate: [rec.targetDate?.slice(0, 10) ?? ''],
          isInternal: [rec.isInternal],
        }),
      );
    }
  }

  create(): void {
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) {
      return;
    }
    const raw = this.createForm.getRawValue();
    const deliveryId = String(raw.deliveryId ?? '').trim();
    const type = raw.type as PartnershipReportType;
    if (!deliveryId || !type) {
      return;
    }
    this.submitting.set(true);
    this.api
      .createReportFromDelivery({
        deliveryId,
        type,
      })
      .subscribe({
        next: (report) => {
          this.submitting.set(false);
          this.snackBar.open(this.i18n.t('partnerships.reportsCreated'), this.i18n.t('common.ok'), {
            duration: 2500,
          });
          void this.router.navigate(['/partnerships/reports', report.id, 'edit']);
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
    type RecRow = {
      text: string;
      priority: string;
      owner: string;
      targetDate: string;
      isInternal: boolean;
    };
    const recs = raw.recommendations as RecRow[];
    this.submitting.set(true);
    this.api
      .updateReport(this.editId, {
        title: raw.title ?? undefined,
        periodStart: raw.periodStart || null,
        periodEnd: raw.periodEnd || null,
        periodLabel: raw.periodLabel ?? undefined,
        preparedBy: raw.preparedBy ?? undefined,
        executiveSummary: raw.executiveSummary ?? undefined,
        achievements: raw.achievements ?? undefined,
        nextSteps: raw.nextSteps ?? undefined,
        renewalNotes: raw.renewalNotes ?? undefined,
        internalNotes: raw.internalNotes ?? undefined,
        recommendations: recs.map((rec, index) => ({
          text: rec.text,
          priority: rec.priority as 'LOW' | 'MEDIUM' | 'HIGH',
          owner: rec.owner,
          targetDate: rec.targetDate || null,
          isInternal: rec.isInternal ?? false,
          sortOrder: index,
        })),
      })
      .subscribe({
        next: (report) => {
          this.submitting.set(false);
          this.snackBar.open(this.i18n.t('partnerships.reportsSaved'), this.i18n.t('common.ok'), {
            duration: 2500,
          });
          void this.router.navigate(['/partnerships/reports', report.id]);
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
