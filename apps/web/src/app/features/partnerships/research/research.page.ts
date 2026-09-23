import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { EmptyState } from '../../../shared/empty-state';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import { StatCard } from '../../../shared/stat-card';
import {
  INSTITUTION_TYPES,
  CURRICULA,
  INSTITUTION_CATEGORIES,
  enumLabel,
} from '../partnership.labels';
import {
  Paginated,
  ResearchCandidate,
  ResearchDashboard,
  ResearchJob,
} from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';

@Component({
  selector: 'app-research-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatPaginatorModule,
    PageHeader,
    StatCard,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  templateUrl: './research.page.html',
  styleUrl: './research.page.scss',
})
export class ResearchPage {
  private readonly api = inject(PartnershipsApi);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();
  readonly label = enumLabel;
  readonly types = INSTITUTION_TYPES;
  readonly curricula = CURRICULA;
  readonly categories = INSTITUTION_CATEGORIES;

  readonly loading = signal(true);
  readonly runningJobId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly dashboard = signal<ResearchDashboard | null>(null);
  readonly jobs = signal<Paginated<ResearchJob>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    pageCount: 0,
  });
  readonly candidates = signal<Paginated<ResearchCandidate>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });
  readonly showJobForm = signal(false);
  readonly showCandidateForm = signal(false);
  readonly clearing = signal(false);
  readonly enrichingContacts = signal(false);
  readonly enrichContactsMessage = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly importingSelected = signal(false);
  readonly importSelectedMessage = signal<string | null>(null);

  readonly importableOnPage = computed(() =>
    this.candidates().items.filter((row) => this.canImport(row)),
  );

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly allPageSelected = computed(() => {
    const rows = this.importableOnPage();
    if (rows.length === 0) return false;
    const selected = this.selectedIds();
    return rows.every((row) => selected.has(row.id));
  });

  readonly somePageSelected = computed(() => {
    const rows = this.importableOnPage();
    if (rows.length === 0) return false;
    const selected = this.selectedIds();
    const count = rows.filter((row) => selected.has(row.id)).length;
    return count > 0 && count < rows.length;
  });

  readonly selectedCountLabel = computed(() =>
    this.i18n
      .t('partnerships.researchSelectedCount')
      .replace('{count}', String(this.selectedCount())),
  );

  readonly jobForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    governorate: [''],
    city: [''],
    institutionType: [''],
    curriculum: [''],
    language: ['BOTH'],
    discoveryMode: ['HYBRID'],
    hasCoding: [false],
    hasRobotics: [false],
    hasStem: [false],
    hasAi: [false],
  });

  readonly candidateForm = this.fb.nonNullable.group({
    discoveredName: ['', [Validators.required, Validators.minLength(2)]],
    governorate: [''],
    city: [''],
    website: [''],
    email: [''],
    phone: [''],
    sourceUrl: [''],
    sourceName: ['Manual'],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.getResearchDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loadJobs();
        this.loadCandidates();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.runningJobId.set(null);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  loadJobs(page = this.jobs().page): void {
    this.api.listResearchJobs({ page, pageSize: this.jobs().pageSize }).subscribe({
      next: (result) => {
        this.jobs.set(result);
        this.loading.set(false);
        this.runningJobId.set(null);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.runningJobId.set(null);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  loadCandidates(page = this.candidates().page): void {
    this.api
      .listResearchCandidates({ page, pageSize: this.candidates().pageSize })
      .subscribe({
        next: (result) => {
          this.candidates.set(result);
          this.pruneSelection(result.items);
        },
        error: (error: unknown) => {
          this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
        },
      });
  }

  createJob(): void {
    if (this.jobForm.invalid) {
      return;
    }
    const value = this.jobForm.getRawValue();
    this.api
      .createResearchJob({
        name: value.name,
        governorate: value.governorate || undefined,
        city: value.city || undefined,
        institutionType: (value.institutionType || undefined) as never,
        curriculum: (value.curriculum || undefined) as never,
        language: value.language as never,
        discoveryMode: (value.discoveryMode || 'HYBRID') as never,
        technology: {
          hasCoding: value.hasCoding || undefined,
          hasRobotics: value.hasRobotics || undefined,
          hasStem: value.hasStem || undefined,
          hasAi: value.hasAi || undefined,
        },
      })
      .subscribe({
        next: () => {
          this.showJobForm.set(false);
          this.jobForm.reset({
            language: 'BOTH',
            discoveryMode: 'HYBRID',
            hasCoding: false,
            hasRobotics: false,
            hasStem: false,
            hasAi: false,
          });
          this.reload();
        },
        error: (error: unknown) => {
          this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
        },
      });
  }

  runJob(id: string): void {
    if (this.runningJobId()) {
      return;
    }
    this.runningJobId.set(id);
    this.errorMessage.set(null);
    this.api.runResearchJob(id).subscribe({
      next: () => {
        this.reload();
      },
      error: (error: unknown) => {
        this.runningJobId.set(null);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  createCandidate(): void {
    if (this.candidateForm.invalid) {
      return;
    }
    const value = this.candidateForm.getRawValue();
    this.api
      .createResearchCandidate({
        discoveredName: value.discoveredName,
        governorate: value.governorate || undefined,
        city: value.city || undefined,
        website: value.website || undefined,
        email: value.email || undefined,
        phone: value.phone || undefined,
        sourceUrl: value.sourceUrl || undefined,
        sourceName: value.sourceName || undefined,
        sourceType: 'MANUAL',
      })
      .subscribe({
        next: () => {
          this.showCandidateForm.set(false);
          this.candidateForm.reset({ sourceName: 'Manual' });
          this.reload();
        },
        error: (error: unknown) => {
          this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
        },
      });
  }

  onJobsPage(event: PageEvent): void {
    this.jobs.update((current) => ({
      ...current,
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    }));
    this.loadJobs(event.pageIndex + 1);
  }

  onCandidatesPage(event: PageEvent): void {
    this.candidates.update((current) => ({
      ...current,
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    }));
    this.loadCandidates(event.pageIndex + 1);
  }

  clearOldResults(): void {
    if (this.clearing()) {
      return;
    }
    const confirmed = window.confirm(this.i18n.t('partnerships.researchClearConfirm'));
    if (!confirmed) {
      return;
    }
    this.clearing.set(true);
    this.errorMessage.set(null);
    this.api.clearResearchResults(true).subscribe({
      next: () => {
        this.clearing.set(false);
        this.reload();
      },
      error: (error: unknown) => {
        this.clearing.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  fillMissingContacts(): void {
    if (this.enrichingContacts() || this.runningJobId()) {
      return;
    }
    this.enrichingContacts.set(true);
    this.enrichContactsMessage.set(null);
    this.errorMessage.set(null);
    this.api.reEnrichResearchContacts().subscribe({
      next: (result) => {
        this.enrichingContacts.set(false);
        this.enrichContactsMessage.set(
          this.i18n
            .t('partnerships.researchEnrichContactsDone')
            .replace('{updated}', String(result.updated))
            .replace('{scanned}', String(result.scanned)),
        );
        this.reload();
      },
      error: (error: unknown) => {
        this.enrichingContacts.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  canImport(row: ResearchCandidate): boolean {
    return row.researchStatus !== 'IMPORTED' && row.researchStatus !== 'REJECTED';
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleCandidate(id: string, checked: boolean): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  toggleAllOnPage(checked: boolean): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      for (const row of this.importableOnPage()) {
        if (checked) {
          next.add(row.id);
        } else {
          next.delete(row.id);
        }
      }
      return next;
    });
  }

  async importSelected(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (!ids.length || this.importingSelected()) {
      return;
    }
    this.importingSelected.set(true);
    this.importSelectedMessage.set(null);
    this.errorMessage.set(null);

    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await firstValueFrom(this.api.importResearchCandidate(id));
        ok += 1;
      } catch {
        fail += 1;
      }
    }

    this.selectedIds.set(new Set());
    this.importingSelected.set(false);
    this.importSelectedMessage.set(
      this.i18n
        .t('partnerships.researchImportSelectedDone')
        .replace('{ok}', String(ok))
        .replace('{fail}', String(fail)),
    );
    this.reload();
  }

  private pruneSelection(items: ResearchCandidate[]): void {
    const nonImportableOnPage = new Set(
      items.filter((row) => !this.canImport(row)).map((row) => row.id),
    );
    if (nonImportableOnPage.size === 0) {
      return;
    }
    this.selectedIds.update((current) => {
      const next = new Set(current);
      for (const id of nonImportableOnPage) {
        next.delete(id);
      }
      return next;
    });
  }

  display(value: string | null | undefined): string {
    return value?.trim() ? value : '—';
  }

  websiteUrl(row: ResearchCandidate): string | null {
    const raw = (row.officialWebsite || row.website || '').trim();
    return raw || null;
  }

  evidenceLabel(row: ResearchCandidate): string {
    if (!row.evidenceSources?.length) {
      return '—';
    }
    return row.evidenceSources.map((item) => item.label).join(' · ');
  }
}
