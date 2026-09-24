import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { EmptyState } from '../../../shared/empty-state';
import { ErrorState } from '../../../shared/error-state';
import { FilterBar } from '../../../shared/filter-bar';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import { SearchInput } from '../../../shared/search-input';
import {
  PROGRAM_LEVELS,
  PROGRAM_STATUSES,
  PROGRAM_TYPES,
  programEnumLabel,
} from '../partnership.labels';
import {
  Paginated,
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
  PartnershipProgramStatus,
  PartnershipProgramType,
  ProgramListItem,
} from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { programFieldDisplay } from './program-display';
import { buildProgramPdfHtml, openProgramPdfWindow } from './program-pdf';
import { buildProgramPdfLabels } from './program-pdf-labels';

@Component({
  selector: 'app-programs-list-page',
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
    FilterBar,
    SearchInput,
    TPipe,
  ],
  templateUrl: './programs-list.page.html',
  styleUrl: './programs-list.page.scss',
})
export class ProgramsListPage {
  private readonly api = inject(PartnershipsApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly programTypes = PROGRAM_TYPES;
  readonly programLevels = PROGRAM_LEVELS;
  readonly programStatuses = PROGRAM_STATUSES;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly typeControl = new FormControl<PartnershipProgramType | ''>('', { nonNullable: true });
  readonly levelControl = new FormControl<PartnershipProgramLevel | ''>('', { nonNullable: true });
  readonly statusControl = new FormControl<PartnershipProgramStatus | ''>('', { nonNullable: true });
  readonly gradeControl = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly result = signal<Paginated<ProgramListItem>>({
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
    this.gradeControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.load(1);
    });
    this.typeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.levelControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  enumLabel = (category: Parameters<typeof programEnumLabel>[1], value: string | null | undefined) =>
    programEnumLabel((key) => this.i18n.t(key), category, value);

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listPrograms({
        search: this.searchControl.value,
        programType: this.typeControl.value,
        recommendedLevel: this.levelControl.value,
        status: this.statusControl.value,
        targetGrade: this.gradeControl.value,
        page,
        pageSize: this.result().pageSize,
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
    this.typeControl.setValue('');
    this.levelControl.setValue('');
    this.statusControl.setValue('');
    this.gradeControl.setValue('');
  }

  formatDelivery(formats: PartnershipDeliveryFormat[]): string {
    if (!formats.length) {
      return this.i18n.t('partnerships.notConfigured');
    }
    return formats.map((f) => this.enumLabel('deliveryFormat', f)).join(', ');
  }

  displayText(value: string | null | undefined): string {
    return programFieldDisplay(value, this.i18n.t('partnerships.notConfigured'));
  }

  statusClass(status: PartnershipProgramStatus): string {
    return `status-badge status-${status.toLowerCase()}`;
  }

  archive(row: ProgramListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (row.status === 'ARCHIVED') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.programsArchiveConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.archiveProgram(row.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.programsArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        this.load();
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  duplicate(row: ProgramListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.programsDuplicateConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.duplicateProgram(row.id).subscribe({
      next: (copy) => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.programsDuplicated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/programs', copy.id, 'edit']);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  generatePdf(row: ProgramListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.busyId.set(row.id);
    this.api.getProgram(row.id).subscribe({
      next: (program) => {
        void buildProgramPdfHtml(program, buildProgramPdfLabels(this.i18n), {
          dir: this.i18n.direction(),
          typeLabel: this.enumLabel('programType', program.programType),
          levelLabel: this.enumLabel('level', program.recommendedLevel),
          deliveryLabels: program.deliveryFormats.map((f) => this.enumLabel('deliveryFormat', f)),
        })
          .then((html) => {
            this.busyId.set(null);
            const win = openProgramPdfWindow(html);
            if (!win) {
              this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
                duration: 4000,
              });
            }
          })
          .catch((error: unknown) => {
            this.busyId.set(null);
            this.snackBar.open(
              partnershipErrorMessage(error, this.i18n.t('partnerships.pdfDownloadFailed')),
              this.i18n.t('common.ok'),
              { duration: 4000 },
            );
          });
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.programsLoadError')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }
}
