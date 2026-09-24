import { DatePipe } from '@angular/common';
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
import { PROPOSAL_STATUSES, proposalEnumLabel } from '../partnership.labels';
import { Institution, Paginated } from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';
import { buildProposalPdfOptions } from './proposal-display';
import { formatMoney } from './proposal-pricing';
import {
  PartnershipProposalStatus,
  ProposalListItem,
} from './proposal.models';
import { buildProposalPdfHtml, openProposalPdfWindow } from './proposal-pdf';
import { buildProposalPdfLabels } from './proposal-pdf-labels';

@Component({
  selector: 'app-proposals-list-page',
  imports: [
    DatePipe,
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
  templateUrl: './proposals-list.page.html',
  styleUrl: './proposals-list.page.scss',
})
export class ProposalsListPage {
  private readonly api = inject(PartnershipsApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly proposalStatuses = PROPOSAL_STATUSES;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly institutionControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<PartnershipProposalStatus | ''>('', {
    nonNullable: true,
  });
  readonly createdFromControl = new FormControl('', { nonNullable: true });
  readonly createdToControl = new FormControl('', { nonNullable: true });
  readonly validUntilFromControl = new FormControl('', { nonNullable: true });
  readonly validUntilToControl = new FormControl('', { nonNullable: true });

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly institutions = signal<Institution[]>([]);
  readonly result = signal<Paginated<ProposalListItem>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });

  constructor() {
    this.loadInstitutions();
    this.searchControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.load(1);
    });
    this.institutionControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.createdFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.createdToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.validUntilFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.validUntilToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  proposalLabel = (
    category: Parameters<typeof proposalEnumLabel>[1],
    value: string | null | undefined,
  ) => proposalEnumLabel((key) => this.i18n.t(key), category, value);

  private loadInstitutions(): void {
    this.api.listInstitutions({ pageSize: 100, sortBy: 'name', sortOrder: 'asc' }).subscribe({
      next: (result) => this.institutions.set(result.items),
      error: () => this.institutions.set([]),
    });
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listProposals({
        search: this.searchControl.value,
        institutionId: this.institutionControl.value || undefined,
        status: this.statusControl.value,
        createdFrom: this.createdFromControl.value || undefined,
        createdTo: this.createdToControl.value || undefined,
        validUntilFrom: this.validUntilFromControl.value || undefined,
        validUntilTo: this.validUntilToControl.value || undefined,
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
    this.institutionControl.setValue('');
    this.statusControl.setValue('');
    this.createdFromControl.setValue('');
    this.createdToControl.setValue('');
    this.validUntilFromControl.setValue('');
    this.validUntilToControl.setValue('');
  }

  statusClass(status: PartnershipProposalStatus): string {
    return `status-badge status-${status.toLowerCase().replace(/_/g, '-')}`;
  }

  offeringsText(row: ProposalListItem): string {
    const names = row.offeringNames;
    if (names?.length) {
      return names.join(', ');
    }
    if (row.offeringCount != null) {
      return String(row.offeringCount);
    }
    return this.i18n.t('partnerships.noValue');
  }

  totalText(row: ProposalListItem): string {
    return formatMoney(row.grandTotal, row.currency, this.i18n.t('partnerships.noValue'));
  }

  canEdit(row: ProposalListItem): boolean {
    return !row.isLocked && row.status === 'DRAFT';
  }

  archive(row: ProposalListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (row.status === 'ARCHIVED') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.proposalsArchiveConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.archiveProposal(row.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.proposalsArchived'), this.i18n.t('common.ok'), {
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

  duplicate(row: ProposalListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(this.i18n.t('partnerships.proposalsDuplicateConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.duplicateProposal(row.id).subscribe({
      next: (copy) => {
        this.busyId.set(null);
        this.snackBar.open(
          this.i18n.t('partnerships.proposalsDuplicated'),
          this.i18n.t('common.ok'),
          { duration: 2500 },
        );
        void this.router.navigate(['/partnerships/proposals', copy.id, 'edit']);
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

  send(row: ProposalListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (row.status !== 'DRAFT') {
      return;
    }
    if (!confirm(this.i18n.t('partnerships.proposalsSendConfirm'))) {
      return;
    }
    this.busyId.set(row.id);
    this.api.sendProposal(row.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(this.i18n.t('partnerships.proposalsSent'), this.i18n.t('common.ok'), {
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

  share(row: ProposalListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.busyId.set(row.id);
    this.api.ensureProposalShareToken(row.id).subscribe({
      next: async (result) => {
        this.busyId.set(null);
        const token = result.shareToken?.trim();
        if (!token) {
          this.snackBar.open(
            partnershipErrorMessage(null, this.i18n.t('partnerships.saveFailed')),
            this.i18n.t('common.ok'),
            { duration: 4000 },
          );
          return;
        }
        try {
          await navigator.clipboard.writeText(token);
          this.snackBar.open(
            this.i18n.t('partnerships.proposalsShareCopied'),
            this.i18n.t('common.ok'),
            { duration: 2500 },
          );
        } catch {
          this.snackBar.open(
            `${this.i18n.t('partnerships.proposalsShareReady')}: ${token}`,
            this.i18n.t('common.ok'),
            { duration: 5000 },
          );
        }
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

  generatePdf(row: ProposalListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.busyId.set(row.id);
    this.api.getProposal(row.id).subscribe({
      next: async (proposal) => {
        try {
          const html = await buildProposalPdfHtml(
            proposal,
            buildProposalPdfLabels(this.i18n),
            buildProposalPdfOptions(this.i18n),
          );
          const win = openProposalPdfWindow(html);
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
          partnershipErrorMessage(error, this.i18n.t('partnerships.proposalsLoadError')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }
}
