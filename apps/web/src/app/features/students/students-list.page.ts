import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { StatusChip } from '../../shared/status-chip';
import {
  LEARNING_PATHS,
  LEVEL_LABELS,
  PATH_LABELS,
  SORT_FIELD_LABELS,
  STATUS_LABELS,
  STUDENT_LEVELS,
  STUDENT_SORT_FIELDS,
  STUDENT_STATUSES,
  StudentSortField,
} from './student.labels';
import { PaginatedStudents, StudentLevel, StudentStatus, LearningPath } from './student.models';
import { StudentsApi } from './students.api';

@Component({
  selector: 'app-students-list-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    PageHeader,
    EmptyState,
    StatusChip,
  ],
  templateUrl: './students-list.page.html',
  styleUrl: './students-list.page.scss',
})
export class StudentsListPage {
  private readonly studentsApi = inject(StudentsApi);

  readonly displayedColumns = [
    'fullName',
    'schoolGrade',
    'path',
    'level',
    'status',
    'hours',
    'actions',
  ];
  readonly statuses = STUDENT_STATUSES;
  readonly levels = STUDENT_LEVELS;
  readonly paths = LEARNING_PATHS;
  readonly sortFields = STUDENT_SORT_FIELDS;
  readonly statusLabels = STATUS_LABELS;
  readonly levelLabels = LEVEL_LABELS;
  readonly pathLabels = PATH_LABELS;
  readonly sortFieldLabels = SORT_FIELD_LABELS;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<StudentStatus | ''>('', { nonNullable: true });
  readonly levelControl = new FormControl<StudentLevel | ''>('', { nonNullable: true });
  readonly pathControl = new FormControl<LearningPath | ''>('', { nonNullable: true });
  readonly sortByControl = new FormControl<StudentSortField>('createdAt', { nonNullable: true });
  readonly sortOrderControl = new FormControl<'asc' | 'desc'>('desc', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<PaginatedStudents>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    pageCount: 0,
  });

  constructor() {
    this.searchControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.load(1);
    });
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.levelControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.pathControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.sortByControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.sortOrderControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.studentsApi
      .list({
        search: this.searchControl.value,
        status: this.statusControl.value,
        level: this.levelControl.value,
        path: this.pathControl.value,
        page,
        pageSize: this.result().pageSize,
        sortBy: this.sortByControl.value,
        sortOrder: this.sortOrderControl.value,
      })
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(this.toErrorMessage(error));
        },
      });
  }

  onPage(event: PageEvent): void {
    this.result.update((current) => ({
      ...current,
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    }));
    this.load(event.pageIndex + 1);
  }

  pathLabel(path: string): string {
    return PATH_LABELS[path as LearningPath];
  }

  levelLabel(level: string): string {
    return LEVEL_LABELS[level as StudentLevel];
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return 'Unable to load students.';
    }
    return 'Unable to load students.';
  }
}
