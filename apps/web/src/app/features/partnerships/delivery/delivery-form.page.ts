import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import {
  DELIVERY_CHECKPOINT_KINDS,
  DELIVERY_CHECKPOINT_STATUSES,
  DELIVERY_COMM_TYPES,
  DELIVERY_DELIVERABLE_STATUSES,
  DELIVERY_DOCUMENT_TYPES,
  DELIVERY_ISSUE_SEVERITIES,
  DELIVERY_ISSUE_STATUSES,
  DELIVERY_MILESTONE_STATUSES,
  DELIVERY_PHASE_STATUSES,
  DELIVERY_RAID_STATUSES,
  DELIVERY_RAID_TYPES,
  DELIVERY_TASK_PRIORITIES,
  DELIVERY_TASK_STATUSES,
  deliveryEnumLabel,
} from '../partnership.labels';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { SowListItem } from '../sows/sow.models';
import { blankDisplay } from './delivery-display';
import { DeliveryUpdatePayload, PartnershipDelivery } from './delivery.models';

@Component({
  selector: 'app-delivery-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    PageHeader,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  templateUrl: './delivery-form.page.html',
  styleUrl: './delivery-form.page.scss',
})
export class DeliveryFormPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);

  readonly phaseStatuses = DELIVERY_PHASE_STATUSES;
  readonly milestoneStatuses = DELIVERY_MILESTONE_STATUSES;
  readonly taskPriorities = DELIVERY_TASK_PRIORITIES;
  readonly taskStatuses = DELIVERY_TASK_STATUSES;
  readonly deliverableStatuses = DELIVERY_DELIVERABLE_STATUSES;
  readonly issueSeverities = DELIVERY_ISSUE_SEVERITIES;
  readonly issueStatuses = DELIVERY_ISSUE_STATUSES;
  readonly raidTypes = DELIVERY_RAID_TYPES;
  readonly raidStatuses = DELIVERY_RAID_STATUSES;
  readonly commTypes = DELIVERY_COMM_TYPES;
  readonly checkpointKinds = DELIVERY_CHECKPOINT_KINDS;
  readonly checkpointStatuses = DELIVERY_CHECKPOINT_STATUSES;
  readonly documentTypes = DELIVERY_DOCUMENT_TYPES;

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;

  readonly loading = signal(this.isEdit);
  readonly submitting = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);

  // NEW-mode source SOW selection.
  readonly sows = signal<SowListItem[]>([]);
  readonly showAllSows = signal(false);
  readonly sourceSowControl = new FormControl('', { nonNullable: true });

  readonly deliveryMeta = signal<{
    deliveryNumber: string;
    status: string;
    sowNumber: string;
  } | null>(null);

  /** Existing phases/milestones for reference selects (by id). */
  readonly existingPhases = signal<{ id: string; name: string }[]>([]);
  readonly existingMilestones = signal<{ id: string; name: string }[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    startDate: [''],
    endDate: [''],
    finalReportRequired: [true],
    phases: this.fb.array<FormGroup>([]),
    milestones: this.fb.array<FormGroup>([]),
    tasks: this.fb.array<FormGroup>([]),
    teamMembers: this.fb.array<FormGroup>([]),
    deliverables: this.fb.array<FormGroup>([]),
    issues: this.fb.array<FormGroup>([]),
    raidItems: this.fb.array<FormGroup>([]),
    communications: this.fb.array<FormGroup>([]),
    checkpoints: this.fb.array<FormGroup>([]),
    documents: this.fb.array<FormGroup>([]),
  });

  readonly visibleSows = computed(() => this.sows());

  constructor() {
    const querySowId = this.route.snapshot.queryParamMap.get('sowId');
    if (this.isEdit && this.editId) {
      this.load(this.editId);
    } else if (querySowId) {
      this.createFromSow(querySowId);
    } else {
      this.loadSows();
    }
  }

  deliveryLabel = (
    category: Parameters<typeof deliveryEnumLabel>[1],
    value: string | null | undefined,
  ) => deliveryEnumLabel((key) => this.i18n.t(key), category, value);

  display = (value: string | null | undefined) =>
    blankDisplay(value, this.i18n.t('partnerships.noValue'));

  get phases(): FormArray {
    return this.form.controls.phases;
  }
  get milestones(): FormArray {
    return this.form.controls.milestones;
  }
  get tasks(): FormArray {
    return this.form.controls.tasks;
  }
  get teamMembers(): FormArray {
    return this.form.controls.teamMembers;
  }
  get deliverables(): FormArray {
    return this.form.controls.deliverables;
  }
  get issues(): FormArray {
    return this.form.controls.issues;
  }
  get raidItems(): FormArray {
    return this.form.controls.raidItems;
  }
  get communications(): FormArray {
    return this.form.controls.communications;
  }
  get checkpoints(): FormArray {
    return this.form.controls.checkpoints;
  }
  get documents(): FormArray {
    return this.form.controls.documents;
  }

  // --- NEW mode: pick a source active SOW ----------------------------------

  private loadSows(): void {
    const status = this.showAllSows() ? undefined : 'ACTIVE';
    this.api.listSows({ status, pageSize: 100 }).subscribe({
      next: (result) => this.sows.set(result.items),
      error: () => this.sows.set([]),
    });
  }

  toggleAllSows(): void {
    this.showAllSows.update((v) => !v);
    this.sourceSowControl.setValue('');
    this.loadSows();
  }

  confirmSourceSow(): void {
    const sowId = this.sourceSowControl.value;
    if (!sowId) {
      this.snackBar.open(
        this.i18n.t('partnerships.deliverySourceSowRequired'),
        this.i18n.t('common.ok'),
        { duration: 3000 },
      );
      return;
    }
    this.createFromSow(sowId);
  }

  private createFromSow(sowId: string): void {
    this.creating.set(true);
    this.api.createDeliveryFromSow(sowId).subscribe({
      next: (delivery) => {
        this.creating.set(false);
        this.snackBar.open(this.i18n.t('partnerships.deliveryCreated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/delivery', delivery.id, 'edit']);
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
    this.api.getDelivery(id).subscribe({
      next: (delivery) => {
        this.patchFromDelivery(delivery);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.deliveryLoadError')));
      },
    });
  }

  private toDateInput(value: string | null | undefined): string {
    return value ? value.slice(0, 10) : '';
  }

  private patchFromDelivery(delivery: PartnershipDelivery): void {
    this.deliveryMeta.set({
      deliveryNumber: delivery.deliveryNumber,
      status: delivery.status,
      sowNumber: delivery.sow?.sowNumber || delivery.sowNumberSnapshot,
    });
    this.existingPhases.set(delivery.phases.map((p) => ({ id: p.id, name: p.name })));
    this.existingMilestones.set(delivery.milestones.map((m) => ({ id: m.id, name: m.name })));

    this.form.patchValue({
      name: delivery.name,
      startDate: this.toDateInput(delivery.startDate),
      endDate: this.toDateInput(delivery.endDate),
      finalReportRequired: delivery.finalReportRequired,
    });

    this.phases.clear();
    delivery.phases.forEach((p) =>
      this.phases.push(
        this.fb.nonNullable.group({
          id: [p.id],
          name: [p.name, Validators.required],
          description: [p.description],
          startDate: [this.toDateInput(p.startDate)],
          endDate: [this.toDateInput(p.endDate)],
          owner: [p.owner],
          status: [p.status],
        }),
      ),
    );

    this.milestones.clear();
    delivery.milestones.forEach((m) =>
      this.milestones.push(
        this.fb.nonNullable.group({
          id: [m.id],
          phaseRef: [m.phaseId ?? ''],
          name: [m.name, Validators.required],
          description: [m.description],
          startDate: [this.toDateInput(m.startDate)],
          endDate: [this.toDateInput(m.endDate)],
          owner: [m.owner],
          status: [m.status],
          requiredForCompletion: [m.requiredForCompletion],
        }),
      ),
    );

    this.tasks.clear();
    delivery.tasks.forEach((task) =>
      this.tasks.push(
        this.fb.nonNullable.group({
          id: [task.id],
          phaseRef: [task.phaseId ?? ''],
          milestoneRef: [task.milestoneId ?? ''],
          title: [task.title, Validators.required],
          description: [task.description],
          owner: [task.owner],
          priority: [task.priority],
          startDate: [this.toDateInput(task.startDate)],
          dueDate: [this.toDateInput(task.dueDate)],
          status: [task.status],
        }),
      ),
    );

    this.teamMembers.clear();
    delivery.teamMembers.forEach((member) =>
      this.teamMembers.push(
        this.fb.nonNullable.group({
          id: [member.id],
          role: [member.role, Validators.required],
          name: [member.name],
          responsibilities: [member.responsibilities],
          availability: [member.availability],
        }),
      ),
    );

    this.deliverables.clear();
    delivery.deliverables.forEach((d) =>
      this.deliverables.push(
        this.fb.nonNullable.group({
          id: [d.id],
          name: [d.name, Validators.required],
          description: [d.description],
          owner: [d.owner],
          dueDate: [this.toDateInput(d.dueDate)],
          acceptanceCriteria: [d.acceptanceCriteria],
          status: [d.status],
          requiredForCompletion: [d.requiredForCompletion],
        }),
      ),
    );

    this.issues.clear();
    delivery.issues.forEach((i) =>
      this.issues.push(
        this.fb.nonNullable.group({
          id: [i.id],
          title: [i.title, Validators.required],
          description: [i.description],
          category: [i.category],
          severity: [i.severity],
          owner: [i.owner],
          dueDate: [this.toDateInput(i.dueDate)],
          status: [i.status],
          resolution: [i.resolution],
        }),
      ),
    );

    this.raidItems.clear();
    delivery.raidItems.forEach((r) =>
      this.raidItems.push(
        this.fb.nonNullable.group({
          id: [r.id],
          type: [r.type, Validators.required],
          title: [r.title, Validators.required],
          description: [r.description],
          owner: [r.owner],
          impact: [r.impact],
          probability: [r.probability],
          mitigation: [r.mitigation],
          dueDate: [this.toDateInput(r.dueDate)],
          status: [r.status],
        }),
      ),
    );

    this.communications.clear();
    delivery.communications.forEach((c) =>
      this.communications.push(
        this.fb.nonNullable.group({
          id: [c.id],
          type: [c.type, Validators.required],
          occurredAt: [this.toDateInput(c.occurredAt)],
          participants: [c.participants],
          subject: [c.subject],
          summary: [c.summary],
          actionItems: [c.actionItems],
          owner: [c.owner],
          followUpDate: [this.toDateInput(c.followUpDate)],
        }),
      ),
    );

    this.checkpoints.clear();
    delivery.checkpoints.forEach((c) =>
      this.checkpoints.push(
        this.fb.nonNullable.group({
          id: [c.id],
          kind: [c.kind],
          name: [c.name, Validators.required],
          checkpointDate: [this.toDateInput(c.checkpointDate)],
          participants: [c.participants],
          discussion: [c.discussion],
          decisions: [c.decisions],
          actionItems: [c.actionItems],
          status: [c.status],
        }),
      ),
    );

    this.documents.clear();
    delivery.documents.forEach((doc) =>
      this.documents.push(
        this.fb.nonNullable.group({
          id: [doc.id],
          name: [doc.name, Validators.required],
          type: [doc.type],
          version: [doc.version],
          uploadedBy: [doc.uploadedBy],
          fileUrl: [doc.fileUrl],
          notes: [doc.notes],
        }),
      ),
    );
  }

  // --- Row builders ---------------------------------------------------------

  addPhase(): void {
    this.phases.push(
      this.fb.nonNullable.group({
        id: [''],
        name: ['', Validators.required],
        description: [''],
        startDate: [''],
        endDate: [''],
        owner: [''],
        status: ['NOT_STARTED'],
      }),
    );
  }

  addMilestone(): void {
    this.milestones.push(
      this.fb.nonNullable.group({
        id: [''],
        phaseRef: [''],
        name: ['', Validators.required],
        description: [''],
        startDate: [''],
        endDate: [''],
        owner: [''],
        status: ['NOT_STARTED'],
        requiredForCompletion: [true],
      }),
    );
  }

  addTask(): void {
    this.tasks.push(
      this.fb.nonNullable.group({
        id: [''],
        phaseRef: [''],
        milestoneRef: [''],
        title: ['', Validators.required],
        description: [''],
        owner: [''],
        priority: ['MEDIUM'],
        startDate: [''],
        dueDate: [''],
        status: ['TO_DO'],
      }),
    );
  }

  addTeamMember(): void {
    this.teamMembers.push(
      this.fb.nonNullable.group({
        id: [''],
        role: ['', Validators.required],
        name: [''],
        responsibilities: [''],
        availability: [''],
      }),
    );
  }

  addDeliverable(): void {
    this.deliverables.push(
      this.fb.nonNullable.group({
        id: [''],
        name: ['', Validators.required],
        description: [''],
        owner: [''],
        dueDate: [''],
        acceptanceCriteria: [''],
        status: ['NOT_STARTED'],
        requiredForCompletion: [true],
      }),
    );
  }

  addIssue(): void {
    this.issues.push(
      this.fb.nonNullable.group({
        id: [''],
        title: ['', Validators.required],
        description: [''],
        category: [''],
        severity: ['MEDIUM'],
        owner: [''],
        dueDate: [''],
        status: ['OPEN'],
        resolution: [''],
      }),
    );
  }

  addRaid(): void {
    this.raidItems.push(
      this.fb.nonNullable.group({
        id: [''],
        type: ['RISK', Validators.required],
        title: ['', Validators.required],
        description: [''],
        owner: [''],
        impact: [''],
        probability: [''],
        mitigation: [''],
        dueDate: [''],
        status: ['OPEN'],
      }),
    );
  }

  addCommunication(): void {
    this.communications.push(
      this.fb.nonNullable.group({
        id: [''],
        type: ['MEETING', Validators.required],
        occurredAt: [''],
        participants: [''],
        subject: [''],
        summary: [''],
        actionItems: [''],
        owner: [''],
        followUpDate: [''],
      }),
    );
  }

  addCheckpoint(): void {
    this.checkpoints.push(
      this.fb.nonNullable.group({
        id: [''],
        kind: ['CUSTOM'],
        name: ['', Validators.required],
        checkpointDate: [''],
        participants: [''],
        discussion: [''],
        decisions: [''],
        actionItems: [''],
        status: ['PLANNED'],
      }),
    );
  }

  addDocument(): void {
    this.documents.push(
      this.fb.nonNullable.group({
        id: [''],
        name: ['', Validators.required],
        type: ['OTHER'],
        version: ['1'],
        uploadedBy: [''],
        fileUrl: [''],
        notes: [''],
      }),
    );
  }

  removeAt(array: FormArray, index: number): void {
    array.removeAt(index);
  }

  // --- Payload + save -------------------------------------------------------

  private nullableDate(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private trimText(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  private idOrUndefined(value: string | null | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private refOrNull(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private buildPayload(): DeliveryUpdatePayload {
    const raw = this.form.getRawValue() as Record<string, unknown>;

    const phases = (raw['phases'] as Record<string, string>[])
      .filter((p) => (p['name'] || '').trim())
      .map((p, index) => ({
        id: this.idOrUndefined(p['id']),
        name: p['name'].trim(),
        description: this.trimText(p['description']),
        startDate: this.nullableDate(p['startDate']),
        endDate: this.nullableDate(p['endDate']),
        owner: this.trimText(p['owner']),
        status: p['status'] as never,
        sortOrder: index,
      }));

    const milestones = (raw['milestones'] as Record<string, unknown>[])
      .filter((m) => ((m['name'] as string) || '').trim())
      .map((m, index) => ({
        id: this.idOrUndefined(m['id'] as string),
        phaseRef: this.refOrNull(m['phaseRef'] as string),
        name: (m['name'] as string).trim(),
        description: this.trimText(m['description'] as string),
        startDate: this.nullableDate(m['startDate'] as string),
        endDate: this.nullableDate(m['endDate'] as string),
        owner: this.trimText(m['owner'] as string),
        status: m['status'] as never,
        requiredForCompletion: !!m['requiredForCompletion'],
        sortOrder: index,
      }));

    const tasks = (raw['tasks'] as Record<string, unknown>[])
      .filter((t) => ((t['title'] as string) || '').trim())
      .map((t, index) => ({
        id: this.idOrUndefined(t['id'] as string),
        phaseRef: this.refOrNull(t['phaseRef'] as string),
        milestoneRef: this.refOrNull(t['milestoneRef'] as string),
        title: (t['title'] as string).trim(),
        description: this.trimText(t['description'] as string),
        owner: this.trimText(t['owner'] as string),
        priority: t['priority'] as never,
        startDate: this.nullableDate(t['startDate'] as string),
        dueDate: this.nullableDate(t['dueDate'] as string),
        status: t['status'] as never,
        sortOrder: index,
      }));

    const teamMembers = (raw['teamMembers'] as Record<string, string>[])
      .filter((m) => (m['role'] || '').trim())
      .map((m, index) => ({
        id: this.idOrUndefined(m['id']),
        role: m['role'].trim(),
        name: this.trimText(m['name']),
        responsibilities: this.trimText(m['responsibilities']),
        availability: this.trimText(m['availability']),
        sortOrder: index,
      }));

    const deliverables = (raw['deliverables'] as Record<string, unknown>[])
      .filter((d) => ((d['name'] as string) || '').trim())
      .map((d, index) => ({
        id: this.idOrUndefined(d['id'] as string),
        name: (d['name'] as string).trim(),
        description: this.trimText(d['description'] as string),
        owner: this.trimText(d['owner'] as string),
        dueDate: this.nullableDate(d['dueDate'] as string),
        acceptanceCriteria: this.trimText(d['acceptanceCriteria'] as string),
        status: d['status'] as never,
        requiredForCompletion: !!d['requiredForCompletion'],
        sortOrder: index,
      }));

    const issues = (raw['issues'] as Record<string, string>[])
      .filter((i) => (i['title'] || '').trim())
      .map((i) => ({
        id: this.idOrUndefined(i['id']),
        title: i['title'].trim(),
        description: this.trimText(i['description']),
        category: this.trimText(i['category']),
        severity: i['severity'] as never,
        owner: this.trimText(i['owner']),
        dueDate: this.nullableDate(i['dueDate']),
        status: i['status'] as never,
        resolution: this.trimText(i['resolution']),
      }));

    const raidItems = (raw['raidItems'] as Record<string, string>[])
      .filter((r) => (r['title'] || '').trim())
      .map((r, index) => ({
        id: this.idOrUndefined(r['id']),
        type: r['type'] as never,
        title: r['title'].trim(),
        description: this.trimText(r['description']),
        owner: this.trimText(r['owner']),
        impact: this.trimText(r['impact']),
        probability: this.trimText(r['probability']),
        mitigation: this.trimText(r['mitigation']),
        dueDate: this.nullableDate(r['dueDate']),
        status: r['status'] as never,
        sortOrder: index,
      }));

    const communications = (raw['communications'] as Record<string, string>[])
      .filter((c) => (c['subject'] || '').trim() || (c['summary'] || '').trim())
      .map((c) => ({
        id: this.idOrUndefined(c['id']),
        type: c['type'] as never,
        occurredAt: this.nullableDate(c['occurredAt']),
        participants: this.trimText(c['participants']),
        subject: this.trimText(c['subject']),
        summary: this.trimText(c['summary']),
        actionItems: this.trimText(c['actionItems']),
        owner: this.trimText(c['owner']),
        followUpDate: this.nullableDate(c['followUpDate']),
      }));

    const checkpoints = (raw['checkpoints'] as Record<string, string>[])
      .filter((c) => (c['name'] || '').trim())
      .map((c, index) => ({
        id: this.idOrUndefined(c['id']),
        kind: c['kind'] as never,
        name: c['name'].trim(),
        checkpointDate: this.nullableDate(c['checkpointDate']),
        participants: this.trimText(c['participants']),
        discussion: this.trimText(c['discussion']),
        decisions: this.trimText(c['decisions']),
        actionItems: this.trimText(c['actionItems']),
        status: c['status'] as never,
        sortOrder: index,
      }));

    const documents = (raw['documents'] as Record<string, string>[])
      .filter((d) => (d['name'] || '').trim())
      .map((d) => ({
        id: this.idOrUndefined(d['id']),
        name: d['name'].trim(),
        type: d['type'] as never,
        version: this.trimText(d['version']),
        uploadedBy: this.trimText(d['uploadedBy']),
        fileUrl: this.trimText(d['fileUrl']),
        notes: this.trimText(d['notes']),
      }));

    return {
      name: this.trimText(raw['name'] as string),
      startDate: this.nullableDate(raw['startDate'] as string),
      endDate: this.nullableDate(raw['endDate'] as string),
      finalReportRequired: !!raw['finalReportRequired'],
      phases,
      milestones,
      tasks,
      teamMembers,
      deliverables,
      issues,
      raidItems,
      communications,
      checkpoints,
      documents,
    };
  }

  save(): void {
    if (!this.editId) {
      return;
    }
    if (this.form.controls.name.invalid) {
      this.form.controls.name.markAsTouched();
      return;
    }
    this.submitting.set(true);
    this.api.updateDelivery(this.editId, this.buildPayload()).subscribe({
      next: (saved) => {
        this.submitting.set(false);
        this.snackBar.open(this.i18n.t('partnerships.deliverySaved'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/delivery', saved.id]);
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
    if (this.editId) {
      void this.router.navigate(['/partnerships/delivery', this.editId]);
    } else {
      void this.router.navigateByUrl('/partnerships/delivery');
    }
  }
}
