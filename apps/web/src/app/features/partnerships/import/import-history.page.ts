import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { EmptyState } from '../../../shared/empty-state';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import { ImportJob, Paginated } from '../partnership.models';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';

@Component({
  selector: 'app-import-history-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatPaginatorModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  template: `
    <app-page-header
      [title]="'partnerships.importHistoryTitle' | t"
      [subtitle]="'partnerships.importHistorySubtitle' | t"
    >
      <a mat-flat-button color="primary" routerLink="/partnerships/import">{{
        'partnerships.importTitle' | t
      }}</a>
    </app-page-header>

    @if (loading()) {
      <app-loading-skeleton [rows]="6" [label]="'partnerships.importLoading' | t" />
    } @else if (errorMessage(); as message) {
      <app-error-state
        [title]="'partnerships.importErrorTitle' | t"
        [message]="message"
        (retry)="load()"
      />
    } @else if (result().items.length === 0) {
      <app-empty-state
        [title]="'partnerships.importHistoryEmptyTitle' | t"
        [message]="'partnerships.importHistoryEmptyMessage' | t"
      />
    } @else {
      <div class="ra-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'common.date' | t }}</th>
              <th>{{ 'partnerships.importFileName' | t }}</th>
              <th>{{ 'partnerships.importUploadedBy' | t }}</th>
              <th>{{ 'partnerships.importTotalRows' | t }}</th>
              <th>{{ 'partnerships.importImported' | t }}</th>
              <th>{{ 'partnerships.importMerged' | t }}</th>
              <th>{{ 'partnerships.importSkipped' | t }}</th>
              <th>{{ 'partnerships.importFailed' | t }}</th>
              <th>{{ 'common.status' | t }}</th>
              <th>{{ 'common.actions' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of result().items; track row.id) {
              <tr>
                <td>{{ row.createdAt.slice(0, 10) }}</td>
                <td>{{ row.fileName }}</td>
                <td>{{ row.uploadedByName || '—' }}</td>
                <td>{{ row.summary?.totalRows ?? '—' }}</td>
                <td>{{ row.result?.imported ?? '—' }}</td>
                <td>{{ row.result?.merged ?? '—' }}</td>
                <td>{{ row.result?.skipped ?? '—' }}</td>
                <td>{{ row.result?.failed ?? '—' }}</td>
                <td>{{ row.status }}</td>
                <td>
                  <a mat-button [routerLink]="['/partnerships/import/history', row.id]">{{
                    'common.view' | t
                  }}</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <mat-paginator
        [length]="result().total"
        [pageIndex]="result().page - 1"
        [pageSize]="result().pageSize"
        [pageSizeOptions]="[10, 20, 50]"
        (page)="onPage($event)"
      />
    }
  `,
})
export class ImportHistoryPage {
  private readonly api = inject(PartnershipsApi);
  readonly i18n = inject(DirectionService);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<Paginated<ImportJob>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0,
  });

  constructor() {
    this.load();
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.listImportHistory(page, this.result().pageSize).subscribe({
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
}
