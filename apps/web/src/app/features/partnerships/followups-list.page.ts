import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { StatCard } from '../../shared/stat-card';
import { enumLabel } from './partnership.labels';
import { FollowUp } from './partnership.models';
import { usePartnershipPermissions } from './partnership.permissions';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

@Component({
  selector: 'app-followups-list-page',
  imports: [
    RouterLink,
    MatButtonModule,
    PageHeader,
    StatCard,
    ErrorState,
    LoadingSkeleton,
    TPipe,
  ],
  template: `
    <app-page-header [title]="'partnerships.followUpsTitle' | t" [subtitle]="'partnerships.followUpsSubtitle' | t" />
    @if (loading()) {
      <app-loading-skeleton variant="cards" [rows]="4" [label]="'partnerships.loading' | t" />
    } @else if (error(); as message) {
      <app-error-state [title]="'partnerships.loadError' | t" [message]="message" (retry)="load()" />
    } @else {
      <section class="stats">
        <app-stat-card [label]="'partnerships.overdue' | t" [value]="'' + overdue().length" />
        <app-stat-card [label]="'partnerships.dueToday' | t" [value]="'' + dueToday().length" />
        <app-stat-card [label]="'partnerships.upcoming' | t" [value]="'' + upcoming().length" />
        <app-stat-card [label]="'partnerships.completed' | t" [value]="'' + completed().length" />
      </section>

      @for (section of sections; track section.key) {
        <section class="ra-card block">
          <h2>{{ section.titleKey | t }}</h2>
          @if (section.items().length === 0) {
            <p class="hint">—</p>
          } @else {
            <div class="ra-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{{ 'common.titleField' | t }}</th>
                    <th>{{ 'partnerships.dueDate' | t }}</th>
                    <th>{{ 'partnerships.priority' | t }}</th>
                    <th>{{ 'common.status' | t }}</th>
                    <th>{{ 'common.actions' | t }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of section.items(); track row.id) {
                    <tr>
                      <td>{{ row.title }}</td>
                      <td>{{ row.dueDate }}</td>
                      <td>{{ label(row.priority) }}</td>
                      <td>{{ label(row.status) }}</td>
                      <td class="actions">
                        <a mat-button [routerLink]="['/partnerships/institutions', row.institutionId]">{{ 'partnerships.openInstitution' | t }}</a>
                        @if (row.leadId) {
                          <a mat-button [routerLink]="['/partnerships/leads', row.leadId]">{{ 'partnerships.openLead' | t }}</a>
                        }
                        @if (permissions.canWrite() && row.status === 'PENDING') {
                          <button mat-stroked-button type="button" (click)="complete(row.id)">{{ 'partnerships.completeFollowUp' | t }}</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    }
  `,
  styles: `
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-block-end: 16px; }
    .block { padding: 18px 20px; margin-block-end: 14px; }
    .block h2 { margin: 0 0 12px; font-size: 1.05rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: start; border-bottom: 1px solid var(--ra-border); font-size: 0.9rem; }
    .actions { white-space: nowrap; }
    .hint { color: var(--ra-muted); }
    @media (max-width: 800px) { .stats { grid-template-columns: 1fr 1fr; } }
  `,
})
export class FollowUpsListPage {
  private readonly api = inject(PartnershipsApi);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();
  readonly label = enumLabel;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly overdue = signal<FollowUp[]>([]);
  readonly dueToday = signal<FollowUp[]>([]);
  readonly upcoming = signal<FollowUp[]>([]);
  readonly completed = signal<FollowUp[]>([]);

  readonly sections = [
    { key: 'overdue', titleKey: 'partnerships.overdue', items: this.overdue },
    { key: 'dueToday', titleKey: 'partnerships.dueToday', items: this.dueToday },
    { key: 'upcoming', titleKey: 'partnerships.upcoming', items: this.upcoming },
    { key: 'completed', titleKey: 'partnerships.completed', items: this.completed },
  ];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const today = new Date().toISOString().slice(0, 10);
    forkJoin({
      overdue: this.api.listFollowUps({ status: 'PENDING', overdue: true, pageSize: 50 }),
      dueToday: this.api.listFollowUps({ status: 'PENDING', dueDate: today, pageSize: 50 }),
      pending: this.api.listFollowUps({ status: 'PENDING', pageSize: 100 }),
      completed: this.api.listFollowUps({ status: 'COMPLETED', pageSize: 50 }),
    }).subscribe({
      next: (data) => {
        this.overdue.set(data.overdue.items);
        this.dueToday.set(data.dueToday.items);
        this.upcoming.set(data.pending.items.filter((item) => item.dueDate > today));
        this.completed.set(data.completed.items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(error, this.i18n.t('partnerships.loadError')));
      },
    });
  }

  complete(id: string): void {
    this.api.updateFollowUp(id, { complete: true }).subscribe({
      next: () => {
        this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        this.load();
      },
      error: (error: unknown) =>
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        ),
    });
  }
}
