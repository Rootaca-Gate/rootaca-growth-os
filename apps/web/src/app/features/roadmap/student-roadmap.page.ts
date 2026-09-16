import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { PlacementApi } from '../placement/placement.api';
import { Skill } from '../placement/placement.models';
import { RoadmapProgressCard } from './roadmap-progress-card';
import { RoadmapApi } from './roadmap.api';
import { ROADMAP_STATUSES } from './roadmap.labels';
import { RoadmapItem, RoadmapItemStatus, RoadmapPhase, StudentRoadmap } from './roadmap.models';

@Component({
  selector: 'app-student-roadmap-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    PageHeader,
    EmptyState,
    RoadmapProgressCard,
    TPipe,
  ],
  template: `
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (error(); as message) {
      <app-page-header [title]="'students.roadmap' | t" [subtitle]="'hubs.roadmapSubtitle' | t">
        <a mat-button [routerLink]="['/students', studentId]">{{ 'orientation.backToProfile' | t }}</a>
      </app-page-header>
      <app-empty-state [title]="'hubs.noRoadmap' | t" [message]="message" />
    } @else if (roadmap(); as current) {
      <app-page-header
        [title]="'hubs.roadmapNamed' | t:{ path: current.pathName }"
        [subtitle]="'hubs.roadmapTemplate' | t:{ level: current.levelName }"
      >
        @if (canEdit()) {
          <button mat-stroked-button type="button" [disabled]="saving()" (click)="regenerate()">
            {{ 'hubs.regenerate' | t }}
          </button>
        }
        <a mat-button [routerLink]="['/students', current.studentId]">{{ 'orientation.backToProfile' | t }}</a>
      </app-page-header>

      <app-roadmap-progress-card [roadmap]="current" />

      <ol class="timeline">
        @for (phase of current.phases; track phase.id; let phaseIndex = $index) {
          <li class="phase">
            <div class="phase-rail"></div>
            <article>
              <header>
                <div>
                  <p class="kicker">{{ 'hubs.phaseLabel' | t:{ n: phase.sortOrder } }}</p>
                  <h2>{{ phase.title }}</h2>
                  <p>{{ phase.description }}</p>
                </div>
                @if (canEdit()) {
                  <div class="actions">
                    <button mat-button type="button" [disabled]="phaseIndex === 0" (click)="movePhase(phaseIndex, -1)">
                      {{ 'common.up' | t }}
                    </button>
                    <button
                      mat-button
                      type="button"
                      [disabled]="phaseIndex === current.phases.length - 1"
                      (click)="movePhase(phaseIndex, 1)"
                    >
                      {{ 'common.down' | t }}
                    </button>
                    <button mat-button type="button" (click)="removePhase(phase.id)">{{ 'common.remove' | t }}</button>
                  </div>
                }
              </header>
              <mat-progress-bar mode="determinate" [value]="phase.progressPercent" />

              <ol class="items">
                @for (item of phase.items; track item.id; let itemIndex = $index) {
                  <li [attr.data-status]="item.status">
                    <div class="item-head">
                      <div>
                        <strong>{{ item.title }}</strong>
                        <span>
                          {{ i18n.statusLabel(item.status) }} · {{ item.completionPercentage }}% ·
                          {{ 'hubs.daysCount' | t:{ count: item.durationDays } }}
                          @if (item.startDate) {
                            · {{ item.startDate }} → {{ item.dueDate }}
                          }
                        </span>
                        <p>{{ item.description }}</p>
                        @if (item.skill) {
                          <p class="skill">{{ 'hubs.skill' | t }} · {{ item.skill.name }}</p>
                        }
                        @if (item.notes) {
                          <p class="skill">{{ 'common.notes' | t }} · {{ item.notes }}</p>
                        }
                      </div>
                      @if (canEdit()) {
                        <div class="actions">
                          <button mat-button type="button" [disabled]="itemIndex === 0" (click)="moveItem(phase, itemIndex, -1)">
                            {{ 'common.up' | t }}
                          </button>
                          <button
                            mat-button
                            type="button"
                            [disabled]="itemIndex === phase.items.length - 1"
                            (click)="moveItem(phase, itemIndex, 1)"
                          >
                            {{ 'common.down' | t }}
                          </button>
                          <button mat-button type="button" (click)="editItem(item)">{{ 'common.edit' | t }}</button>
                          <button mat-button type="button" (click)="removeItem(item.id)">{{ 'common.remove' | t }}</button>
                        </div>
                      }
                    </div>
                    <mat-progress-bar mode="determinate" [value]="item.completionPercentage" />
                    @if (editingItemId() === item.id) {
                      <form [formGroup]="itemForm" (ngSubmit)="saveItem(item.id)">
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'common.titleField' | t }}</mat-label>
                          <input matInput formControlName="title" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'common.description' | t }}</mat-label>
                          <textarea matInput rows="3" formControlName="description"></textarea>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'hubs.skill' | t }}</mat-label>
                          <mat-select formControlName="skillId">
                            <mat-option value="">{{ 'common.none' | t }}</mat-option>
                            @for (skill of skills(); track skill.id) {
                              <mat-option [value]="skill.id">{{ skill.name }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'projects.durationDays' | t }}</mat-label>
                          <input matInput type="number" formControlName="durationDays" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'hubs.startDate' | t }}</mat-label>
                          <input matInput formControlName="startDate" placeholder="YYYY-MM-DD" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'projects.dueDate' | t }}</mat-label>
                          <input matInput formControlName="dueDate" placeholder="YYYY-MM-DD" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'common.status' | t }}</mat-label>
                          <mat-select formControlName="status">
                            @for (status of statuses; track status) {
                              <mat-option [value]="status">{{ i18n.statusLabel(status) }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'projects.completion' | t }}</mat-label>
                          <input matInput type="number" formControlName="completionPercentage" />
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'common.notes' | t }}</mat-label>
                          <textarea matInput rows="2" formControlName="notes"></textarea>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>{{ 'hubs.projectId' | t }}</mat-label>
                          <input matInput formControlName="projectId" />
                        </mat-form-field>
                        <div class="actions">
                          <button mat-flat-button color="primary" type="submit" [disabled]="itemForm.invalid || saving()">
                            {{ 'hubs.saveItem' | t }}
                          </button>
                          <button mat-button type="button" (click)="editingItemId.set(null)">{{ 'common.cancel' | t }}</button>
                        </div>
                      </form>
                    }
                  </li>
                }
              </ol>

              @if (canEdit() && addingPhaseId() === phase.id) {
                <form [formGroup]="itemForm" (ngSubmit)="createItem(phase.id)">
                  <h3>{{ 'hubs.addItem' | t }}</h3>
                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'common.titleField' | t }}</mat-label>
                    <input matInput formControlName="title" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'common.description' | t }}</mat-label>
                    <textarea matInput rows="3" formControlName="description"></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'projects.durationDays' | t }}</mat-label>
                    <input matInput type="number" formControlName="durationDays" />
                  </mat-form-field>
                  <div class="actions">
                    <button mat-flat-button color="primary" type="submit" [disabled]="itemForm.invalid || saving()">
                      {{ 'hubs.addItem' | t }}
                    </button>
                    <button mat-button type="button" (click)="addingPhaseId.set(null)">{{ 'common.cancel' | t }}</button>
                  </div>
                </form>
              } @else if (canEdit()) {
                <button mat-stroked-button type="button" (click)="startAddItem(phase.id)">{{ 'hubs.addItem' | t }}</button>
              }
            </article>
          </li>
        }
      </ol>

      @if (canEdit()) {
        <form class="add-phase" [formGroup]="phaseForm" (ngSubmit)="createPhase()">
          <h2>{{ 'hubs.addPhase' | t }}</h2>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'common.titleField' | t }}</mat-label>
            <input matInput formControlName="title" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'common.description' | t }}</mat-label>
            <textarea matInput rows="2" formControlName="description"></textarea>
          </mat-form-field>
          <button mat-stroked-button type="submit" [disabled]="phaseForm.invalid || saving()">{{ 'hubs.addPhase' | t }}</button>
        </form>
      }
    }
  `,
  styles: `
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .timeline,
    .items {
      list-style: none;
      margin: 24px 0 0;
      padding: 0;
      display: grid;
      gap: 20px;
    }

    .phase {
      display: grid;
      grid-template-columns: 16px 1fr;
      gap: 16px;
    }

    .phase-rail {
      border-radius: 999px;
      background: var(--mat-sys-primary);
      opacity: 0.35;
    }

    article,
    .add-phase,
    form {
      display: grid;
      gap: 12px;
    }

    article,
    .add-phase {
      padding: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: var(--mat-sys-surface-container-lowest);
    }

    header,
    .item-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .kicker {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    .items li {
      padding: 14px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-low);
      display: grid;
      gap: 10px;
    }

    .items li[data-status='BLOCKED'] {
      outline: 1px solid color-mix(in srgb, var(--mat-sys-error) 45%, transparent);
    }

    span,
    .skill {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9rem;
    }

    .add-phase {
      margin-top: 24px;
    }
  `,
})
export class StudentRoadmapPage {
  private readonly api = inject(RoadmapApi);
  private readonly placementApi = inject(PlacementApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(DirectionService);

  readonly studentId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly roadmap = signal<StudentRoadmap | null>(null);
  readonly skills = signal<Skill[]>([]);
  readonly editingItemId = signal<string | null>(null);
  readonly addingPhaseId = signal<string | null>(null);
  readonly statuses = ROADMAP_STATUSES;
  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'ADMIN' || role === 'MENTOR';
  });

  readonly phaseForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  readonly itemForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    skillId: new FormControl('', { nonNullable: true }),
    durationDays: new FormControl(7, { nonNullable: true, validators: [Validators.min(1), Validators.max(90)] }),
    startDate: new FormControl('', { nonNullable: true }),
    dueDate: new FormControl('', { nonNullable: true }),
    status: new FormControl<RoadmapItemStatus>('NOT_STARTED', { nonNullable: true }),
    completionPercentage: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(100)],
    }),
    notes: new FormControl('', { nonNullable: true }),
    projectId: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.reload();
    this.placementApi.listSkills().subscribe({
      next: (skills) => this.skills.set(skills),
    });
  }

  statusLabel(status: RoadmapItemStatus): string {
    return this.i18n.statusLabel(status);
  }

  regenerate(): void {
    this.run(this.api.generate(this.studentId), this.i18n.t('hubs.regenerated'));
  }

  createPhase(): void {
    if (this.phaseForm.invalid) {
      return;
    }
    this.run(this.api.addPhase(this.studentId, this.phaseForm.getRawValue()), this.i18n.t('hubs.phaseAdded'));
    this.phaseForm.reset({ title: '', description: '' });
  }

  removePhase(phaseId: string): void {
    this.run(this.api.removePhase(this.studentId, phaseId), this.i18n.t('hubs.phaseRemoved'));
  }

  movePhase(index: number, direction: number): void {
    const ids = (this.roadmap()?.phases ?? []).map((phase) => phase.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) {
      return;
    }
    const current = ids[index];
    const neighbor = ids[target];
    if (!current || !neighbor) {
      return;
    }
    ids[index] = neighbor;
    ids[target] = current;
    this.run(this.api.reorderPhases(this.studentId, ids), this.i18n.t('hubs.phasesReordered'));
  }

  startAddItem(phaseId: string): void {
    this.editingItemId.set(null);
    this.addingPhaseId.set(phaseId);
    this.itemForm.reset({
      title: '',
      description: '',
      skillId: '',
      durationDays: 7,
      startDate: '',
      dueDate: '',
      status: 'NOT_STARTED',
      completionPercentage: 0,
      notes: '',
      projectId: '',
    });
  }

  editItem(item: RoadmapItem): void {
    this.addingPhaseId.set(null);
    this.editingItemId.set(item.id);
    this.itemForm.reset({
      title: item.title,
      description: item.description,
      skillId: item.skill?.id ?? '',
      durationDays: item.durationDays,
      startDate: item.startDate ?? '',
      dueDate: item.dueDate ?? '',
      status: item.status,
      completionPercentage: item.completionPercentage,
      notes: item.notes,
      projectId: item.projectId ?? '',
    });
  }

  createItem(phaseId: string): void {
    if (this.itemForm.invalid) {
      return;
    }
    const value = this.itemForm.getRawValue();
    this.run(
      this.api.addItem(this.studentId, phaseId, {
        title: value.title,
        description: value.description,
        durationDays: Number(value.durationDays),
      }),
      this.i18n.t('hubs.itemAdded'),
    );
    this.addingPhaseId.set(null);
  }

  saveItem(itemId: string): void {
    if (this.itemForm.invalid) {
      return;
    }
    const value = this.itemForm.getRawValue();
    this.run(
      this.api.updateItem(this.studentId, itemId, {
        title: value.title,
        description: value.description,
        skillId: value.skillId || null,
        durationDays: Number(value.durationDays),
        startDate: value.startDate || undefined,
        dueDate: value.dueDate || undefined,
        status: value.status,
        completionPercentage: Number(value.completionPercentage),
        notes: value.notes,
        projectId: value.projectId || null,
      }),
      this.i18n.t('hubs.itemUpdated'),
    );
    this.editingItemId.set(null);
  }

  removeItem(itemId: string): void {
    this.run(this.api.removeItem(this.studentId, itemId), this.i18n.t('hubs.itemRemoved'));
  }

  moveItem(phase: RoadmapPhase, index: number, direction: number): void {
    const ids = phase.items.map((item) => item.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) {
      return;
    }
    const current = ids[index];
    const neighbor = ids[target];
    if (!current || !neighbor) {
      return;
    }
    ids[index] = neighbor;
    ids[target] = current;
    this.run(this.api.reorderItems(this.studentId, phase.id, ids), this.i18n.t('hubs.itemsReordered'));
  }

  private reload(): void {
    this.api.get(this.studentId).subscribe({
      next: (roadmap) => {
        this.roadmap.set(roadmap);
        this.error.set(null);
        this.loading.set(false);
        this.saving.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.saving.set(false);
        this.error.set(this.toMessage(error));
      },
    });
  }

  private run(request: ReturnType<RoadmapApi['get']>, message: string): void {
    this.saving.set(true);
    request.subscribe({
      next: (roadmap) => {
        this.roadmap.set(roadmap);
        this.saving.set(false);
        this.snackBar.open(message, this.i18n.t('common.ok'), { duration: 2000 });
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snackBar.open(this.toMessage(error), this.i18n.t('common.ok'), { duration: 4000 });
      },
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        return this.i18n.t('hubs.completeForRoadmap');
      }
      if (error.status === 403) {
        return this.i18n.t('hubs.onlyMentorsRoadmap');
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return this.i18n.t('hubs.unableRoadmap');
  }
}
