import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { Contact, Paginated } from './partnership.models';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

@Component({
  selector: 'app-contacts-list-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  template: `
    <app-page-header [title]="'partnerships.contactsTitle' | t" [subtitle]="'partnerships.contactsSubtitle' | t" />
    <section class="ra-filters">
      <mat-form-field appearance="outline"><mat-label>{{ 'common.search' | t }}</mat-label><input matInput [formControl]="searchControl" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>{{ 'partnerships.jobTitle' | t }}</mat-label><input matInput [formControl]="jobTitleControl" /></mat-form-field>
      <mat-checkbox [formControl]="decisionMakerControl">{{ 'partnerships.decisionMaker' | t }}</mat-checkbox>
      <mat-checkbox [formControl]="hasEmailControl">{{ 'partnerships.hasEmail' | t }}</mat-checkbox>
      <mat-checkbox [formControl]="hasPhoneControl">{{ 'partnerships.hasPhone' | t }}</mat-checkbox>
    </section>
    @if (loading()) {
      <app-loading-skeleton [rows]="6" [label]="'partnerships.loading' | t" />
    } @else if (errorMessage(); as message) {
      <app-error-state [title]="'partnerships.loadError' | t" [message]="message" (retry)="load()" />
    } @else if (result().items.length === 0) {
      <app-empty-state [title]="'partnerships.contactsEmptyTitle' | t" [message]="'partnerships.contactsEmptyMessage' | t" />
    } @else {
      <div class="ra-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'partnerships.fullName' | t }}</th>
              <th>{{ 'partnerships.institution' | t }}</th>
              <th>{{ 'partnerships.jobTitle' | t }}</th>
              <th>{{ 'partnerships.email' | t }}</th>
              <th>{{ 'partnerships.phone' | t }}</th>
              <th>{{ 'partnerships.decisionMaker' | t }}</th>
              <th>{{ 'partnerships.primary' | t }}</th>
              <th>{{ 'common.actions' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of result().items; track row.id) {
              <tr>
                <td>{{ row.fullName }}</td>
                <td>{{ row.institutionName || '—' }}</td>
                <td>{{ row.jobTitle || '—' }}</td>
                <td>{{ row.email || '—' }}</td>
                <td>{{ row.phone || row.mobile || '—' }}</td>
                <td>{{ row.isDecisionMaker ? '✓' : '' }}</td>
                <td>{{ row.isPrimary ? '✓' : '' }}</td>
                <td><a mat-button [routerLink]="['/partnerships/institutions', row.institutionId]">{{ 'partnerships.openInstitution' | t }}</a></td>
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
  `,
})
export class ContactsListPage {
  private readonly api = inject(PartnershipsApi);
  readonly i18n = inject(DirectionService);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly jobTitleControl = new FormControl('', { nonNullable: true });
  readonly decisionMakerControl = new FormControl(false, { nonNullable: true });
  readonly hasEmailControl = new FormControl(false, { nonNullable: true });
  readonly hasPhoneControl = new FormControl(false, { nonNullable: true });
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<Paginated<Contact>>({ items: [], total: 0, page: 1, pageSize: 20, pageCount: 0 });

  constructor() {
    this.searchControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.load(1));
    this.jobTitleControl.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.load(1));
    this.decisionMakerControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasEmailControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.hasPhoneControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load(1));
    this.load(1);
  }

  load(page = this.result().page): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listContacts({
        search: this.searchControl.value,
        jobTitle: this.jobTitleControl.value,
        isDecisionMaker: this.decisionMakerControl.value || undefined,
        hasEmail: this.hasEmailControl.value || undefined,
        hasPhone: this.hasPhoneControl.value || undefined,
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
