import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  DEFAULT_PROGRAM_ASSESSMENTS,
  DELIVERY_FORMATS,
  PROGRAM_DOCUMENT_STATUSES,
  PROGRAM_DOCUMENT_TYPES,
  PROGRAM_LEVELS,
  PROGRAM_STATUSES,
  PROGRAM_TYPES,
  REQUIREMENT_PRIORITIES,
  programEnumLabel,
} from '../partnership.labels';
import {
  PartnershipDeliveryFormat,
  PartnershipProgram,
  PartnershipProgramDocumentStatus,
  PartnershipProgramDocumentType,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramRequirementPriority,
  PartnershipProgramStatus,
  PartnershipProgramType,
  ProgramUpdatePayload,
  ProgramWritePayload,
} from '../partnership.models';

type ProgramFormRawValue = {
  name: string;
  shortDescription: string;
  programType: PartnershipProgramType;
  targetAge: string;
  targetGrades: string;
  recommendedLevel: string;
  recommendedStudentProfile: string;
  status: PartnershipProgramStatus;
  displayOrder: number;
  internalNotes: string;
  schoolValue: string;
  studentValue: string;
  finalProjectName: string;
  finalProjectDescription: string;
  finalProjectExpectedOutput: string;
  finalProjectSkills: string;
  finalProjectEvaluationMethod: string;
  objectives: Array<{ title: string; description: string }>;
  outcomes: Array<{ title: string; description: string }>;
  curriculumModules: Array<{ title: string; description: string; skillsDeveloped: string }>;
  activities: Array<{ name: string; description: string; skillsDeveloped: string }>;
  sampleProjects: Array<{
    name: string;
    description: string;
    skills: string;
    expectedOutput: string;
  }>;
  assessmentMethods: Array<{
    key: string;
    label: string;
    description: string;
    weight: number | null;
    enabled: boolean;
  }>;
  equipmentRequirements: Array<{
    kind: PartnershipProgramRequirementKind;
    priority: PartnershipProgramRequirementPriority;
    label: string;
    description: string;
  }>;
  schoolRequirements: Array<{
    kind: PartnershipProgramRequirementKind;
    priority: PartnershipProgramRequirementPriority;
    label: string;
    description: string;
  }>;
  documents: Array<{
    documentType: PartnershipProgramDocumentType;
    title: string;
    url: string;
    version: string;
    status: PartnershipProgramDocumentStatus;
    notes: string;
    uploadedAt: string;
  }>;
};
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';

@Component({
  selector: 'app-program-form-page',
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
  templateUrl: './program-form.page.html',
  styleUrl: './program-form.page.scss',
})
export class ProgramFormPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);

  readonly programTypes = PROGRAM_TYPES;
  readonly programLevels = PROGRAM_LEVELS;
  readonly programStatuses = PROGRAM_STATUSES;
  readonly deliveryFormats = DELIVERY_FORMATS;
  readonly documentTypes = PROGRAM_DOCUMENT_TYPES;
  readonly requirementPriorities = REQUIREMENT_PRIORITIES;
  readonly programDocumentStatuses = PROGRAM_DOCUMENT_STATUSES;

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;

  readonly loading = signal(this.isEdit);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly deliveryFormatSelection = this.fb.group(
    DELIVERY_FORMATS.reduce(
      (acc, format) => {
        acc[format] = this.fb.nonNullable.control(false);
        return acc;
      },
      {} as Record<PartnershipDeliveryFormat, FormControl<boolean>>,
    ),
  );

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    shortDescription: [''],
    programType: ['TECHNICAL' as PartnershipProgramType, Validators.required],
    targetAge: [''],
    targetGrades: [''],
    recommendedLevel: ['' as PartnershipProgramLevel | ''],
    recommendedStudentProfile: [''],
    status: ['DRAFT' as PartnershipProgramStatus],
    displayOrder: [0],
    internalNotes: [''],
    schoolValue: [''],
    studentValue: [''],
    finalProjectName: [''],
    finalProjectDescription: [''],
    finalProjectExpectedOutput: [''],
    finalProjectSkills: [''],
    finalProjectEvaluationMethod: [''],
    objectives: this.fb.array<FormGroup>([]),
    outcomes: this.fb.array<FormGroup>([]),
    curriculumModules: this.fb.array<FormGroup>([]),
    activities: this.fb.array<FormGroup>([]),
    sampleProjects: this.fb.array<FormGroup>([]),
    assessmentMethods: this.fb.array<FormGroup>([]),
    equipmentRequirements: this.fb.array<FormGroup>([]),
    schoolRequirements: this.fb.array<FormGroup>([]),
    documents: this.fb.array<FormGroup>([]),
  });

  constructor() {
    this.initAssessmentDefaults();
    if (this.isEdit && this.editId) {
      this.load(this.editId);
    }
  }

  enumLabel = (category: Parameters<typeof programEnumLabel>[1], value: string | null | undefined) =>
    programEnumLabel((key) => this.i18n.t(key), category, value);

  get objectives(): FormArray {
    return this.form.controls.objectives;
  }

  get outcomes(): FormArray {
    return this.form.controls.outcomes;
  }

  get curriculumModules(): FormArray {
    return this.form.controls.curriculumModules;
  }

  get activities(): FormArray {
    return this.form.controls.activities;
  }

  get sampleProjects(): FormArray {
    return this.form.controls.sampleProjects;
  }

  get assessmentMethods(): FormArray {
    return this.form.controls.assessmentMethods;
  }

  get equipmentRequirements(): FormArray {
    return this.form.controls.equipmentRequirements;
  }

  get schoolRequirements(): FormArray {
    return this.form.controls.schoolRequirements;
  }

  get documents(): FormArray {
    return this.form.controls.documents;
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getProgram(id).subscribe({
      next: (program) => {
        this.patchProgram(program);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.programsLoadError')));
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.buildPayload();
    this.submitting.set(true);
    const request$ =
      this.isEdit && this.editId
        ? this.api.updateProgram(this.editId, payload)
        : this.api.createProgram(payload as ProgramWritePayload);

    request$.subscribe({
      next: (program) => {
        this.submitting.set(false);
        this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/programs', program.id]);
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

  cancel(): void {
    if (this.isEdit && this.editId) {
      void this.router.navigate(['/partnerships/programs', this.editId]);
    } else {
      void this.router.navigateByUrl('/partnerships/programs');
    }
  }

  addObjective(): void {
    this.objectives.push(this.objectiveGroup());
  }

  removeObjective(index: number): void {
    this.objectives.removeAt(index);
  }

  addOutcome(): void {
    this.outcomes.push(this.objectiveGroup());
  }

  removeOutcome(index: number): void {
    this.outcomes.removeAt(index);
  }

  addCurriculumModule(): void {
    this.curriculumModules.push(this.curriculumGroup());
  }

  removeCurriculumModule(index: number): void {
    this.curriculumModules.removeAt(index);
  }

  addActivity(): void {
    this.activities.push(this.activityGroup());
  }

  removeActivity(index: number): void {
    this.activities.removeAt(index);
  }

  addSampleProject(): void {
    this.sampleProjects.push(this.sampleProjectGroup());
  }

  removeSampleProject(index: number): void {
    this.sampleProjects.removeAt(index);
  }

  addAssessment(): void {
    this.assessmentMethods.push(this.assessmentGroup());
  }

  removeAssessment(index: number): void {
    this.assessmentMethods.removeAt(index);
  }

  addEquipmentRequirement(): void {
    this.equipmentRequirements.push(this.requirementGroup('EQUIPMENT'));
  }

  removeEquipmentRequirement(index: number): void {
    this.equipmentRequirements.removeAt(index);
  }

  addSchoolRequirement(): void {
    this.schoolRequirements.push(this.requirementGroup('SCHOOL'));
  }

  removeSchoolRequirement(index: number): void {
    this.schoolRequirements.removeAt(index);
  }

  addDocument(): void {
    this.documents.push(this.documentGroup());
  }

  removeDocument(index: number): void {
    this.documents.removeAt(index);
  }

  resetAssessmentDefaults(): void {
    this.assessmentMethods.clear();
    this.initAssessmentDefaults();
  }

  private initAssessmentDefaults(): void {
    if (this.assessmentMethods.length > 0) {
      return;
    }
    for (const item of DEFAULT_PROGRAM_ASSESSMENTS) {
      this.assessmentMethods.push(
        this.fb.nonNullable.group({
          key: [item.key, Validators.required],
          label: [item.label, Validators.required],
          description: [item.description],
          weight: this.fb.control<number | null>(null),
          enabled: [item.enabled],
        }),
      );
    }
  }

  private patchProgram(program: PartnershipProgram): void {
    this.form.patchValue({
      name: program.name,
      shortDescription: program.shortDescription,
      programType: program.programType,
      targetAge: program.targetAge ?? '',
      targetGrades: program.targetGrades ?? '',
      recommendedLevel: program.recommendedLevel ?? '',
      recommendedStudentProfile: program.recommendedStudentProfile ?? '',
      status: program.status,
      displayOrder: program.displayOrder,
      internalNotes: program.internalNotes,
      schoolValue: program.schoolValue,
      studentValue: program.studentValue,
      finalProjectName: program.finalProjectName ?? '',
      finalProjectDescription: program.finalProjectDescription ?? '',
      finalProjectExpectedOutput: program.finalProjectExpectedOutput ?? '',
      finalProjectSkills: program.finalProjectSkills ?? '',
      finalProjectEvaluationMethod: program.finalProjectEvaluationMethod ?? '',
    });

    for (const format of DELIVERY_FORMATS) {
      this.deliveryFormatSelection.controls[format].setValue(
        program.deliveryFormats.includes(format),
      );
    }

    this.replaceArray(this.objectives, program.objectives, (item) =>
      this.objectiveGroup(item.title, item.description),
    );
    this.replaceArray(this.outcomes, program.outcomes, (item) =>
      this.objectiveGroup(item.title, item.description),
    );
    this.replaceArray(this.curriculumModules, program.curriculumModules, (item) =>
      this.curriculumGroup(item.title, item.description, item.skillsDeveloped),
    );
    this.replaceArray(this.activities, program.activities, (item) =>
      this.activityGroup(item.name, item.description, item.skillsDeveloped),
    );
    this.replaceArray(this.sampleProjects, program.sampleProjects, (item) =>
      this.sampleProjectGroup(
        item.name,
        item.description,
        item.skills,
        item.expectedOutput,
      ),
    );
    this.replaceArray(this.assessmentMethods, program.assessmentMethods, (item) =>
      this.assessmentGroup(
        item.key,
        item.label,
        item.description,
        item.enabled,
        item.weight,
      ),
    );
    this.replaceArray(
      this.equipmentRequirements,
      program.requirements.filter((r) => r.kind === 'EQUIPMENT'),
      (item) =>
        this.requirementGroup('EQUIPMENT', item.label, item.description, item.priority),
    );
    this.replaceArray(
      this.schoolRequirements,
      program.requirements.filter((r) => r.kind === 'SCHOOL'),
      (item) => this.requirementGroup('SCHOOL', item.label, item.description, item.priority),
    );
    this.replaceArray(this.documents, program.documents, (item) =>
      this.documentGroup(
        item.documentType,
        item.title,
        item.url ?? '',
        item.notes,
        item.version,
        item.status,
        item.uploadedAt,
      ),
    );
  }

  private replaceArray<T>(
    array: FormArray,
    items: T[],
    factory: (item: T) => FormGroup,
  ): void {
    array.clear();
    for (const item of items) {
      array.push(factory(item));
    }
  }

  private buildPayload(): ProgramWritePayload | ProgramUpdatePayload {
    const raw = this.form.getRawValue() as ProgramFormRawValue;
    const deliveryFormats = DELIVERY_FORMATS.filter(
      (format) => this.deliveryFormatSelection.controls[format].value,
    );

    return {
      name: raw.name.trim(),
      shortDescription: raw.shortDescription.trim() || undefined,
      programType: raw.programType,
      targetAge: raw.targetAge.trim() || undefined,
      targetGrades: raw.targetGrades.trim() || undefined,
      recommendedLevel: raw.recommendedLevel ? (raw.recommendedLevel as never) : null,
      recommendedStudentProfile: raw.recommendedStudentProfile.trim() || undefined,
      status: raw.status,
      displayOrder: Number(raw.displayOrder) || 0,
      internalNotes: raw.internalNotes.trim() || undefined,
      schoolValue: raw.schoolValue.trim() || undefined,
      studentValue: raw.studentValue.trim() || undefined,
      finalProjectName: raw.finalProjectName.trim() || undefined,
      finalProjectDescription: raw.finalProjectDescription.trim() || undefined,
      finalProjectExpectedOutput: raw.finalProjectExpectedOutput.trim() || undefined,
      finalProjectSkills: raw.finalProjectSkills.trim() || undefined,
      finalProjectEvaluationMethod: raw.finalProjectEvaluationMethod.trim() || undefined,
      objectives: this.mapTitleRows(raw.objectives),
      outcomes: this.mapTitleRows(raw.outcomes),
      curriculumModules: this.mapCurriculumRows(raw.curriculumModules),
      activities: raw.activities
        .filter((row) => row.name.trim())
        .map((row, index) => ({
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          skillsDeveloped: row.skillsDeveloped.trim() || undefined,
          sortOrder: index,
        })),
      sampleProjects: raw.sampleProjects
        .filter((row) => row.name.trim())
        .map((row, index) => ({
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          skills: row.skills.trim() || undefined,
          expectedOutput: row.expectedOutput.trim() || undefined,
          sortOrder: index,
        })),
      assessmentMethods: raw.assessmentMethods
        .filter((row) => row.key.trim() && row.label.trim())
        .map((row, index) => ({
          key: row.key.trim(),
          label: row.label.trim(),
          description: row.description.trim() || undefined,
          weight: this.parseOptionalWeight(row.weight),
          enabled: row.enabled,
          sortOrder: index,
        })),
      deliveryFormats,
      requirements: [
        ...raw.equipmentRequirements
          .filter((row) => row.label.trim())
          .map((row, index) => ({
            kind: 'EQUIPMENT' as PartnershipProgramRequirementKind,
            priority: row.priority,
            label: row.label.trim(),
            description: row.description.trim() || undefined,
            sortOrder: index,
          })),
        ...raw.schoolRequirements
          .filter((row) => row.label.trim())
          .map((row, index) => ({
            kind: 'SCHOOL' as PartnershipProgramRequirementKind,
            priority: row.priority,
            label: row.label.trim(),
            description: row.description.trim() || undefined,
            sortOrder: index,
          })),
      ],
      documents: raw.documents
        .filter((row) => row.title.trim())
        .map((row, index) => ({
          documentType: row.documentType as PartnershipProgramDocumentType,
          title: row.title.trim(),
          url: row.url.trim() || undefined,
          version: row.version.trim() || '1.0',
          status: row.status,
          notes: row.notes.trim() || undefined,
          uploadedAt: row.uploadedAt.trim() || undefined,
          sortOrder: index,
        })),
    };
  }

  private mapCurriculumRows(
    rows: Array<{ title: string; description: string; skillsDeveloped: string }>,
  ): NonNullable<ProgramWritePayload['curriculumModules']> {
    return rows
      .filter((row) => row.title.trim())
      .map((row, index) => ({
        title: row.title.trim(),
        description: row.description.trim() || undefined,
        skillsDeveloped: row.skillsDeveloped.trim() || undefined,
        sortOrder: index,
      }));
  }

  private parseOptionalWeight(value: number | null | string): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private mapTitleRows(
    rows: Array<{ title: string; description: string }>,
  ): ProgramWritePayload['objectives'] {
    return rows
      .filter((row) => row.title.trim())
      .map((row, index) => ({
        title: row.title.trim(),
        description: row.description.trim() || undefined,
        sortOrder: index,
      }));
  }

  private objectiveGroup(title = '', description = ''): FormGroup {
    return this.fb.nonNullable.group({
      title: [title, Validators.required],
      description: [description],
    });
  }

  private curriculumGroup(title = '', description = '', skillsDeveloped = ''): FormGroup {
    return this.fb.nonNullable.group({
      title: [title, Validators.required],
      description: [description],
      skillsDeveloped: [skillsDeveloped],
    });
  }

  private activityGroup(name = '', description = '', skillsDeveloped = ''): FormGroup {
    return this.fb.nonNullable.group({
      name: [name, Validators.required],
      description: [description],
      skillsDeveloped: [skillsDeveloped],
    });
  }

  private sampleProjectGroup(
    name = '',
    description = '',
    skills = '',
    expectedOutput = '',
  ): FormGroup {
    return this.fb.nonNullable.group({
      name: [name, Validators.required],
      description: [description],
      skills: [skills],
      expectedOutput: [expectedOutput],
    });
  }

  private assessmentGroup(
    key = '',
    label = '',
    description = '',
    enabled = true,
    weight: number | null = null,
  ): FormGroup {
    return this.fb.nonNullable.group({
      key: [key, Validators.required],
      label: [label, Validators.required],
      description: [description],
      weight: this.fb.control<number | null>(weight),
      enabled: [enabled],
    });
  }

  private requirementGroup(
    kind: PartnershipProgramRequirementKind,
    label = '',
    description = '',
    priority: PartnershipProgramRequirementPriority = 'REQUIRED',
  ): FormGroup {
    return this.fb.nonNullable.group({
      kind: [kind],
      priority: [priority],
      label: [label, Validators.required],
      description: [description],
    });
  }

  private documentGroup(
    documentType: PartnershipProgramDocumentType = 'OTHER',
    title = '',
    url = '',
    notes = '',
    version = '1.0',
    status: PartnershipProgramDocumentStatus = 'ACTIVE',
    uploadedAt = '',
  ): FormGroup {
    return this.fb.nonNullable.group({
      documentType: [documentType],
      title: [title, Validators.required],
      url: [url],
      version: [version],
      status: [status],
      notes: [notes],
      uploadedAt: [uploadedAt],
    });
  }

}
