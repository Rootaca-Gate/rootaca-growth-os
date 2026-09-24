import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  DELIVERABLE_STATUSES,
  MILESTONE_STATUSES,
  offeringEnumLabel,
  programEnumLabel,
  sowEnumLabel,
} from '../partnership.labels';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { ProposalListItem } from '../proposals/proposal.models';
import {
  blankDisplay,
  formatScopeDuration,
  formatScopeGroupSize,
} from './sow-display';
import {
  PartnershipSow,
  PartnershipSowDeliverableStatus,
  PartnershipSowMilestoneStatus,
  SowScopeOffering,
  SowUpdatePayload,
} from './sow.models';

@Component({
  selector: 'app-sow-form-page',
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
  templateUrl: './sow-form.page.html',
  styleUrl: './sow-form.page.scss',
})
export class SowFormPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);

  readonly deliverableStatuses = DELIVERABLE_STATUSES;
  readonly milestoneStatuses = MILESTONE_STATUSES;
  readonly totalSteps = 8;
  readonly step = signal(1);

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;

  readonly loading = signal(this.isEdit);
  readonly submitting = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly locked = signal(false);

  // NEW-mode source proposal selection.
  readonly proposals = signal<ProposalListItem[]>([]);
  readonly showAllProposals = signal(false);
  readonly sourceProposalControl = new FormControl('', { nonNullable: true });

  readonly sowMeta = signal<{
    sowNumber: string;
    status: string;
    version: string;
  } | null>(null);
  readonly scopeOfferings = signal<SowScopeOffering[]>([]);
  readonly commercial = signal<{
    proposalNumber: string;
    agreedValue: number | null;
    currency: string | null;
    paymentTerms: string;
  } | null>(null);

  readonly stepLabels = [
    'partnerships.sowStepBasics',
    'partnerships.sowStepParties',
    'partnerships.sowStepScope',
    'partnerships.sowStepDeliverables',
    'partnerships.sowStepMilestones',
    'partnerships.sowStepResponsibilities',
    'partnerships.sowStepRequirements',
    'partnerships.sowStepReview',
  ];

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    sowDate: [''],
    effectiveDate: [''],
    startDate: [''],
    endDate: [''],
    preparedBy: [''],
    approvedBy: [''],
    clientName: [''],
    clientAddress: [''],
    primaryContactName: [''],
    primaryContactEmail: [''],
    primaryContactPhone: [''],
    purpose: [''],
    targetStudents: [''],
    deliveryModelNotes: [''],
    activitiesNotes: [''],
    projectsNotes: [''],
    assessmentNotes: [''],
    reportingNotes: [''],
    equipmentRequirements: [''],
    internetRequirements: [''],
    classroomLabRequirements: [''],
    studentDevicesRequirements: [''],
    softwareRequirements: [''],
    accountsAccessRequirements: [''],
    facultyLiaisonRequirements: [''],
    attendanceExpectations: [''],
    minimumParticipation: [''],
    studentReplacementRules: [''],
    makeupSessionRules: [''],
    termsAndConditions: [''],
    rootacaSignatoryName: [''],
    rootacaSignatoryTitle: [''],
    schoolSignatoryName: [''],
    schoolSignatoryTitle: [''],
    scopeIn: this.fb.array<FormGroup>([]),
    scopeOut: this.fb.array<FormGroup>([]),
    deliverables: this.fb.array<FormGroup>([]),
    milestones: this.fb.array<FormGroup>([]),
    responsibilities: this.fb.array<FormGroup>([]),
    rootacaTeam: this.fb.array<FormGroup>([]),
    schoolTeam: this.fb.array<FormGroup>([]),
    assessmentItems: this.fb.array<FormGroup>([]),
  });

  readonly visibleProposals = computed(() => this.proposals());

  constructor() {
    const queryProposalId = this.route.snapshot.queryParamMap.get('proposalId');
    if (this.isEdit && this.editId) {
      this.load(this.editId);
    } else if (queryProposalId) {
      this.createFromProposal(queryProposalId);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      this.form.controls.sowDate.setValue(today);
      this.loadProposals();
    }
  }

  blankDisplayFn = (value: string | null | undefined) =>
    blankDisplay(value, this.i18n.t('partnerships.noValue'));

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

  get scopeIn(): FormArray {
    return this.form.controls.scopeIn;
  }
  get scopeOut(): FormArray {
    return this.form.controls.scopeOut;
  }
  get deliverables(): FormArray {
    return this.form.controls.deliverables;
  }
  get milestones(): FormArray {
    return this.form.controls.milestones;
  }
  get responsibilities(): FormArray {
    return this.form.controls.responsibilities;
  }
  get rootacaTeam(): FormArray {
    return this.form.controls.rootacaTeam;
  }
  get schoolTeam(): FormArray {
    return this.form.controls.schoolTeam;
  }
  get assessmentItems(): FormArray {
    return this.form.controls.assessmentItems;
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
    const control = this.form.controls.title;
    control.markAsTouched();
    return control.valid;
  }

  // --- NEW mode: pick a source proposal ------------------------------------

  private loadProposals(): void {
    const status = this.showAllProposals() ? undefined : 'ACCEPTED';
    this.api.listProposals({ status, pageSize: 100 }).subscribe({
      next: (result) => this.proposals.set(result.items),
      error: () => this.proposals.set([]),
    });
  }

  toggleAllProposals(): void {
    this.showAllProposals.update((v) => !v);
    this.sourceProposalControl.setValue('');
    this.loadProposals();
  }

  confirmSourceProposal(): void {
    const proposalId = this.sourceProposalControl.value;
    if (!proposalId) {
      this.snackBar.open(
        this.i18n.t('partnerships.sowSourceProposalRequired'),
        this.i18n.t('common.ok'),
        { duration: 3000 },
      );
      return;
    }
    this.createFromProposal(proposalId);
  }

  private createFromProposal(proposalId: string): void {
    this.creating.set(true);
    this.api.createSowFromProposal(proposalId).subscribe({
      next: (sow) => {
        this.creating.set(false);
        this.snackBar.open(this.i18n.t('partnerships.sowsCreated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/sows', sow.id, 'edit']);
      },
      error: (err: unknown) => {
        this.creating.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  // --- EDIT mode: load + patch ---------------------------------------------

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getSow(id).subscribe({
      next: (sow) => {
        if (sow.isLocked) {
          this.locked.set(true);
          this.loading.set(false);
          this.error.set(this.i18n.t('partnerships.sowsLockedEditBlocked'));
          this.sowMeta.set({ sowNumber: sow.sowNumber, status: sow.status, version: sow.version });
          return;
        }
        this.patchFromSow(sow);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.sowsLoadError')));
      },
    });
  }

  private toDateInput(value: string | null | undefined): string {
    return value ? value.slice(0, 10) : '';
  }

  private patchFromSow(sow: PartnershipSow): void {
    this.sowMeta.set({ sowNumber: sow.sowNumber, status: sow.status, version: sow.version });
    this.scopeOfferings.set([...sow.scopeOfferings].sort((a, b) => a.sortOrder - b.sortOrder));
    this.commercial.set({
      proposalNumber: sow.proposalNumberSnapshot,
      agreedValue: sow.agreedValueSnapshot,
      currency: sow.currencySnapshot,
      paymentTerms: sow.paymentTermsSnapshot,
    });

    this.form.patchValue({
      title: sow.title,
      sowDate: this.toDateInput(sow.sowDate),
      effectiveDate: this.toDateInput(sow.effectiveDate),
      startDate: this.toDateInput(sow.startDate),
      endDate: this.toDateInput(sow.endDate),
      preparedBy: sow.preparedBy,
      approvedBy: sow.approvedBy,
      clientName: sow.clientName,
      clientAddress: sow.clientAddress,
      primaryContactName: sow.primaryContactName,
      primaryContactEmail: sow.primaryContactEmail,
      primaryContactPhone: sow.primaryContactPhone,
      purpose: sow.purpose,
      targetStudents: sow.targetStudents,
      deliveryModelNotes: sow.deliveryModelNotes,
      activitiesNotes: sow.activitiesNotes,
      projectsNotes: sow.projectsNotes,
      assessmentNotes: sow.assessmentNotes,
      reportingNotes: sow.reportingNotes,
      equipmentRequirements: sow.equipmentRequirements,
      internetRequirements: sow.internetRequirements,
      classroomLabRequirements: sow.classroomLabRequirements,
      studentDevicesRequirements: sow.studentDevicesRequirements,
      softwareRequirements: sow.softwareRequirements,
      accountsAccessRequirements: sow.accountsAccessRequirements,
      facultyLiaisonRequirements: sow.facultyLiaisonRequirements,
      attendanceExpectations: sow.attendanceExpectations,
      minimumParticipation: sow.minimumParticipation,
      studentReplacementRules: sow.studentReplacementRules,
      makeupSessionRules: sow.makeupSessionRules,
      termsAndConditions: sow.termsAndConditions,
      rootacaSignatoryName: sow.rootacaSignatoryName,
      rootacaSignatoryTitle: sow.rootacaSignatoryTitle,
      schoolSignatoryName: sow.schoolSignatoryName,
      schoolSignatoryTitle: sow.schoolSignatoryTitle,
    });

    this.scopeIn.clear();
    sow.scopeItems
      .filter((i) => i.kind === 'IN_SCOPE')
      .forEach((i) => this.scopeIn.push(this.scopeGroup(i.text)));
    this.scopeOut.clear();
    sow.scopeItems
      .filter((i) => i.kind === 'OUT_OF_SCOPE')
      .forEach((i) => this.scopeOut.push(this.scopeGroup(i.text)));

    this.deliverables.clear();
    sow.deliverables.forEach((d) =>
      this.deliverables.push(
        this.fb.nonNullable.group({
          name: [d.name, Validators.required],
          description: [d.description],
          owner: [d.owner],
          dueDate: [this.toDateInput(d.dueDate)],
          acceptanceCriteria: [d.acceptanceCriteria],
          status: [d.status as PartnershipSowDeliverableStatus],
        }),
      ),
    );

    this.milestones.clear();
    sow.milestones.forEach((m) =>
      this.milestones.push(
        this.fb.nonNullable.group({
          name: [m.name, Validators.required],
          description: [m.description],
          startDate: [this.toDateInput(m.startDate)],
          endDate: [this.toDateInput(m.endDate)],
          owner: [m.owner],
          status: [m.status as PartnershipSowMilestoneStatus],
        }),
      ),
    );

    this.responsibilities.clear();
    sow.responsibilities.forEach((r) =>
      this.responsibilities.push(
        this.fb.nonNullable.group({
          activity: [r.activity, Validators.required],
          rootacaRole: [r.rootacaRole],
          schoolRole: [r.schoolRole],
        }),
      ),
    );

    this.rootacaTeam.clear();
    this.schoolTeam.clear();
    sow.teamMembers.forEach((member) => {
      const group = this.teamGroup(member.role, member.name, member.responsibility, member.contact);
      if (member.party === 'SCHOOL') {
        this.schoolTeam.push(group);
      } else {
        this.rootacaTeam.push(group);
      }
    });

    this.assessmentItems.clear();
    sow.assessmentItems.forEach((a) =>
      this.assessmentItems.push(
        this.fb.nonNullable.group({
          name: [a.name, Validators.required],
          responsibleParty: [a.responsibleParty],
          frequency: [a.frequency],
          format: [a.format],
          dueDate: [this.toDateInput(a.dueDate)],
        }),
      ),
    );
  }

  private scopeGroup(text = ''): FormGroup {
    return this.fb.nonNullable.group({ text: [text, Validators.required] });
  }

  private teamGroup(role = '', name = '', responsibility = '', contact = ''): FormGroup {
    return this.fb.nonNullable.group({
      role: [role, Validators.required],
      name: [name],
      responsibility: [responsibility],
      contact: [contact],
    });
  }

  addScopeIn(): void {
    this.scopeIn.push(this.scopeGroup());
  }
  removeScopeIn(index: number): void {
    this.scopeIn.removeAt(index);
  }
  addScopeOut(): void {
    this.scopeOut.push(this.scopeGroup());
  }
  removeScopeOut(index: number): void {
    this.scopeOut.removeAt(index);
  }

  addDeliverable(): void {
    this.deliverables.push(
      this.fb.nonNullable.group({
        name: ['', Validators.required],
        description: [''],
        owner: [''],
        dueDate: [''],
        acceptanceCriteria: [''],
        status: ['NOT_STARTED' as PartnershipSowDeliverableStatus],
      }),
    );
  }
  removeDeliverable(index: number): void {
    this.deliverables.removeAt(index);
  }

  addMilestone(): void {
    this.milestones.push(
      this.fb.nonNullable.group({
        name: ['', Validators.required],
        description: [''],
        startDate: [''],
        endDate: [''],
        owner: [''],
        status: ['NOT_STARTED' as PartnershipSowMilestoneStatus],
      }),
    );
  }
  removeMilestone(index: number): void {
    this.milestones.removeAt(index);
  }

  addResponsibility(): void {
    this.responsibilities.push(
      this.fb.nonNullable.group({
        activity: ['', Validators.required],
        rootacaRole: [''],
        schoolRole: [''],
      }),
    );
  }
  removeResponsibility(index: number): void {
    this.responsibilities.removeAt(index);
  }

  addRootacaMember(): void {
    this.rootacaTeam.push(this.teamGroup());
  }
  removeRootacaMember(index: number): void {
    this.rootacaTeam.removeAt(index);
  }
  addSchoolMember(): void {
    this.schoolTeam.push(this.teamGroup());
  }
  removeSchoolMember(index: number): void {
    this.schoolTeam.removeAt(index);
  }

  addAssessmentItem(): void {
    this.assessmentItems.push(
      this.fb.nonNullable.group({
        name: ['', Validators.required],
        responsibleParty: [''],
        frequency: [''],
        format: [''],
        dueDate: [''],
      }),
    );
  }
  removeAssessmentItem(index: number): void {
    this.assessmentItems.removeAt(index);
  }

  private nullableDate(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private trimText(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  private buildPayload(): SowUpdatePayload {
    const raw = this.form.getRawValue();

    const scopeItems = [
      ...(raw.scopeIn as Array<{ text: string }>)
        .filter((i) => i.text.trim())
        .map((i, index) => ({ kind: 'IN_SCOPE' as const, text: i.text.trim(), sortOrder: index })),
      ...(raw.scopeOut as Array<{ text: string }>)
        .filter((i) => i.text.trim())
        .map((i, index) => ({
          kind: 'OUT_OF_SCOPE' as const,
          text: i.text.trim(),
          sortOrder: index,
        })),
    ];

    const deliverables = (
      raw.deliverables as Array<{
        name: string;
        description: string;
        owner: string;
        dueDate: string;
        acceptanceCriteria: string;
        status: PartnershipSowDeliverableStatus;
      }>
    )
      .filter((d) => d.name.trim())
      .map((d, index) => ({
        name: d.name.trim(),
        description: this.trimText(d.description),
        owner: this.trimText(d.owner),
        dueDate: this.nullableDate(d.dueDate),
        acceptanceCriteria: this.trimText(d.acceptanceCriteria),
        status: d.status,
        sortOrder: index,
      }));

    const milestones = (
      raw.milestones as Array<{
        name: string;
        description: string;
        startDate: string;
        endDate: string;
        owner: string;
        status: PartnershipSowMilestoneStatus;
      }>
    )
      .filter((m) => m.name.trim())
      .map((m, index) => ({
        name: m.name.trim(),
        description: this.trimText(m.description),
        startDate: this.nullableDate(m.startDate),
        endDate: this.nullableDate(m.endDate),
        owner: this.trimText(m.owner),
        status: m.status,
        sortOrder: index,
      }));

    const responsibilities = (
      raw.responsibilities as Array<{ activity: string; rootacaRole: string; schoolRole: string }>
    )
      .filter((r) => r.activity.trim())
      .map((r, index) => ({
        activity: r.activity.trim(),
        rootacaRole: this.trimText(r.rootacaRole),
        schoolRole: this.trimText(r.schoolRole),
        sortOrder: index,
      }));

    const mapTeam = (
      rows: Array<{ role: string; name: string; responsibility: string; contact: string }>,
      party: 'ROOTACA' | 'SCHOOL',
      offset: number,
    ) =>
      rows
        .filter((m) => m.role.trim())
        .map((m, index) => ({
          party,
          role: m.role.trim(),
          name: this.trimText(m.name),
          responsibility: this.trimText(m.responsibility),
          contact: this.trimText(m.contact),
          sortOrder: offset + index,
        }));

    const rootacaTeam = mapTeam(
      raw.rootacaTeam as Array<{ role: string; name: string; responsibility: string; contact: string }>,
      'ROOTACA',
      0,
    );
    const schoolTeam = mapTeam(
      raw.schoolTeam as Array<{ role: string; name: string; responsibility: string; contact: string }>,
      'SCHOOL',
      rootacaTeam.length,
    );

    const assessmentItems = (
      raw.assessmentItems as Array<{
        name: string;
        responsibleParty: string;
        frequency: string;
        format: string;
        dueDate: string;
      }>
    )
      .filter((a) => a.name.trim())
      .map((a, index) => ({
        name: a.name.trim(),
        responsibleParty: this.trimText(a.responsibleParty),
        frequency: this.trimText(a.frequency),
        format: this.trimText(a.format),
        dueDate: this.nullableDate(a.dueDate),
        sortOrder: index,
      }));

    return {
      title: raw.title.trim(),
      sowDate: this.nullableDate(raw.sowDate),
      effectiveDate: this.nullableDate(raw.effectiveDate),
      startDate: this.nullableDate(raw.startDate),
      endDate: this.nullableDate(raw.endDate),
      preparedBy: this.trimText(raw.preparedBy),
      approvedBy: this.trimText(raw.approvedBy),
      clientName: this.trimText(raw.clientName),
      clientAddress: this.trimText(raw.clientAddress),
      primaryContactName: this.trimText(raw.primaryContactName),
      primaryContactEmail: this.trimText(raw.primaryContactEmail),
      primaryContactPhone: this.trimText(raw.primaryContactPhone),
      purpose: this.trimText(raw.purpose),
      targetStudents: this.trimText(raw.targetStudents),
      deliveryModelNotes: this.trimText(raw.deliveryModelNotes),
      activitiesNotes: this.trimText(raw.activitiesNotes),
      projectsNotes: this.trimText(raw.projectsNotes),
      assessmentNotes: this.trimText(raw.assessmentNotes),
      reportingNotes: this.trimText(raw.reportingNotes),
      equipmentRequirements: this.trimText(raw.equipmentRequirements),
      internetRequirements: this.trimText(raw.internetRequirements),
      classroomLabRequirements: this.trimText(raw.classroomLabRequirements),
      studentDevicesRequirements: this.trimText(raw.studentDevicesRequirements),
      softwareRequirements: this.trimText(raw.softwareRequirements),
      accountsAccessRequirements: this.trimText(raw.accountsAccessRequirements),
      facultyLiaisonRequirements: this.trimText(raw.facultyLiaisonRequirements),
      attendanceExpectations: this.trimText(raw.attendanceExpectations),
      minimumParticipation: this.trimText(raw.minimumParticipation),
      studentReplacementRules: this.trimText(raw.studentReplacementRules),
      makeupSessionRules: this.trimText(raw.makeupSessionRules),
      termsAndConditions: this.trimText(raw.termsAndConditions),
      rootacaSignatoryName: this.trimText(raw.rootacaSignatoryName),
      rootacaSignatoryTitle: this.trimText(raw.rootacaSignatoryTitle),
      schoolSignatoryName: this.trimText(raw.schoolSignatoryName),
      schoolSignatoryTitle: this.trimText(raw.schoolSignatoryTitle),
      scopeItems,
      deliverables,
      milestones,
      responsibilities,
      teamMembers: [...rootacaTeam, ...schoolTeam],
      assessmentItems,
    };
  }

  save(): void {
    if (this.locked() || !this.editId) {
      return;
    }
    if (!this.validateBasics()) {
      this.goTo(1);
      return;
    }
    this.submitting.set(true);
    this.api.updateSow(this.editId, this.buildPayload()).subscribe({
      next: (saved) => {
        this.submitting.set(false);
        this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/sows', saved.id]);
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

  preview(): void {
    if (this.editId) {
      void this.router.navigate(['/partnerships/sows', this.editId, 'preview']);
    }
  }

  cancel(): void {
    if (this.editId) {
      void this.router.navigate(['/partnerships/sows', this.editId]);
    } else {
      void this.router.navigateByUrl('/partnerships/sows');
    }
  }
}
