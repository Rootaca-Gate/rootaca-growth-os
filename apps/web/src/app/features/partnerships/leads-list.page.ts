import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { LEAD_PRIORITIES, LEAD_STATUSES, enumLabel } from './partnership.labels';
import { Lead, LeadPriority, LeadStatus, Paginated } from './partnership.models';
import { PartnershipsApi } from './partnerships.api';
import { usePartnershipPermissions } from './partnership.permissions';
import { partnershipErrorMessage } from './partnership.util';

@Component({
  selector: 'app-leads-list-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  template: `
    <app-page-header [title]="'partnerships.leadsTitle' | t" [subtitle]="'partnerships.leadsSubtitle' | t">
      <mat-button-toggle-group [value]="view()" (change)="onViewChange($event.value)">
        <mat-button-toggle value="table">{{ 'partnerships.tableView' | t }}</mat-button-toggle>
        <mat-button-toggle value="board">{{ 'partnerships.boardView' | t }}</mat-button-toggle>
      </mat-button-toggle-group>
      @if (permissions.canWrite()) {
        <a mat-flat-button color="primary" routerLink="/partnerships/institutions">{{ 'partnerships.addLead' | t }}</a>
      }
    </app-page-header>
    <section class="ra-filters">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ 'common.status' | t }}</mat-label>
        <mat-select [formControl]="statusControl">
          <mat-option value="">{{ 'common.allStatuses' | t }}</mat-option>
          @for (item of statuses; track item) {
            <mat-option [value]="item">{{ label(item) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ 'partnerships.priority' | t }}</mat-label>
        <mat-select [formControl]="priorityControl">
          <mat-option value="">{{ 'common.allStatuses' | t }}</mat-option>
          @for (item of priorities; track item) {
            <mat-option [value]="item">{{ label(item) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </section>
    @if (loading()) {
      <app-loading-skeleton variant="table" [label]="'partnerships.leadsLoading' | t" />
    } @else if (errorMessage(); as message) {
      <app-error-state [title]="'partnerships.leadsLoadError' | t" [message]="message" (retry)="load()" />
    } @else if (result().items.length === 0) {
      <app-empty-state icon="handshake" [title]="'partnerships.leadsEmptyTitle' | t" [message]="'partnerships.leadsEmptyMessage' | t">
        @if (permissions.canWrite()) {
          <a mat-flat-button color="primary" routerLink="/partnerships/institutions">{{ 'partnerships.addLead' | t }}</a>
        }
      </app-empty-state>
    } @else if (view() === 'board') {
      <div class="board">
        @for (status of statuses; track status) {
          <section class="ra-card column">
            <h3>{{ label(status) }}</h3>
            @for (row of leadsByStatus(status); track row.id) {
              <a class="card" [routerLink]="['/partnerships/leads', row.id]">
                <strong>{{ row.institutionName || row.id.slice(0, 8) }}</strong>
                <span>{{ row.primaryContactName || '—' }}</span>
                <span>{{ row.ownerName || '—' }}</span>
                <span>{{ row.nextFollowUpDate || row.nextActionDate || '—' }}</span>
              </a>
            }
          </section>
        }
      </div>
    } @else {
      <div class="ra-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'partnerships.institution' | t }}</th>
              <th>{{ 'partnerships.primaryContact' | t }}</th>
              <th>{{ 'common.status' | t }}</th>
              <th>{{ 'partnerships.owner' | t }}</th>
              <th>{{ 'partnerships.nextFollowUp' | t }}</th>
              <th>{{ 'common.actions' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of result().items; track row.id) {
              <tr>
                <td>{{ row.institutionName || '—' }}</td>
                <td>{{ row.primaryContactName || '—' }}</td>
                <td>{{ label(row.status) }}</td>
                <td>{{ row.ownerName || '—' }}</td>
                <td>{{ row.nextFollowUpDate || row.nextActionDate || '—' }}</td>
                <td>
                  <a mat-button [routerLink]="['/partnerships/leads', row.id]">{{ 'common.open' | t }}</a>
                  <a mat-button [routerLink]="['/partnerships/institutions', row.institutionId]">{{ 'partnerships.openInstitution' | t }}</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <mat-paginator [length]="result().total" [pageIndex]="result().page - 1" [pageSize]="result().pageSize" [pageSizeOptions]="[10, 20, 50]" (page)="onPage($event)" />
    }
  `,
  styles: `
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 14px; text-align: start; border-bottom: 1px solid var(--ra-border); font-size: 0.9rem; }
    .board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(220px, 1fr); gap: 12px; overflow-x: auto; padding-block-end: 12px; }
    .column { padding: 12px; min-height: 240px; display: grid; gap: 8px; align-content: start; }
    .column h3 { margin: 0; font-size: 0.9rem; }
    .card { display: grid; gap: 4px; padding: 10px; border: 1px solid var(--ra-border); border-radius: 10px; text-decoration: none; color: inherit; }
    .card span { color: var(--ra-muted); font-size: 0.8rem; }
  `,
})
export class LeadsListPage {
  private readonly api = inject(PartnershipsApi);
  readonly i18n = inject(DirectionService);
  readonly label = enumLabel;
  readonly statuses = LEAD_STATUSES;
  readonly priorities = LEAD_PRIORITIES;
  readonly permissions = usePartnershipPermissions();
  readonly view = signal<'table' | 'board'>('table');
  readonly statusControl = new FormControl<LeadStatus | ''>('', { nonNullable: true });
  readonly priorityControl = new FormControl<LeadPriority | ''>('', { nonNullable: true });
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<Paginated<Lead>>({ items: [], total: 0, page: 1, pageSize: 20, pageCount: 0 });

  constructor() {
    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.priorityControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const pageSize = this.view() === 'board' ? 100 : this.result().pageSize;
    this.api
      .listLeads({
        status: this.statusControl.value || undefined,
        priority: this.priorityControl.value || undefined,
        page,
        pageSize,
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

  leadsByStatus(status: LeadStatus): Lead[] {
    return this.result().items.filter((item) => item.status === status);
  }

  onViewChange(value: 'table' | 'board'): void {
    this.view.set(value);
    this.load(1);
  }

  onPage(event: PageEvent): void {
    this.result.update((current) => ({ ...current, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.load(event.pageIndex + 1);
  }
}
