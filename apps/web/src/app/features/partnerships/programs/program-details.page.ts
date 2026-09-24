import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { EmptyState } from '../../../shared/empty-state';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { programEnumLabel } from '../partnership.labels';
import { PartnershipProgram, ProgramRequirement } from '../partnership.models';
import { OfferingListItem } from '../offerings/offering.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { programFieldDisplay, skillTags } from './program-display';
import { buildProgramPdfHtml, openProgramPdfWindow } from './program-pdf';
import { buildProgramPdfLabels } from './program-pdf-labels';
import {
  PartnershipBreadcrumb,
  PartnershipBreadcrumbs,
  partnershipJourneyCrumbs,
} from '../shared/partnership-breadcrumbs';

@Component({
  selector: 'app-program-details-page',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    PartnershipBreadcrumbs,
    TPipe,
  ],
  templateUrl: './program-details.page.html',
  styleUrl: './program-details.page.scss',
})
export class ProgramDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly archiving = signal(false);
  readonly program = signal<PartnershipProgram | null>(null);
  readonly offerings = signal<OfferingListItem[]>([]);

  readonly breadcrumbs = computed<PartnershipBreadcrumb[]>(() => {
    const current = this.program();
    if (!current) {
      return [];
    }
    return partnershipJourneyCrumbs(
      (key) => this.i18n.t(key),
      'catalog',
      'nav.programs',
      '/partnerships/programs',
      current.name || this.i18n.t('partnerships.breadcrumbProgram'),
    );
  });

  constructor() {
    this.reload();
  }

  enumLabel = (category: Parameters<typeof programEnumLabel>[1], value: string | null | undefined) =>
    programEnumLabel((key) => this.i18n.t(key), category, value);

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.getProgram(id).subscribe({
      next: (program) => {
        this.program.set(program);
        this.loading.set(false);
        this.loadOfferings(program.id);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(err, this.i18n.t('partnerships.programsLoadError')));
      },
    });
  }

  private loadOfferings(programId: string): void {
    this.offerings.set([]);
    this.api.listOfferings({ programId, pageSize: 50 }).subscribe({
      next: (page) => this.offerings.set(page.items),
      error: () => this.offerings.set([]),
    });
  }

  requirementsOf(kind: ProgramRequirement['kind']): ProgramRequirement[] {
    return (this.program()?.requirements ?? []).filter((item) => item.kind === kind);
  }

  displayText(value: string | null | undefined): string {
    return programFieldDisplay(value, this.i18n.t('partnerships.notConfigured'));
  }

  tags(value: string | null | undefined): string[] {
    return skillTags(value);
  }

  statusClass(status: string): string {
    return `status-badge status-${status.toLowerCase()}`;
  }

  archive(): void {
    const current = this.program();
    if (!current || current.status === 'ARCHIVED') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.programsArchiveConfirm'))) {
      return;
    }
    this.archiving.set(true);
    this.api.archiveProgram(current.id).subscribe({
      next: (updated) => {
        this.archiving.set(false);
        this.program.set(updated);
        this.snackBar.open(this.i18n.t('partnerships.programsArchived'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
      },
      error: (err: unknown) => {
        this.archiving.set(false);
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  duplicate(): void {
    const current = this.program();
    if (!current) {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.programsDuplicateConfirm'))) {
      return;
    }
    this.api.duplicateProgram(current.id).subscribe({
      next: (copy) => {
        this.snackBar.open(this.i18n.t('partnerships.programsDuplicated'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/programs', copy.id, 'edit']);
      },
      error: (err: unknown) => {
        this.snackBar.open(
          partnershipErrorMessage(err, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  async generatePdf(): Promise<void> {
    const current = this.program();
    if (!current) {
      return;
    }
    try {
      const html = await buildProgramPdfHtml(current, buildProgramPdfLabels(this.i18n), {
        dir: this.i18n.direction(),
        typeLabel: this.enumLabel('programType', current.programType),
        levelLabel: this.enumLabel('level', current.recommendedLevel),
        deliveryLabels: current.deliveryFormats.map((f) => this.enumLabel('deliveryFormat', f)),
      });
      const win = openProgramPdfWindow(html);
      if (!win) {
        this.snackBar.open(this.i18n.t('partnerships.pdfPopupBlocked'), this.i18n.t('common.ok'), {
          duration: 4000,
        });
      }
    } catch (err: unknown) {
      console.error('PDF preview failed', err);
      this.snackBar.open(this.i18n.t('partnerships.pdfDownloadFailed'), this.i18n.t('common.ok'), {
        duration: 4000,
      });
    }
  }

  back(): void {
    void this.router.navigateByUrl('/partnerships/programs');
  }
}
