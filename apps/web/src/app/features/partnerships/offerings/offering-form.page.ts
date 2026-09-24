import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  DELIVERY_FORMATS,
  DELIVERY_MODES,
  DURATION_UNITS,
  OFFERING_STATUSES,
  PROGRAM_LEVELS,
  REQUIREMENT_KINDS,
  REQUIREMENT_PRIORITIES,
  offeringEnumLabel,
  programEnumLabel,
} from '../partnership.labels';
import {
  PartnershipDeliveryFormat,
  PartnershipProgram,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramRequirementPriority,
  ProgramListItem,
} from '../partnership.models';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import {
  OfferingUpdatePayload,
  OfferingWritePayload,
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
  PartnershipOffering,
  PartnershipOfferingStatus,
} from './offering.models';

type SelectableOption = { id: string; label: string; checked: boolean };

@Component({
  selector: 'app-offering-form-page',
  imports: [
    ReactiveFormsModule,
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
  templateUrl: './offering-form.page.html',
  styleUrl: './offering-form.page.scss',
})
export class OfferingFormPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);

  readonly deliveryFormats = DELIVERY_FORMATS;
  readonly deliveryModes = DELIVERY_MODES;
  readonly durationUnits = DURATION_UNITS;
  readonly offeringStatuses = OFFERING_STATUSES;
  readonly programLevels = PROGRAM_LEVELS;
  readonly requirementKinds = REQUIREMENT_KINDS;
  readonly requirementPriorities = REQUIREMENT_PRIORITIES;

  readonly totalSteps = 6;
  readonly step = signal(1);

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;

  readonly loading = signal(this.isEdit);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly programs = signal<ProgramListItem[]>([]);
  readonly selectedProgram = signal<PartnershipProgram | null>(null);
  readonly programLoading = signal(false);
  readonly moduleOptions = signal<SelectableOption[]>([]);
  readonly projectOptions = signal<SelectableOption[]>([]);

  private lastLoadedProgramId: string | null = null;
  /** In edit mode we must apply the saved selection once the program loads. */
  private pendingSelection: { moduleIds: string[]; projectIds: string[]; inheritAllModules: boolean; inheritAllProjects: boolean } | null = null;

  readonly form = this.fb.nonNullable.group({
    // Step 1 — basics
    name: ['', [Validators.required, Validators.minLength(1)]],
    programId: ['', Validators.required],
    deliveryFormat: ['' as PartnershipDeliveryFormat | '', Validators.required],
    status: ['DRAFT' as PartnershipOfferingStatus],
    // Step 2 — audience overrides (blank = inherit)
    targetAge: [''],
    targetGrades: [''],
    recommendedLevel: ['' as PartnershipProgramLevel | ''],
    learnerProfile: [''],
    // Step 3 — delivery configuration
    duration: this.fb.control<number | null>(null),
    durationUnit: ['' as PartnershipDurationUnit | ''],
    numberOfSessions: this.fb.control<number | null>(null),
    sessionDurationMinutes: this.fb.control<number | null>(null),
    sessionFrequency: [''],
    deliveryMode: ['' as PartnershipDeliveryMode | ''],
    locationNotes: [''],
    groupSizeMin: this.fb.control<number | null>(null),
    groupSizeMax: this.fb.control<number | null>(null),
    numberOfGroups: this.fb.control<number | null>(null),
    instructorRequirement: [''],
    coordinatorRequirement: [''],
    // Step 4 — curriculum
    includeFinalProject: [true],
    curriculumCustomizationNotes: [''],
    projectCustomizationNotes: [''],
    // Step 5 — assessment + reporting
    includeInitialAssessment: [true],
    includeMidAssessment: [true],
    includeFinalAssessment: [true],
    assessmentFrequency: [''],
    studentProgressReport: [true],
    schoolSummaryReport: [true],
    internalNotes: [''],
    commercialNotes: [''],
    requirements: this.fb.array<FormGroup>([]),
  });

  readonly allModulesChecked = computed(() => {
    const opts = this.moduleOptions();
    return opts.length > 0 && opts.every((o) => o.checked);
  });
  readonly allProjectsChecked = computed(() => {
    const opts = this.projectOptions();
    return opts.length > 0 && opts.every((o) => o.checked);
  });

  constructor() {
    this.loadPrograms();
    this.form.controls.programId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((programId) => this.onProgramChanged(programId));

    if (this.isEdit && this.editId) {
      this.load(this.editId);
    }
  }

  enumLabel = (category: Parameters<typeof programEnumLabel>[1], value: string | null | undefined) =>
    programEnumLabel((key) => this.i18n.t(key), category, value);

  offeringLabel = (
    category: Parameters<typeof offeringEnumLabel>[1],
    value: string | null | undefined,
  ) => offeringEnumLabel((key) => this.i18n.t(key), category, value);

  get requirements(): FormArray {
    return this.form.controls.requirements;
  }

  // --- Step navigation -------------------------------------------------------

  goTo(step: number): void {
    if (step < 1 || step > this.totalSteps) {
      return;
    }
    this.step.set(step);
  }

  next(): void {
    if (this.step() === 1 && !this.validateBasics()) {
      return;
    }
    this.goTo(this.step() + 1);
  }

  prev(): void {
    this.goTo(this.step() - 1);
  }

  private validateBasics(): boolean {
    const { name, programId, deliveryFormat } = this.form.controls;
    name.markAsTouched();
    programId.markAsTouched();
    deliveryFormat.markAsTouched();
    // In edit mode the program is fixed (disabled control) and always valid.
    const programOk = programId.disabled || programId.valid;
    return name.valid && programOk && deliveryFormat.valid;
  }

  // --- Program / selections --------------------------------------------------

  private loadPrograms(): void {
    this.api.listPrograms({ status: 'ACTIVE', pageSize: 100 }).subscribe({
      next: (result) => this.programs.set(result.items),
      error: () => this.programs.set([]),
    });
  }

  private onProgramChanged(programId: string): void {
    if (!programId || programId === this.lastLoadedProgramId) {
      return;
    }
    this.lastLoadedProgramId = programId;
    this.programLoading.set(true);
    this.api.getProgram(programId).subscribe({
      next: (program) => {
        this.selectedProgram.set(program);
        this.applyProgramOptions(program);
        this.programLoading.set(false);
      },
      error: () => {
        this.selectedProgram.set(null);
        this.moduleOptions.set([]);
        this.projectOptions.set([]);
        this.programLoading.set(false);
      },
    });
  }

  private applyProgramOptions(program: PartnershipProgram): void {
    const pending = this.pendingSelection;
    const moduleChecked = (id: string): boolean =>
      pending ? pending.inheritAllModules || pending.moduleIds.includes(id) : true;
    const projectChecked = (id: string): boolean =>
      pending ? pending.inheritAllProjects || pending.projectIds.includes(id) : true;

    this.moduleOptions.set(
      program.curriculumModules
        .filter((m): m is typeof m & { id: string } => !!m.id)
        .map((m) => ({ id: m.id, label: m.title, checked: moduleChecked(m.id) })),
    );
    this.projectOptions.set(
      program.sampleProjects
        .filter((p): p is typeof p & { id: string } => !!p.id)
        .map((p) => ({ id: p.id, label: p.name, checked: projectChecked(p.id) })),
    );
    // Selection applied once; drop so future manual program changes reset to all.
    this.pendingSelection = null;
  }

  toggleModule(id: string, checked: boolean): void {
    this.moduleOptions.update((opts) =>
      opts.map((o) => (o.id === id ? { ...o, checked } : o)),
    );
  }

  toggleProject(id: string, checked: boolean): void {
    this.projectOptions.update((opts) =>
      opts.map((o) => (o.id === id ? { ...o, checked } : o)),
    );
  }

  toggleAllModules(checked: boolean): void {
    this.moduleOptions.update((opts) => opts.map((o) => ({ ...o, checked })));
  }

  toggleAllProjects(checked: boolean): void {
    this.projectOptions.update((opts) => opts.map((o) => ({ ...o, checked })));
  }

  // --- Requirements ----------------------------------------------------------

  addRequirement(
    kind: PartnershipProgramRequirementKind = 'EQUIPMENT',
    label = '',
    description = '',
    priority: PartnershipProgramRequirementPriority = 'REQUIRED',
  ): void {
    this.requirements.push(
      this.fb.nonNullable.group({
        kind: [kind],
        priority: [priority],
        label: [label, Validators.required],
        description: [description],
      }),
    );
  }

  removeRequirement(index: number): void {
    this.requirements.removeAt(index);
  }

  // --- Load (edit) -----------------------------------------------------------

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getOffering(id).subscribe({
      next: (offering) => {
        this.patchOffering(offering);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.offeringsLoadError')));
      },
    });
  }

  private patchOffering(offering: PartnershipOffering): void {
    this.pendingSelection = {
      moduleIds: offering.selection.selectedModuleIds,
      projectIds: offering.selection.selectedProjectIds,
      inheritAllModules: offering.selection.inheritAllModules,
      inheritAllProjects: offering.selection.inheritAllProjects,
    };

    this.form.patchValue({
      name: offering.name,
      deliveryFormat: offering.deliveryFormat,
      status: offering.status,
      targetAge: offering.targetAge ?? '',
      targetGrades: offering.targetGrades ?? '',
      recommendedLevel: offering.recommendedLevel ?? '',
      learnerProfile: offering.learnerProfile ?? '',
      duration: offering.duration,
      durationUnit: offering.durationUnit ?? '',
      numberOfSessions: offering.numberOfSessions,
      sessionDurationMinutes: offering.sessionDurationMinutes,
      sessionFrequency: offering.sessionFrequency ?? '',
      deliveryMode: offering.deliveryMode ?? '',
      locationNotes: offering.locationNotes,
      groupSizeMin: offering.groupSizeMin,
      groupSizeMax: offering.groupSizeMax,
      numberOfGroups: offering.numberOfGroups,
      instructorRequirement: offering.instructorRequirement,
      coordinatorRequirement: offering.coordinatorRequirement,
      includeFinalProject: offering.includeFinalProject,
      curriculumCustomizationNotes: offering.curriculumCustomizationNotes,
      projectCustomizationNotes: offering.projectCustomizationNotes,
      includeInitialAssessment: offering.includeInitialAssessment,
      includeMidAssessment: offering.includeMidAssessment,
      includeFinalAssessment: offering.includeFinalAssessment,
      assessmentFrequency: offering.assessmentFrequency,
      studentProgressReport: offering.studentProgressReport,
      schoolSummaryReport: offering.schoolSummaryReport,
      internalNotes: offering.internalNotes,
      commercialNotes: offering.commercialNotes,
    });

    // programId set last so the valueChanges loader runs with pendingSelection set,
    // then locked — offerings stay live-linked to their original program.
    this.form.controls.programId.setValue(offering.programId);
    this.form.controls.programId.disable({ emitEvent: false });

    // Custom requirements (only when not inherited).
    this.requirements.clear();
    if (!offering.resolved.requirementsInherited) {
      for (const req of offering.resolved.requirements) {
        this.addRequirement(req.kind, req.label, req.description, req.priority);
      }
    }
  }

  // --- Save ------------------------------------------------------------------

  saveDraft(): void {
    this.submit('DRAFT');
  }

  save(): void {
    this.submit(null);
  }

  private submit(statusOverride: PartnershipOfferingStatus | null): void {
    if (!this.validateBasics()) {
      this.goTo(1);
      return;
    }
    if (this.requirements.invalid) {
      this.requirements.markAllAsTouched();
      this.goTo(5);
      return;
    }

    const payload = this.buildPayload(statusOverride);
    this.submitting.set(true);
    const request$ =
      this.isEdit && this.editId
        ? this.api.updateOffering(this.editId, payload)
        : this.api.createOffering(payload as OfferingWritePayload);

    request$.subscribe({
      next: (offering) => {
        this.submitting.set(false);
        this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/offerings', offering.id]);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  private buildPayload(
    statusOverride: PartnershipOfferingStatus | null,
  ): OfferingWritePayload | OfferingUpdatePayload {
    const raw = this.form.getRawValue();
    const trimText = (v: string) => v.trim();
    const nullable = (v: string) => (v.trim() ? v.trim() : null);
    const num = (v: number | null) => (v == null || Number.isNaN(v) ? null : Number(v));

    const modules = this.moduleOptions();
    const projects = this.projectOptions();
    const checkedModuleIds = modules.filter((o) => o.checked).map((o) => o.id);
    const checkedProjectIds = projects.filter((o) => o.checked).map((o) => o.id);
    // Empty array => inherit ALL (API contract). All selected also inherits all.
    const selectedModuleIds =
      modules.length === 0 || checkedModuleIds.length === modules.length ? [] : checkedModuleIds;
    const selectedProjectIds =
      projects.length === 0 || checkedProjectIds.length === projects.length ? [] : checkedProjectIds;

    const requirements = this.requirements.controls
      .map(
        (group) =>
          (group as FormGroup).getRawValue() as {
            kind: PartnershipProgramRequirementKind;
            priority: PartnershipProgramRequirementPriority;
            label: string;
            description: string;
          },
      )
      .filter((row) => row.label.trim())
      .map((row, index) => ({
        kind: row.kind,
        priority: row.priority,
        label: row.label.trim(),
        description: row.description.trim() || undefined,
        sortOrder: index,
      }));

    const base: OfferingUpdatePayload = {
      name: raw.name.trim(),
      deliveryFormat: (raw.deliveryFormat || undefined) as PartnershipDeliveryFormat,
      status: statusOverride ?? raw.status,
      targetAge: nullable(raw.targetAge),
      targetGrades: nullable(raw.targetGrades),
      recommendedLevel: raw.recommendedLevel ? (raw.recommendedLevel as PartnershipProgramLevel) : null,
      learnerProfile: nullable(raw.learnerProfile),
      duration: num(raw.duration),
      durationUnit: raw.durationUnit ? (raw.durationUnit as PartnershipDurationUnit) : null,
      numberOfSessions: num(raw.numberOfSessions),
      sessionDurationMinutes: num(raw.sessionDurationMinutes),
      sessionFrequency: nullable(raw.sessionFrequency),
      deliveryMode: raw.deliveryMode ? (raw.deliveryMode as PartnershipDeliveryMode) : null,
      locationNotes: trimText(raw.locationNotes),
      groupSizeMin: num(raw.groupSizeMin),
      groupSizeMax: num(raw.groupSizeMax),
      numberOfGroups: num(raw.numberOfGroups),
      instructorRequirement: trimText(raw.instructorRequirement),
      coordinatorRequirement: trimText(raw.coordinatorRequirement),
      curriculumCustomizationNotes: trimText(raw.curriculumCustomizationNotes),
      projectCustomizationNotes: trimText(raw.projectCustomizationNotes),
      includeFinalProject: raw.includeFinalProject,
      assessmentFrequency: trimText(raw.assessmentFrequency),
      includeInitialAssessment: raw.includeInitialAssessment,
      includeMidAssessment: raw.includeMidAssessment,
      includeFinalAssessment: raw.includeFinalAssessment,
      studentProgressReport: raw.studentProgressReport,
      schoolSummaryReport: raw.schoolSummaryReport,
      internalNotes: trimText(raw.internalNotes),
      commercialNotes: trimText(raw.commercialNotes),
      selectedModuleIds,
      selectedProjectIds,
      requirements,
    };

    if (this.isEdit) {
      return base;
    }
    return { ...base, programId: raw.programId } as OfferingWritePayload;
  }

  cancel(): void {
    if (this.isEdit && this.editId) {
      void this.router.navigate(['/partnerships/offerings', this.editId]);
    } else {
      void this.router.navigateByUrl('/partnerships/offerings');
    }
  }
}
