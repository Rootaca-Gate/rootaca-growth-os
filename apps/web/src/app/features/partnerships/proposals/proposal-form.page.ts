import { Component, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  DISCOUNT_TYPES,
  PRICING_MODELS,
  enumLabel,
  offeringEnumLabel,
  programEnumLabel,
  proposalEnumLabel,
} from '../partnership.labels';
import { Institution } from '../partnership.models';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { OfferingListItem, PartnershipOffering } from '../offerings/offering.models';
import {
  blankDisplay,
  formatSnapshotDuration,
  formatSnapshotGroupSize,
} from './proposal-display';
import { computeProposalTotals, formatMoney } from './proposal-pricing';
import {
  PartnershipDiscountType,
  PartnershipPricingModel,
  PartnershipProposal,
  ProposalOfferingLine,
  ProposalUpdatePayload,
  ProposalWritePayload,
} from './proposal.models';

type LineFormValue = {
  id?: string;
  offeringId: string;
  snapshotProgramName: string;
  snapshotOfferingName: string;
  snapshotDeliveryFormat: string;
  snapshotTargetGrades: string;
  snapshotRecommendedLevel: string;
  snapshotDuration: number | null;
  snapshotDurationUnit: string;
  snapshotNumberOfSessions: number | null;
  snapshotSessionDurationMinutes: number | null;
  snapshotDeliveryMode: string;
  snapshotGroupSizeMin: number | null;
  snapshotGroupSizeMax: number | null;
  snapshotNumberOfGroups: number | null;
  snapshotShortDescription: string;
  customizedObjectives: string;
  customizedCurriculumNotes: string;
  specialRequirements: string;
  implementationNotes: string;
  deliveryNotes: string;
  pricingModel: PartnershipPricingModel;
  quantity: number | null;
  unitPrice: number | null;
  discountType: PartnershipDiscountType;
  discountValue: number | null;
};

@Component({
  selector: 'app-proposal-form-page',
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
  templateUrl: './proposal-form.page.html',
  styleUrl: './proposal-form.page.scss',
})
export class ProposalFormPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);

  readonly pricingModels = PRICING_MODELS;
  readonly discountTypes = DISCOUNT_TYPES;
  readonly totalSteps = 6;
  readonly step = signal(1);

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;
  readonly opportunityId = this.route.snapshot.queryParamMap.get('opportunityId');

  readonly loading = signal(this.isEdit);
  readonly submitting = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly locked = signal(false);
  readonly proposalMeta = signal<{
    proposalNumber: string;
    status: string;
    version: string;
  } | null>(null);

  readonly institutions = signal<Institution[]>([]);
  readonly selectedInstitution = signal<Institution | null>(null);
  readonly availableOfferings = signal<OfferingListItem[]>([]);
  readonly addOfferingControl = new FormControl('', { nonNullable: true });

  readonly form = this.fb.nonNullable.group({
    institutionId: ['', Validators.required],
    title: ['', [Validators.required, Validators.minLength(1)]],
    proposalDate: [''],
    validUntil: [''],
    preparedBy: [''],
    currency: [''],
    taxEnabled: [false],
    taxRate: this.fb.control<number | null>(null),
    headerDiscountType: ['NONE' as PartnershipDiscountType],
    headerDiscountValue: this.fb.control<number | null>(null),
    paymentTerms: [''],
    executiveSummary: [''],
    schoolChallenge: [''],
    schoolObjective: [''],
    targetStudentGroup: [''],
    successCriteria: [''],
    partnershipObjective: [''],
    implementationApproach: [''],
    timelineNotes: [''],
    nextSteps: [''],
    termsAndConditions: [''],
    startDate: [''],
    endDate: [''],
    offerings: this.fb.array<FormGroup>([]),
    timelinePhases: this.fb.array<FormGroup>([]),
    customOutcomes: this.fb.array<FormGroup>([]),
  });

  readonly liveTotals = computed(() => {
    // Recompute when form values change by reading raw value via a dummy dependency
    void this.formValueTick();
    const raw = this.form.getRawValue();
    return computeProposalTotals({
      lines: (raw.offerings as LineFormValue[]).map((line) => ({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountType: line.discountType,
        discountValue: line.discountValue,
      })),
      headerDiscountType: raw.headerDiscountType,
      headerDiscountValue: raw.headerDiscountValue,
      taxEnabled: raw.taxEnabled,
      taxRate: raw.taxRate,
    });
  });

  /** Tick signal updated on form valueChanges so computed totals stay live. */
  private readonly formValueTick = signal(0);

  constructor() {
    this.loadInstitutions();
    this.loadOfferingsCatalog();
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.formValueTick.update((n) => n + 1);
    });
    this.form.controls.institutionId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onInstitutionChanged(id));

    if (this.isEdit && this.editId) {
      this.load(this.editId);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      this.form.controls.proposalDate.setValue(today);
      const institutionId = this.route.snapshot.queryParamMap.get('institutionId');
      if (institutionId) {
        this.form.controls.institutionId.setValue(institutionId);
      }
    }
  }

  enumLabelFn = (value: string | null | undefined) => enumLabel(value);

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

  get offerings(): FormArray {
    return this.form.controls.offerings;
  }

  get timelinePhases(): FormArray {
    return this.form.controls.timelinePhases;
  }

  get customOutcomes(): FormArray {
    return this.form.controls.customOutcomes;
  }

  money(value: number | null | undefined): string {
    return formatMoney(
      value,
      this.form.controls.currency.value || null,
      this.i18n.t('partnerships.noValue'),
    );
  }

  display(value: string | null | undefined): string {
    return blankDisplay(value, this.i18n.t('partnerships.noValue'));
  }

  lineDuration(group: FormGroup): string {
    const raw = group.getRawValue() as LineFormValue;
    const fake = {
      snapshotDuration: raw.snapshotDuration,
      snapshotDurationUnit: raw.snapshotDurationUnit || null,
    } as ProposalOfferingLine;
    return (
      formatSnapshotDuration(fake, (u) => this.offeringLabel('durationUnit', u)) ||
      this.i18n.t('partnerships.noValue')
    );
  }

  lineGroupSize(group: FormGroup): string {
    const raw = group.getRawValue() as LineFormValue;
    return (
      formatSnapshotGroupSize(raw as unknown as ProposalOfferingLine) ||
      this.i18n.t('partnerships.noValue')
    );
  }

  lineSubtotal(group: FormGroup): string {
    const raw = group.getRawValue() as LineFormValue;
    const sub = computeProposalTotals({
      lines: [
        {
          quantity: raw.quantity,
          unitPrice: raw.unitPrice,
          discountType: raw.discountType,
          discountValue: raw.discountValue,
        },
      ],
    }).lineSubtotals[0];
    return this.money(sub);
  }

  goTo(step: number): void {
    if (step < 1 || step > this.totalSteps) {
      return;
    }
    this.step.set(step);
  }

  next(): void {
    if (this.step() === 1 && !this.validateSchool()) {
      return;
    }
    if (this.step() === 2 && !this.validateBasics()) {
      return;
    }
    this.goTo(this.step() + 1);
  }

  prev(): void {
    this.goTo(this.step() - 1);
  }

  private validateSchool(): boolean {
    const control = this.form.controls.institutionId;
    control.markAsTouched();
    return control.valid;
  }

  private validateBasics(): boolean {
    const control = this.form.controls.title;
    control.markAsTouched();
    return control.valid;
  }

  private loadInstitutions(): void {
    this.api.listInstitutions({ pageSize: 100, sortBy: 'name', sortOrder: 'asc' }).subscribe({
      next: (result) => this.institutions.set(result.items),
      error: () => this.institutions.set([]),
    });
  }

  private loadOfferingsCatalog(): void {
    this.api.listOfferings({ status: 'ACTIVE', pageSize: 100 }).subscribe({
      next: (result) => this.availableOfferings.set(result.items),
      error: () => this.availableOfferings.set([]),
    });
  }

  private onInstitutionChanged(id: string): void {
    if (!id) {
      this.selectedInstitution.set(null);
      return;
    }
    const cached = this.institutions().find((item) => item.id === id) ?? null;
    if (cached) {
      this.selectedInstitution.set(cached);
    }
    this.api.getInstitution(id).subscribe({
      next: (institution) => this.selectedInstitution.set(institution),
      error: () => {
        if (!cached) {
          this.selectedInstitution.set(null);
        }
      },
    });
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getProposal(id).subscribe({
      next: (proposal) => {
        if (proposal.isLocked) {
          this.locked.set(true);
          this.loading.set(false);
          this.error.set(this.i18n.t('partnerships.proposalsLockedEditBlocked'));
          return;
        }
        this.patchFromProposal(proposal);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(
          partnershipErrorMessage(err, this.i18n.t('partnerships.proposalsLoadError')),
        );
      },
    });
  }

  private toDateInput(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value.slice(0, 10);
  }

  private patchFromProposal(proposal: PartnershipProposal): void {
    this.proposalMeta.set({
      proposalNumber: proposal.proposalNumber,
      status: proposal.status,
      version: proposal.version,
    });
    this.form.patchValue({
      institutionId: proposal.institutionId,
      title: proposal.title,
      proposalDate: this.toDateInput(proposal.proposalDate),
      validUntil: this.toDateInput(proposal.validUntil),
      preparedBy: proposal.preparedBy,
      currency: proposal.currency ?? '',
      taxEnabled: proposal.taxEnabled,
      taxRate: proposal.taxRate,
      headerDiscountType: proposal.headerDiscountType,
      headerDiscountValue: proposal.headerDiscountValue,
      paymentTerms: proposal.paymentTerms,
      executiveSummary: proposal.executiveSummary,
      schoolChallenge: proposal.schoolChallenge,
      schoolObjective: proposal.schoolObjective,
      targetStudentGroup: proposal.targetStudentGroup,
      successCriteria: proposal.successCriteria,
      partnershipObjective: proposal.partnershipObjective,
      implementationApproach: proposal.implementationApproach,
      timelineNotes: proposal.timelineNotes,
      nextSteps: proposal.nextSteps,
      termsAndConditions: proposal.termsAndConditions,
      startDate: this.toDateInput(proposal.startDate),
      endDate: this.toDateInput(proposal.endDate),
    });

    this.offerings.clear();
    proposal.offerings.forEach((line) => this.offerings.push(this.lineGroupFromSaved(line)));

    this.timelinePhases.clear();
    proposal.timelinePhases.forEach((phase) =>
      this.timelinePhases.push(
        this.fb.nonNullable.group({
          id: [phase.id],
          title: [phase.title, Validators.required],
          description: [phase.description],
          startDate: [this.toDateInput(phase.startDate)],
          endDate: [this.toDateInput(phase.endDate)],
        }),
      ),
    );

    this.customOutcomes.clear();
    proposal.customOutcomes.forEach((outcome) =>
      this.customOutcomes.push(
        this.fb.nonNullable.group({
          id: [outcome.id],
          title: [outcome.title, Validators.required],
          description: [outcome.description],
        }),
      ),
    );
  }

  private lineGroupFromSaved(line: ProposalOfferingLine): FormGroup {
    return this.fb.nonNullable.group({
      id: [line.id],
      offeringId: [line.offeringId, Validators.required],
      snapshotProgramName: [line.snapshotProgramName],
      snapshotOfferingName: [line.snapshotOfferingName],
      snapshotDeliveryFormat: [line.snapshotDeliveryFormat],
      snapshotTargetGrades: [line.snapshotTargetGrades ?? ''],
      snapshotRecommendedLevel: [line.snapshotRecommendedLevel ?? ''],
      snapshotDuration: [line.snapshotDuration],
      snapshotDurationUnit: [line.snapshotDurationUnit ?? ''],
      snapshotNumberOfSessions: [line.snapshotNumberOfSessions],
      snapshotSessionDurationMinutes: [line.snapshotSessionDurationMinutes],
      snapshotDeliveryMode: [line.snapshotDeliveryMode ?? ''],
      snapshotGroupSizeMin: [line.snapshotGroupSizeMin],
      snapshotGroupSizeMax: [line.snapshotGroupSizeMax],
      snapshotNumberOfGroups: [line.snapshotNumberOfGroups],
      snapshotShortDescription: [line.snapshotShortDescription],
      customizedObjectives: [line.customizedObjectives],
      customizedCurriculumNotes: [line.customizedCurriculumNotes],
      specialRequirements: [line.specialRequirements],
      implementationNotes: [line.implementationNotes],
      deliveryNotes: [line.deliveryNotes],
      pricingModel: [line.pricingModel as PartnershipPricingModel, Validators.required],
      quantity: [line.quantity],
      unitPrice: [line.unitPrice],
      discountType: [line.discountType as PartnershipDiscountType],
      discountValue: [line.discountValue],
    });
  }

  private lineGroupFromOffering(offering: PartnershipOffering): FormGroup {
    const resolved = offering.resolved;
    return this.fb.nonNullable.group({
      offeringId: [offering.id, Validators.required],
      snapshotProgramName: [offering.program?.name ?? ''],
      snapshotOfferingName: [offering.name],
      snapshotDeliveryFormat: [offering.deliveryFormat],
      snapshotTargetGrades: [resolved?.targetGrades ?? ''],
      snapshotRecommendedLevel: [resolved?.recommendedLevel ?? ''],
      snapshotDuration: [offering.duration],
      snapshotDurationUnit: [offering.durationUnit ?? ''],
      snapshotNumberOfSessions: [offering.numberOfSessions],
      snapshotSessionDurationMinutes: [offering.sessionDurationMinutes],
      snapshotDeliveryMode: [offering.deliveryMode ?? ''],
      snapshotGroupSizeMin: [offering.groupSizeMin],
      snapshotGroupSizeMax: [offering.groupSizeMax],
      snapshotNumberOfGroups: [offering.numberOfGroups],
      snapshotShortDescription: [resolved?.shortDescription ?? ''],
      customizedObjectives: [''],
      customizedCurriculumNotes: [''],
      specialRequirements: [''],
      implementationNotes: [''],
      deliveryNotes: [''],
      pricingModel: ['PER_PROGRAM' as PartnershipPricingModel, Validators.required],
      quantity: this.fb.control<number | null>(null),
      unitPrice: this.fb.control<number | null>(null),
      discountType: ['NONE' as PartnershipDiscountType],
      discountValue: this.fb.control<number | null>(null),
    });
  }

  addOffering(): void {
    const offeringId = this.addOfferingControl.value;
    if (!offeringId) {
      return;
    }
    const exists = this.offerings.controls.some(
      (group) => (group as FormGroup).getRawValue().offeringId === offeringId,
    );
    if (exists) {
      this.snackBar.open(
        this.i18n.t('partnerships.offeringAlreadyAdded'),
        this.i18n.t('common.ok'),
        { duration: 2500 },
      );
      return;
    }
    this.api.getOffering(offeringId).subscribe({
      next: (offering) => {
        this.offerings.push(this.lineGroupFromOffering(offering));
        this.addOfferingControl.setValue('');
      },
      error: (error: unknown) => {
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  removeOffering(index: number): void {
    this.offerings.removeAt(index);
  }

  addTimelinePhase(): void {
    this.timelinePhases.push(
      this.fb.nonNullable.group({
        title: ['', Validators.required],
        description: [''],
        startDate: [''],
        endDate: [''],
      }),
    );
  }

  removeTimelinePhase(index: number): void {
    this.timelinePhases.removeAt(index);
  }

  addCustomOutcome(): void {
    this.customOutcomes.push(
      this.fb.nonNullable.group({
        title: ['', Validators.required],
        description: [''],
      }),
    );
  }

  removeCustomOutcome(index: number): void {
    this.customOutcomes.removeAt(index);
  }

  private nullableDate(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private trimText(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  private num(value: number | null | undefined): number | null {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return null;
    }
    return Number(value);
  }

  private buildPayload(): ProposalWritePayload | ProposalUpdatePayload {
    const raw = this.form.getRawValue();
    const offerings = (raw.offerings as LineFormValue[]).map((line, index) => ({
      offeringId: line.offeringId,
      sortOrder: index,
      customizedObjectives: this.trimText(line.customizedObjectives),
      customizedCurriculumNotes: this.trimText(line.customizedCurriculumNotes),
      specialRequirements: this.trimText(line.specialRequirements),
      implementationNotes: this.trimText(line.implementationNotes),
      deliveryNotes: this.trimText(line.deliveryNotes),
      pricingModel: line.pricingModel,
      quantity: this.num(line.quantity),
      unitPrice: this.num(line.unitPrice),
      discountType: line.discountType,
      discountValue: this.num(line.discountValue),
    }));

    const timelinePhases = (
      raw.timelinePhases as Array<{
        title: string;
        description: string;
        startDate: string;
        endDate: string;
      }>
    )
      .filter((phase) => phase.title.trim())
      .map((phase, index) => ({
        title: phase.title.trim(),
        description: this.trimText(phase.description),
        sortOrder: index,
        startDate: this.nullableDate(phase.startDate),
        endDate: this.nullableDate(phase.endDate),
      }));

    const customOutcomes = (
      raw.customOutcomes as Array<{ title: string; description: string }>
    )
      .filter((outcome) => outcome.title.trim())
      .map((outcome, index) => ({
        title: outcome.title.trim(),
        description: this.trimText(outcome.description),
        sortOrder: index,
      }));

    const base: ProposalUpdatePayload = {
      title: raw.title.trim(),
      institutionId: raw.institutionId,
      proposalDate: this.nullableDate(raw.proposalDate) ?? undefined,
      validUntil: this.nullableDate(raw.validUntil),
      preparedBy: this.trimText(raw.preparedBy),
      executiveSummary: this.trimText(raw.executiveSummary),
      schoolChallenge: this.trimText(raw.schoolChallenge),
      schoolObjective: this.trimText(raw.schoolObjective),
      targetStudentGroup: this.trimText(raw.targetStudentGroup),
      successCriteria: this.trimText(raw.successCriteria),
      partnershipObjective: this.trimText(raw.partnershipObjective),
      implementationApproach: this.trimText(raw.implementationApproach),
      timelineNotes: this.trimText(raw.timelineNotes),
      paymentTerms: this.trimText(raw.paymentTerms),
      nextSteps: this.trimText(raw.nextSteps),
      termsAndConditions: this.trimText(raw.termsAndConditions),
      startDate: this.nullableDate(raw.startDate),
      endDate: this.nullableDate(raw.endDate),
      currency: this.trimText(raw.currency) || null,
      taxEnabled: raw.taxEnabled,
      taxRate: this.num(raw.taxRate),
      headerDiscountType: raw.headerDiscountType,
      headerDiscountValue: this.num(raw.headerDiscountValue),
      offerings,
      timelinePhases,
      customOutcomes,
    };

    return base;
  }

  save(): void {
    if (this.locked()) {
      return;
    }
    if (!this.validateSchool() || !this.validateBasics()) {
      this.goTo(!this.form.controls.institutionId.valid ? 1 : 2);
      return;
    }
    this.submitting.set(true);
    const payload = this.buildPayload();
    const request$ =
      this.isEdit && this.editId
        ? this.api.updateProposal(this.editId, payload)
        : this.api.createProposal(payload as ProposalWritePayload);

    request$.subscribe({
      next: (saved) => {
        this.submitting.set(false);
        this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/proposals', saved.id]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  preview(): void {
    if (this.isEdit && this.editId) {
      void this.router.navigate(['/partnerships/proposals', this.editId, 'preview']);
      return;
    }
    // Save first for new proposals so preview has an id.
    if (!this.validateSchool() || !this.validateBasics()) {
      this.goTo(!this.form.controls.institutionId.valid ? 1 : 2);
      return;
    }
    this.submitting.set(true);
    this.api.createProposal(this.buildPayload() as ProposalWritePayload).subscribe({
      next: (saved) => {
        this.submitting.set(false);
        void this.router.navigate(['/partnerships/proposals', saved.id, 'preview']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  send(): void {
    if (!this.isEdit || !this.editId || this.locked()) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.proposalsSendConfirm'))) {
      return;
    }
    this.sending.set(true);
    // Persist latest edits then send.
    this.api.updateProposal(this.editId, this.buildPayload()).subscribe({
      next: () => {
        this.api.sendProposal(this.editId!).subscribe({
          next: (sent) => {
            this.sending.set(false);
            this.snackBar.open(this.i18n.t('partnerships.proposalsSent'), this.i18n.t('common.ok'), {
              duration: 2500,
            });
            void this.router.navigate(['/partnerships/proposals', sent.id]);
          },
          error: (error: unknown) => {
            this.sending.set(false);
            this.snackBar.open(
              partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
              this.i18n.t('common.ok'),
              { duration: 4000 },
            );
          },
        });
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  cancel(): void {
    if (this.isEdit && this.editId) {
      void this.router.navigate(['/partnerships/proposals', this.editId]);
    } else {
      void this.router.navigateByUrl('/partnerships/proposals');
    }
  }

  institutionLocation(institution: Institution): string {
    return [institution.city, institution.governorate].filter(Boolean).join(', ');
  }

  institutionContact(institution: Institution): string {
    const contact = institution.primaryContact;
    if (!contact) {
      return this.i18n.t('partnerships.noValue');
    }
    const parts = [contact.name, contact.email, contact.phone].filter(Boolean);
    return parts.length ? parts.join(' · ') : this.i18n.t('partnerships.noValue');
  }
}
