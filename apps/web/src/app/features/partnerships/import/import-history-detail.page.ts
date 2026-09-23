import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import { ImportPreviewResponse } from '../partnership.models';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';

@Component({
  selector: 'app-import-history-detail-page',
  imports: [RouterLink, MatButtonModule, PageHeader, ErrorState, LoadingSkeleton, TPipe],
  template: `
    <app-page-header
      [title]="'partnerships.importHistoryTitle' | t"
      [subtitle]="detail()?.job.fileName || ''"
    >
      <a mat-stroked-button routerLink="/partnerships/import/history">{{ 'common.back' | t }}</a>
    </app-page-header>

    @if (loading()) {
      <app-loading-skeleton [rows]="8" [label]="'partnerships.importLoading' | t" />
    } @else if (errorMessage(); as message) {
      <app-error-state
        [title]="'partnerships.importErrorTitle' | t"
        [message]="message"
        (retry)="load()"
      />
    } @else if (detail(); as data) {
      <section class="ra-card">
        <p>{{ 'common.status' | t }}: {{ data.job.status }}</p>
        <p>{{ 'partnerships.importUploadedBy' | t }}: {{ data.job.uploadedByName || '—' }}</p>
        <p>
          {{ 'partnerships.importImported' | t }}: {{ data.job.result?.imported ?? 0 }} ·
          {{ 'partnerships.importMerged' | t }}: {{ data.job.result?.merged ?? 0 }} ·
          {{ 'partnerships.importSkipped' | t }}: {{ data.job.result?.skipped ?? 0 }} ·
          {{ 'partnerships.importFailed' | t }}: {{ data.job.result?.failed ?? 0 }}
        </p>
      </section>
      <div class="ra-table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{{ 'partnerships.institution' | t }}</th>
              <th>{{ 'partnerships.importDecision' | t }}</th>
              <th>{{ 'partnerships.importResultTitle' | t }}</th>
              <th>{{ 'partnerships.importErrors' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of data.rows; track row.rowNumber) {
              <tr>
                <td>{{ row.rowNumber }}</td>
                <td>{{ row.name || '—' }}</td>
                <td>{{ row.decision }}</td>
                <td>{{ row.resultStatus }}</td>
                <td>{{ row.resultError || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class ImportHistoryDetailPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly detail = signal<ImportPreviewResponse | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Missing import id');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.api.getImportHistory(id).subscribe({
      next: (result) => {
        this.detail.set(result);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }
}
