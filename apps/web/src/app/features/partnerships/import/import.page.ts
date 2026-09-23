import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { EmptyState } from '../../../shared/empty-state';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import {
  ImportJob,
  ImportPreviewResponse,
  ImportPreviewRow,
  ImportRowDecision,
  ImportRowFilter,
} from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

@Component({
  selector: 'app-import-page',
  imports: [
    FormsModule,
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
    TPipe,
  ],
  templateUrl: './import.page.html',
  styleUrl: './import.page.scss',
})
export class ImportPage {
  private readonly api = inject(PartnershipsApi);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();

  readonly step = signal<1 | 2 | 3 | 4 | 5>(1);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly preview = signal<ImportPreviewResponse | null>(null);
  readonly mapping = signal<Record<string, string | null>>({});
  readonly rowFilter = signal<ImportRowFilter>('all');
  readonly resultJob = signal<ImportJob | null>(null);

  readonly summary = computed(() => this.preview()?.job.summary ?? null);
  readonly rows = computed(() => this.preview()?.rows ?? []);
  readonly crmFields = computed(() => this.preview()?.crmFields ?? []);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage.set(null);
    if (!file) {
      this.selectedFile.set(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.errorMessage.set(this.i18n.t('partnerships.importInvalidType'));
      this.selectedFile.set(null);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.errorMessage.set(this.i18n.t('partnerships.importFileTooLarge'));
      this.selectedFile.set(null);
      return;
    }
    this.selectedFile.set(file);
  }

  uploadAndPreview(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.previewImport(file).subscribe({
      next: (result) => {
        this.preview.set(result);
        this.mapping.set({ ...result.suggestedMapping });
        this.loading.set(false);
        this.step.set(2);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  applyMapping(): void {
    const jobId = this.preview()?.job.id;
    if (!jobId) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.remapImport(jobId, this.mapping()).subscribe({
      next: (result) => {
        this.preview.set(result);
        this.mapping.set({ ...result.job.mapping });
        this.loading.set(false);
        this.step.set(3);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  setMapping(header: string, field: string | null): void {
    this.mapping.update((current) => ({ ...current, [header]: field || null }));
  }

  setRowDecision(row: ImportPreviewRow, decision: ImportRowDecision): void {
    const jobId = this.preview()?.job.id;
    if (!jobId) {
      return;
    }
    this.api
      .updateImportDecisions(jobId, {
        decisions: [{ rowNumber: row.rowNumber, decision }],
      })
      .subscribe({
        next: () => this.reloadRows(),
        error: (error: unknown) => {
          this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
        },
      });
  }

  bulkSkipExact(): void {
    const jobId = this.preview()?.job.id;
    if (!jobId) {
      return;
    }
    this.api.updateImportDecisions(jobId, { bulk: 'SKIP_ALL_EXACT' }).subscribe({
      next: () => this.reloadRows(),
      error: (error: unknown) => {
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  bulkImportNew(): void {
    const jobId = this.preview()?.job.id;
    if (!jobId) {
      return;
    }
    this.api.updateImportDecisions(jobId, { bulk: 'IMPORT_ALL_NEW' }).subscribe({
      next: () => this.reloadRows(),
      error: (error: unknown) => {
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  changeFilter(filter: ImportRowFilter): void {
    this.rowFilter.set(filter);
    this.reloadRows(1);
  }

  onPage(event: PageEvent): void {
    this.reloadRows(event.pageIndex + 1, event.pageSize);
  }

  reloadRows(page = this.preview()?.page ?? 1, pageSize = this.preview()?.pageSize ?? 50): void {
    const jobId = this.preview()?.job.id;
    if (!jobId) {
      return;
    }
    this.loading.set(true);
    this.api.getImportJob(jobId, { filter: this.rowFilter(), page, pageSize }).subscribe({
      next: (result) => {
        this.preview.set(result);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  goReview(): void {
    this.step.set(4);
  }

  execute(): void {
    const jobId = this.preview()?.job.id;
    if (!jobId) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.executeImport(jobId).subscribe({
      next: (job) => {
        this.resultJob.set(job);
        this.loading.set(false);
        this.step.set(5);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  displayText(value: string | null | undefined): string {
    return value?.trim() ? value : '—';
  }

  formatErrors(row: ImportPreviewRow): string {
    if (!row.validationErrors.length) {
      return '—';
    }
    return row.validationErrors.map((error) => `${error.field}: ${error.reason}`).join('; ');
  }

  decisionOptions(row: ImportPreviewRow): ImportRowDecision[] {
    if (!row.isValid) {
      return ['SKIP'];
    }
    if (row.matchConfidence === 'NONE' && row.csvDuplicateOfRow == null) {
      return ['IMPORT', 'SKIP'];
    }
    return ['SKIP', 'MERGE', 'IMPORT_ANYWAY'];
  }
}
