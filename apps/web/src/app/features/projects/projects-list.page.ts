import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { LEVEL_LABELS, PATH_LABELS, PROJECT_LEVELS, PROJECT_PATHS } from './project.labels';
import { ProjectApi } from './project.api';
import { EducationalProject, LevelCode, PathCode } from './project.models';

@Component({
  selector: 'app-projects-list-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageHeader,
    EmptyState,
  ],
  template: `
    <app-page-header
      title="Educational projects"
      subtitle="Classroom learning work for students. These are not client case studies."
    >
      @if (canEdit() && !editing()) {
        <button mat-stroked-button type="button" (click)="startCreate()">Add project</button>
      }
    </app-page-header>

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (projects().length === 0 && !editing()) {
      <app-empty-state title="No educational projects" message="Seed the catalog or add a classroom project." />
    } @else {
      <div class="grid">
        @for (item of projects(); track item.id) {
          <article [attr.data-active]="item.active">
            <p class="kicker">{{ pathLabel(item.path) }} · {{ levelLabel(item.level) }} · classroom</p>
            <h2>{{ item.name }}</h2>
            <p>{{ item.description }}</p>
            <p class="meta">
              {{ item.durationDays }} days · {{ item.assignmentCount }} assigned
              @if (!item.active) {
                · Inactive
              }
            </p>
            <div class="actions">
              <a mat-stroked-button [routerLink]="['/projects', item.id]">Open</a>
              @if (canEdit()) {
                <button mat-button type="button" (click)="startEdit(item)">Edit</button>
                @if (item.active) {
                  <button mat-button type="button" (click)="deactivate(item.id)">Deactivate</button>
                }
              }
            </div>
          </article>
        }
      </div>
    }

    @if (canEdit() && editing()) {
      <form [formGroup]="form" (ngSubmit)="save()">
        <h2>{{ editingId() ? 'Edit educational project' : 'Add educational project' }}</h2>
        <p class="hint">Describe classroom practice only. Do not frame this as client work.</p>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Learning goal</mat-label>
          <textarea matInput rows="2" formControlName="learningGoal"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Path</mat-label>
          <mat-select formControlName="path">
            @for (path of paths; track path) {
              <mat-option [value]="path">{{ pathLabel(path) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Level</mat-label>
          <mat-select formControlName="level">
            @for (level of levels; track level) {
              <mat-option [value]="level">{{ levelLabel(level) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Duration (days)</mat-label>
          <input matInput type="number" formControlName="durationDays" />
        </mat-form-field>
        <div class="actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            Save project
          </button>
          <button mat-button type="button" (click)="editing.set(false)">Cancel</button>
        </div>
      </form>
    }
  `,
  styles: `
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    article,
    form {
      padding: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: var(--mat-sys-surface-container-lowest);
      display: grid;
      gap: 10px;
    }

    article[data-active='false'] {
      opacity: 0.65;
    }

    form {
      margin-top: 24px;
    }

    .kicker,
    .meta,
    .hint,
    p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .kicker {
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
    }

    h2 {
      margin: 0;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class ProjectsListPage {
  private readonly api = inject(ProjectApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly projects = signal<EducationalProject[]>([]);
  readonly paths = PROJECT_PATHS;
  readonly levels = PROJECT_LEVELS;
  readonly canEdit = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12)],
    }),
    learningGoal: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    path: new FormControl<PathCode>('WEB', { nonNullable: true }),
    level: new FormControl<LevelCode>('EXPLORER', { nonNullable: true }),
    durationDays: new FormControl(38, { nonNullable: true, validators: [Validators.min(7), Validators.max(180)] }),
  });

  constructor() {
    this.reload();
  }

  pathLabel(path: PathCode): string {
    return PATH_LABELS[path];
  }

  levelLabel(level: LevelCode): string {
    return LEVEL_LABELS[level];
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      description: '',
      learningGoal: '',
      path: 'WEB',
      level: 'EXPLORER',
      durationDays: 38,
    });
    this.editing.set(true);
  }

  startEdit(item: EducationalProject): void {
    this.editingId.set(item.id);
    this.form.reset({
      name: item.name,
      description: item.description,
      learningGoal: item.learningGoal,
      path: item.path,
      level: item.level,
      durationDays: item.durationDays,
    });
    this.editing.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue();
    const request = this.editingId()
      ? this.api.update(this.editingId() ?? '', payload)
      : this.api.create(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.snackBar.open('Educational project saved', 'OK', { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snackBar.open(this.toMessage(error), 'OK', { duration: 4000 });
      },
    });
  }

  deactivate(id: string): void {
    this.api.deactivate(id).subscribe({
      next: () => {
        this.snackBar.open('Project deactivated', 'OK', { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => this.snackBar.open(this.toMessage(error), 'OK', { duration: 4000 }),
    });
  }

  private reload(): void {
    this.api.list().subscribe({
      next: (items) => {
        this.projects.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Unable to update educational projects.';
  }
}
