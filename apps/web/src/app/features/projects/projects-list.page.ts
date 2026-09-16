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
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { PageHeader } from '../../shared/page-header';
import { httpErrorMessage } from '../../shared/http-error';
import { PROJECT_LEVELS, PROJECT_PATHS } from './project.labels';
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
    ErrorState,
    TPipe,
  ],
  template: `
    <app-page-header
      [title]="'projects.title' | t"
      [subtitle]="'projects.subtitle' | t"
    >
      @if (canEdit() && !editing()) {
        <button mat-flat-button color="primary" type="button" (click)="startCreate()">{{ 'projects.create' | t }}</button>
      }
    </app-page-header>

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (error(); as message) {
      <app-error-state [title]="'projects.loadError' | t" [message]="message" (retry)="reload()" />
    } @else if (projects().length === 0 && !editing()) {
      <app-empty-state [title]="'projects.empty' | t" [message]="'projects.emptyHint' | t" />
    } @else {
      <div class="grid">
        @for (item of projects(); track item.id) {
          <article [attr.data-active]="item.active">
            <p class="kicker">{{ i18n.pathLabel(item.path) }} · {{ i18n.levelLabel(item.level) }} · {{ 'projects.classroom' | t }}</p>
            <h2>{{ item.name }}</h2>
            <p>{{ item.description }}</p>
            <p class="meta">
              {{ 'projects.durationAssigned' | t:{ days: item.durationDays, count: item.assignmentCount } }}
              @if (!item.active) {
                · {{ 'common.inactive' | t }}
              }
            </p>
            <div class="actions">
              <a mat-stroked-button [routerLink]="['/projects', item.id]">{{ 'common.open' | t }}</a>
              @if (canEdit()) {
                <button mat-button type="button" (click)="startEdit(item)">{{ 'common.edit' | t }}</button>
                @if (item.active) {
                  <button mat-button type="button" (click)="deactivate(item.id)">{{ 'common.deactivate' | t }}</button>
                }
              }
            </div>
          </article>
        }
      </div>
    }

    @if (canEdit() && editing()) {
      <form [formGroup]="form" (ngSubmit)="save()">
        <h2>{{ editingId() ? ('projects.edit' | t) : ('projects.add' | t) }}</h2>
        <p class="hint">{{ 'projects.hint' | t }}</p>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'projects.name' | t }}</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'projects.description' | t }}</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'projects.learningGoal' | t }}</mat-label>
          <textarea matInput rows="2" formControlName="learningGoal"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'common.path' | t }}</mat-label>
          <mat-select formControlName="path">
            @for (path of paths; track path) {
              <mat-option [value]="path">{{ i18n.pathLabel(path) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'common.level' | t }}</mat-label>
          <mat-select formControlName="level">
            @for (level of levels; track level) {
              <mat-option [value]="level">{{ i18n.levelLabel(level) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'projects.durationDays' | t }}</mat-label>
          <input matInput type="number" formControlName="durationDays" />
        </mat-form-field>
        <div class="actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            {{ 'projects.save' | t }}
          </button>
          <button mat-button type="button" (click)="editing.set(false)">{{ 'common.cancel' | t }}</button>
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
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
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
    return this.i18n.pathLabel(path);
  }

  levelLabel(level: LevelCode): string {
    return this.i18n.levelLabel(level);
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
        this.snackBar.open(this.i18n.t('projects.saved'), this.i18n.t('common.ok'), { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snackBar.open(this.toMessage(error), this.i18n.t('common.ok'), { duration: 4000 });
      },
    });
  }

  deactivate(id: string): void {
    this.api.deactivate(id).subscribe({
      next: () => {
        this.snackBar.open(this.i18n.t('projects.deactivated'), this.i18n.t('common.ok'), { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => this.snackBar.open(this.toMessage(error), this.i18n.t('common.ok'), { duration: 4000 }),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (items) => {
        this.projects.set(items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return this.i18n.t('projects.updateFailed');
  }
}
