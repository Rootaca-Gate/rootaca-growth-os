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
  DELIVERY_FORMATS,
  OFFERING_STATUSES,
  PROGRAM_LEVELS,
  offeringEnumLabel,
  programEnumLabel,
} from '../partnership.labels';
import {
  Paginated,
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
  ProgramListItem,
} from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { OfferingListItem, PartnershipOfferingStatus } from './offering.models';
import { buildOfferingPdfHtml, openOfferingPdfWindow } from './offering-pdf';
import { buildOfferingPdfLabels } from './offering-pdf-labels';

@Component({
  selector: 'app-offerings-list-page',
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
  templateUrl: './offerings-list.page.html',
  styleUrl: './offerings-list.page.scss',
})
export class OfferingsListPage {
  private readonly api = inject(PartnershipsApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly deliveryFormats = DELIVERY_FORMATS;
  readonly offeringStatuses = OFFERING_STATUSES;
  readonly programLevels = PROGRAM_LEVELS;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly programControl = new FormControl('', { nonNullable: true });
  readonly formatControl = new FormControl<PartnershipDeliveryFormat | ''>('', { nonNullable: true });
  readonly levelControl = new FormControl<PartnershipProgramLevel | ''>('', { nonNullable: true });
  readonly gradesControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<PartnershipOfferingStatus | ''>('', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly programs = signal<ProgramListItem[]>([]);
  readonly result = signal<Paginated<OfferingListItem>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });

  constructor() {
    this.loadPrograms();
    this.searchControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.load(1);
    });
    this.gradesControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.load(1);
    });
    this.programControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.formatControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.levelControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  enumLabel = (category: Parameters<typeof programEnumLabel>[1], value: string | null | undefined) =>
    programEnumLabel((key) => this.i18n.t(key), category, value);

  offeringLabel = (
    category: Parameters<typeof offeringEnumLabel>[1],
    value: string | null | undefined,
  ) => offeringEnumLabel((key) => this.i18n.t(key), category, value);

  private loadPrograms(): void {
    this.api.listPrograms({ pageSize: 100 }).subscribe({
      next: (result) => this.programs.set(result.items),
      error: () => this.programs.set([]),
    });
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listOfferings({
        search: this.searchControl.value,
        programId: this.programControl.value || undefined,
        deliveryFormat: this.formatControl.value,
        recommendedLevel: this.levelControl.value,
        targetGrades: this.gradesControl.value.trim() || undefined,
        status: this.statusControl.value,
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
          this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
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
    this.programControl.setValue('');
    this.formatControl.setValue('');
    this.levelControl.setValue('');
    this.gradesControl.setValue('');
    this.statusControl.setValue('');
  }

  statusClass(status: PartnershipOfferingStatus): string {
    return `status-badge status-${status.toLowerCase()}`;
  }

  gradesText(row: OfferingListItem): string {
    return row.targetGrades?.trim() || this.i18n.t('partnerships.notConfiguredShort');
  }

  levelText(row: OfferingListItem): string {
    if (!row.recommendedLevel) {
      return this.i18n.t('partnerships.notConfiguredShort');
    }
    return this.enumLabel('level', row.recommendedLevel);
  }

  durationText(row: OfferingListItem): string {
    if (row.duration == null) {
      return this.i18n.t('partnerships.notConfiguredShort');
    }
    const unit = row.durationUnit
      ? ` ${this.offeringLabel('durationUnit', row.durationUnit)}`
      : '';
    return `${row.duration}${unit}`;
  }

  sessionsText(row: OfferingListItem): string {
    if (row.numberOfSessions == null) {
      return this.i18n.t('partnerships.notConfiguredShort');
    }
    return this.i18n.t('partnerships.sessionsShort', { count: row.numberOfSessions });
  }

  archive(row: OfferingListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (row.status === 'ARCHIVED') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.offeringsArchiveConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.archiveOffering(row.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.offeringsArchived'), this.i18n.t('common.ok'), {
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

  duplicate(row: OfferingListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.offeringsDuplicateConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.duplicateOffering(row.id).subscribe({
      next: (copy) => {
        this.busyId.set(null);
        this.snackBar.open(
          this.i18n.t('partnerships.offeringsDuplicated'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        void this.router.navigate(['/partnerships/offerings', copy.id, 'edit']);
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

  generatePdf(row: OfferingListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.busyId.set(row.id);
    this.api.getOffering(row.id).subscribe({
      next: async (offering) => {
        try {
          const html = await buildOfferingPdfHtml(offering, buildOfferingPdfLabels(this.i18n), {
            dir: this.i18n.direction(),
            deliveryFormatLabel: this.enumLabel('deliveryFormat', offering.deliveryFormat),
            deliveryModeLabel: this.offeringLabel('deliveryMode', offering.deliveryMode),
            durationUnitLabel: offering.durationUnit
              ? this.offeringLabel('durationUnit', offering.durationUnit)
              : '',
            levelLabel: this.enumLabel('level', offering.resolved?.recommendedLevel),
          });
          const win = openOfferingPdfWindow(html);
          this.busyId.set(null);
          if (!win) {
            this.snackBar.open(
              this.i18n.t('partnerships.pdfPopupBlocked'),
              this.i18n.t('common.ok'),
              { duration: 4000 },
            );
          }
        } catch {
          this.busyId.set(null);
          this.snackBar.open(
            this.i18n.t('partnerships.pdfDownloadFailed'),
            this.i18n.t('common.ok'),
            { duration: 4000 },
          );
        }
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.offeringsLoadError')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }
}
