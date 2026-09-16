import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { StatusChip } from '../../shared/status-chip';
import { StudentAvatar } from '../../shared/student-avatar';
import { httpErrorMessage } from '../../shared/http-error';
import { DashboardApi } from '../dashboard/dashboard.api';
import { DashboardAttentionItem } from '../dashboard/dashboard.models';
import {
  LEARNING_PATHS,
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
    MatPaginatorModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    StatusChip,
    StudentAvatar,
    TPipe,
  ],
  templateUrl: './students-list.page.html',
  styleUrl: './students-list.page.scss',
})
export class StudentsListPage {
  private readonly studentsApi = inject(StudentsApi);
  private readonly dashboardApi = inject(DashboardApi);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(DirectionService);

  readonly statuses = STUDENT_STATUSES;
  readonly levels = STUDENT_LEVELS;
  readonly paths = LEARNING_PATHS;
  readonly sortFields = STUDENT_SORT_FIELDS;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<StudentStatus | ''>('', { nonNullable: true });
  readonly levelControl = new FormControl<StudentLevel | ''>('', { nonNullable: true });
  readonly pathControl = new FormControl<LearningPath | ''>('', { nonNullable: true });
  readonly sortByControl = new FormControl<StudentSortField>('createdAt', { nonNullable: true });
  readonly sortOrderControl = new FormControl<'asc' | 'desc'>('desc', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly inactiveOnly = signal(false);
  readonly inactiveStudents = signal<DashboardAttentionItem[]>([]);
  readonly result = signal<PaginatedStudents>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    pageCount: 0,
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.inactiveOnly.set(params.get('activity') === 'inactive');
      if (this.inactiveOnly()) {
        this.loadInactive();
      } else {
        this.load(1);
      }
    });
    this.searchControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.load(1);
    });
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.levelControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.pathControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.sortByControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.sortOrderControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
  }

  load(page = this.result().page): void {
    if (this.inactiveOnly()) {
      this.loadInactive();
      return;
    }
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
          this.errorMessage.set(
            httpErrorMessage(error, this.i18n.t('errors.connection')),
          );
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
    return this.i18n.pathLabel(path);
  }

  levelLabel(level: string): string {
    return this.i18n.levelLabel(level);
  }

  private loadInactive(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.dashboardApi.getDashboard().subscribe({
      next: (dashboard) => {
        this.inactiveStudents.set(dashboard.attention.noRecentActivity);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          httpErrorMessage(error, this.i18n.t('errors.connection')),
        );
      },
    });
  }
}
