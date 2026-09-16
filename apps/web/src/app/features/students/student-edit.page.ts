import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { PageHeader } from '../../shared/page-header';
import { StudentForm } from './student-form';
import { Student, StudentWritePayload } from './student.models';
import { StudentsApi } from './students.api';

@Component({
  selector: 'app-student-edit-page',
  imports: [MatCardModule, MatProgressSpinnerModule, PageHeader, StudentForm, TPipe],
  template: `
    <app-page-header
      [title]="'students.editTitle' | t"
      [subtitle]="'students.editSubtitle' | t"
    />
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (student(); as current) {
      <mat-card appearance="outlined">
        <mat-card-content>
          <app-student-form
            [student]="current"
            [saveLabel]="'students.saveChanges' | t"
            [submitting]="submitting()"
            (saved)="save($event)"
            (cancelled)="back()"
          />
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }
  `,
})
export class StudentEditPage {
  private readonly studentsApi = inject(StudentsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly student = signal<Student | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.back();
      return;
    }

    this.studentsApi.get(id).subscribe({
      next: (student) => {
        this.student.set(student);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open(this.i18n.t('students.notFound'), this.i18n.t('common.ok'), {
          duration: 3000,
        });
        this.back();
      },
    });
  }

  save(payload: StudentWritePayload): void {
    const current = this.student();
    if (!current) {
      return;
    }

    this.submitting.set(true);
    this.studentsApi.update(current.id, payload).subscribe({
      next: (student) => {
        this.snackBar.open(this.i18n.t('students.updatedOk'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/students', student.id]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.snackBar.open(this.toErrorMessage(error), this.i18n.t('common.ok'), { duration: 4000 });
      },
    });
  }

  back(): void {
    const current = this.student();
    void this.router.navigate(current ? ['/students', current.id] : ['/students']);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return this.i18n.t('students.updateFailed');
  }
}
