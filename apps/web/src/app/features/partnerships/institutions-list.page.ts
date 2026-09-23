import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import {
  CURRICULA,
  EDUCATION_LEVELS,
  INSTITUTION_CATEGORIES,
  INSTITUTION_SORT_FIELDS,
  INSTITUTION_STATUSES,
  INSTITUTION_TYPES,
  LEAD_PRIORITIES,
  enumLabel,
} from './partnership.labels';
import { InstitutionStatus, LeadPriority, Paginated, Institution } from './partnership.models';
import { usePartnershipPermissions } from './partnership.permissions';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

@Component({
  selector: 'app-institutions-list-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  templateUrl: './institutions-list.page.html',
  styleUrl: './institutions-list.page.scss',
})
export class InstitutionsListPage {
  private readonly api = inject(PartnershipsApi);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();
  readonly label = enumLabel;

  readonly statuses = INSTITUTION_STATUSES;
  readonly types = INSTITUTION_TYPES;
  readonly categories = INSTITUTION_CATEGORIES;
  readonly curricula = CURRICULA;
  readonly levels = EDUCATION_LEVELS;
  readonly priorities = LEAD_PRIORITIES;
  readonly sortFields = INSTITUTION_SORT_FIELDS;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<InstitutionStatus | ''>('', { nonNullable: true });
  readonly typeControl = new FormControl('', { nonNullable: true });
  readonly categoryControl = new FormControl('', { nonNullable: true });
  readonly curriculumControl = new FormControl('', { nonNullable: true });
  readonly educationLevelControl = new FormControl('', { nonNullable: true });
  readonly governorateControl = new FormControl('', { nonNullable: true });
  readonly cityControl = new FormControl('', { nonNullable: true });
  readonly priorityControl = new FormControl<LeadPriority | ''>('', { nonNullable: true });
  readonly sortByControl = new FormControl<(typeof INSTITUTION_SORT_FIELDS)[number]>('updatedAt', {
    nonNullable: true,
  });
  readonly sortOrderControl = new FormControl<'asc' | 'desc'>('desc', { nonNullable: true });
  readonly hasCoding = new FormControl(false, { nonNullable: true });
  readonly hasRobotics = new FormControl(false, { nonNullable: true });
  readonly hasStem = new FormControl(false, { nonNullable: true });
  readonly hasAi = new FormControl(false, { nonNullable: true });
  readonly hasTechClub = new FormControl(false, { nonNullable: true });
  readonly hasAfterSchool = new FormControl(false, { nonNullable: true });
  readonly hasSummerCamp = new FormControl(false, { nonNullable: true });
  readonly hasMakerspace = new FormControl(false, { nonNullable: true });
  readonly hasEmail = new FormControl(false, { nonNullable: true });
  readonly hasPhone = new FormControl(false, { nonNullable: true });
  readonly hasWebsite = new FormControl(false, { nonNullable: true });
  readonly hasDecisionMaker = new FormControl(false, { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<Paginated<Institution>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });

  constructor() {
    this.searchControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.load(1);
    });
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.typeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.categoryControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.curriculumControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.educationLevelControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.governorateControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.load(1));
    this.cityControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.load(1));
    this.priorityControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.sortByControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.sortOrderControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasCoding.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasRobotics.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasStem.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasAi.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasTechClub.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasAfterSchool.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasSummerCamp.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasMakerspace.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasEmail.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasPhone.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasWebsite.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasDecisionMaker.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listInstitutions({
        search: this.searchControl.value,
        status: this.statusControl.value,
        institutionType: this.typeControl.value as never,
        institutionCategory: this.categoryControl.value as never,
        curriculum: this.curriculumControl.value as never,
        educationLevel: this.educationLevelControl.value as never,
        governorate: this.governorateControl.value,
        city: this.cityControl.value,
        leadPriority: this.priorityControl.value,
        hasCoding: this.hasCoding.value || undefined,
        hasRobotics: this.hasRobotics.value || undefined,
        hasStem: this.hasStem.value || undefined,
        hasAi: this.hasAi.value || undefined,
        hasTechClub: this.hasTechClub.value || undefined,
        hasAfterSchool: this.hasAfterSchool.value || undefined,
        hasSummerCamp: this.hasSummerCamp.value || undefined,
        hasMakerspace: this.hasMakerspace.value || undefined,
        hasEmail: this.hasEmail.value || undefined,
        hasPhone: this.hasPhone.value || undefined,
        hasWebsite: this.hasWebsite.value || undefined,
        hasDecisionMaker: this.hasDecisionMaker.value || undefined,
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
            partnershipErrorMessage(error, this.i18n.t('errors.connection')),
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

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('');
    this.typeControl.setValue('');
    this.categoryControl.setValue('');
    this.curriculumControl.setValue('');
    this.educationLevelControl.setValue('');
    this.governorateControl.setValue('');
    this.cityControl.setValue('');
    this.priorityControl.setValue('');
    this.hasCoding.setValue(false);
    this.hasRobotics.setValue(false);
    this.hasStem.setValue(false);
    this.hasAi.setValue(false);
    this.hasTechClub.setValue(false);
    this.hasAfterSchool.setValue(false);
    this.hasSummerCamp.setValue(false);
    this.hasMakerspace.setValue(false);
    this.hasEmail.setValue(false);
    this.hasPhone.setValue(false);
    this.hasWebsite.setValue(false);
    this.hasDecisionMaker.setValue(false);
  }

  displayText(value: string | null | undefined): string {
    return value?.trim() ? value : '—';
  }

  displayDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const datePart = value.slice(0, 10);
    return datePart || '—';
  }

  contactPhoneOf(row: Institution): string {
    const contact = row.primaryContact;
    if (!contact) {
      return '—';
    }
    return contact.phone || contact.mobile || contact.whatsapp || '—';
  }
}
