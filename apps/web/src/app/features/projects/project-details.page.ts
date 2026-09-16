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
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { StudentsApi } from '../students/students.api';
import { Student } from '../students/student.models';
import { LEVEL_LABELS, PATH_LABELS, STUDENT_PROJECT_STATUS_LABELS } from './project.labels';
import { ProjectApi } from './project.api';
import { LevelCode, PathCode, ProjectDetails, StudentProjectStatus } from './project.models';

@Component({
  selector: 'app-project-details-page',
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
  ],
  template: `
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (error(); as message) {
      <app-page-header title="Educational project" subtitle="Classroom learning work">
        <a mat-button routerLink="/projects">Back to catalog</a>
      </app-page-header>
      <app-empty-state title="Project not found" [message]="message" />
    } @else if (project(); as current) {
      <app-page-header [title]="current.name" subtitle="Classroom project · not a client case study">
        <a mat-button routerLink="/projects">Back to catalog</a>
      </app-page-header>

      <section class="hero">
        <p class="kicker">{{ pathLabel(current.path) }} · {{ levelLabel(current.level) }} · educational</p>
        <p>{{ current.description }}</p>
        <p><strong>Learning goal.</strong> {{ current.learningGoal }}</p>
        <p class="meta">{{ current.durationDays }} days · {{ current.assignmentCount }} students assigned</p>
      </section>

      @if (canAssign()) {
        <form [formGroup]="assignForm" (ngSubmit)="assign()">
          <h2>Assign to a student</h2>
          <mat-form-field appearance="outline">
            <mat-label>Student</mat-label>
            <mat-select formControlName="studentId">
              @for (student of students(); track student.id) {
                <mat-option [value]="student.id">{{ student.fullName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Due date</mat-label>
            <input matInput type="date" formControlName="dueDate" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Notes</mat-label>
            <textarea matInput rows="2" formControlName="notes"></textarea>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="assignForm.invalid || saving()">
            Assign project
          </button>
        </form>
      }

      <h2>Student progress</h2>
      @if (current.assignments.length === 0) {
        <app-empty-state title="No assignments yet" message="Mentors can assign this classroom project to a student." />
      } @else {
        <ul class="assignments">
          @for (item of current.assignments; track item.id) {
            <li>
              <div>
                <strong>{{ item.studentName }}</strong>
                <span>{{ statusLabel(item.status) }} · {{ item.progressPercent }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="item.progressPercent" />
              <a mat-button [routerLink]="['/students', item.studentId, 'projects']">Open progress</a>
            </li>
          }
        </ul>
      }
    }
  `,
  styles: `
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .hero,
    form,
    .assignments li {
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-low);
      display: grid;
      gap: 10px;
      margin-bottom: 16px;
    }

    h2,
    p {
      margin: 0 0 12px;
    }

    .kicker {
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
    }

    .kicker,
    .meta,
    span,
    p {
      color: var(--mat-sys-on-surface-variant);
    }

    .assignments {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 12px;
    }
  `,
})
export class ProjectDetailsPage {
  private readonly api = inject(ProjectApi);
  private readonly studentsApi = inject(StudentsApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  private readonly projectId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly project = signal<ProjectDetails | null>(null);
  readonly students = signal<Student[]>([]);
  readonly canAssign = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'ADMIN' || role === 'MENTOR';
  });

  readonly assignForm = new FormGroup({
    studentId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dueDate: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.reload();
    this.studentsApi.list({ pageSize: 100, sortBy: 'fullName', sortOrder: 'asc' }).subscribe({
      next: (page) => this.students.set(page.items),
    });
  }

  pathLabel(path: PathCode): string {
    return PATH_LABELS[path];
  }

  levelLabel(level: LevelCode): string {
    return LEVEL_LABELS[level];
  }

  statusLabel(status: StudentProjectStatus): string {
    return STUDENT_PROJECT_STATUS_LABELS[status];
  }

  assign(): void {
    if (this.assignForm.invalid) {
      return;
    }
    this.saving.set(true);
    const value = this.assignForm.getRawValue();
    this.api
      .assign(this.projectId, {
        studentId: value.studentId,
        dueDate: value.dueDate || undefined,
        notes: value.notes,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.assignForm.reset({ studentId: '', dueDate: '', notes: '' });
          this.snackBar.open('Educational project assigned', 'OK', { duration: 2000 });
          this.reload();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.snackBar.open(this.toMessage(error), 'OK', { duration: 4000 });
        },
      });
  }

  private reload(): void {
    this.api.get(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.error.set(null);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.project.set(null);
        this.error.set(this.toMessage(error));
        this.loading.set(false);
      },
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Unable to load this educational project.';
  }
}
