import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { ACTIVITY_TYPES, enumLabel } from './partnership.labels';
import { Activity, ActivityType, Paginated } from './partnership.models';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

@Component({
  selector: 'app-activities-list-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
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
  template: `
    <app-page-header [title]="'partnerships.activitiesTitle' | t" [subtitle]="'partnerships.activitiesSubtitle' | t" />
    <section class="ra-filters">
      <mat-form-field appearance="outline">
        <mat-label>{{ 'partnerships.activityType' | t }}</mat-label>
        <mat-select [formControl]="typeControl">
          <mat-option value="">{{ 'common.none' | t }}</mat-option>
          @for (item of types; track item) {
            <mat-option [value]="item">{{ label(item) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>{{ 'partnerships.statusFrom' | t }}</mat-label><input matInput type="date" [formControl]="dateFromControl" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>{{ 'partnerships.statusTo' | t }}</mat-label><input matInput type="date" [formControl]="dateToControl" /></mat-form-field>
    </section>
    @if (loading()) {
      <app-loading-skeleton [rows]="6" [label]="'partnerships.loading' | t" />
    } @else if (errorMessage(); as message) {
      <app-error-state [title]="'partnerships.loadError' | t" [message]="message" (retry)="load()" />
    } @else if (result().items.length === 0) {
      <app-empty-state [title]="'partnerships.activitiesEmptyTitle' | t" [message]="'partnerships.activitiesEmptyMessage' | t" />
    } @else {
      <div class="ra-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'common.date' | t }}</th>
              <th>{{ 'partnerships.type' | t }}</th>
              <th>{{ 'partnerships.subject' | t }}</th>
              <th>{{ 'partnerships.institution' | t }}</th>
              <th>{{ 'partnerships.owner' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of result().items; track row.id) {
              <tr>
                <td>{{ row.activityDate | date: 'medium' : undefined : i18n.locale() }}</td>
                <td>{{ label(row.activityType) }}</td>
                <td>{{ row.subject }}</td>
                <td><a [routerLink]="['/partnerships/institutions', row.institutionId]">{{ 'partnerships.openInstitution' | t }}</a></td>
                <td>{{ row.createdByName || '—' }}</td>
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
    a { color: inherit; font-weight: 600; text-decoration: none; }
  `,
})
export class ActivitiesListPage {
  private readonly api = inject(PartnershipsApi);
  readonly i18n = inject(DirectionService);
  readonly label = enumLabel;
  readonly types = ACTIVITY_TYPES;
  readonly typeControl = new FormControl<ActivityType | ''>('', { nonNullable: true });
  readonly dateFromControl = new FormControl('', { nonNullable: true });
  readonly dateToControl = new FormControl('', { nonNullable: true });
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<Paginated<Activity>>({ items: [], total: 0, page: 1, pageSize: 20, pageCount: 0 });

  constructor() {
    this.typeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.dateFromControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.dateToControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listActivities({
        activityType: this.typeControl.value,
        dateFrom: this.dateFromControl.value || undefined,
        dateTo: this.dateToControl.value || undefined,
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
    this.result.update((current) => ({ ...current, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.load(event.pageIndex + 1);
  }
}
