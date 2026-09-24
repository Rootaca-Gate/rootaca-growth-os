import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, startWith } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { FilterBar } from '../../shared/filter-bar';
import { FilterChip } from '../../shared/filter-chip';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { SearchInput } from '../../shared/search-input';
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

type FilterChipKey = 'status' | 'level' | 'path';

@Component({
  selector: 'app-students-list-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    StatusChip,
    StudentAvatar,
    SearchInput,
    FilterBar,
    FilterChip,
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

  private readonly searchValue = toSignal(
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
    { initialValue: this.searchControl.value },
  );
  private readonly statusValue = toSignal(
    this.statusControl.valueChanges.pipe(startWith(this.statusControl.value)),
    { initialValue: this.statusControl.value },
  );
  private readonly levelValue = toSignal(
    this.levelControl.valueChanges.pipe(startWith(this.levelControl.value)),
    { initialValue: this.levelControl.value },
  );
  private readonly pathValue = toSignal(
    this.pathControl.valueChanges.pipe(startWith(this.pathControl.value)),
    { initialValue: this.pathControl.value },
  );

  readonly activeFilterChips = computed(() => {
    this.i18n.locale();
    const chips: { key: FilterChipKey; label: string }[] = [];
    const status = this.statusValue();
    const level = this.levelValue();
    const path = this.pathValue();
    if (status) {
      chips.push({ key: 'status', label: this.i18n.statusLabel(status) });
    }
    if (level) {
      chips.push({ key: 'level', label: this.i18n.levelLabel(level) });
    }
    if (path) {
      chips.push({ key: 'path', label: this.i18n.pathLabel(path) });
    }
    return chips;
  });

  readonly hasActiveQuery = computed(
    () =>
      Boolean(this.searchValue()?.trim()) ||
      Boolean(this.statusValue()) ||
      Boolean(this.levelValue()) ||
      Boolean(this.pathValue()),
  );

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

  clearFilter(key: FilterChipKey): void {
    if (key === 'status') {
      this.statusControl.setValue('');
    } else if (key === 'level') {
      this.levelControl.setValue('');
    } else {
      this.pathControl.setValue('');
    }
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('');
    this.levelControl.setValue('');
    this.pathControl.setValue('');
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
