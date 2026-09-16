import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { PageHeader } from '../../shared/page-header';
import { httpErrorMessage } from '../../shared/http-error';
import { DashboardApi } from '../dashboard/dashboard.api';
import { DashboardAttentionItem } from '../dashboard/dashboard.models';
import { KpiApi } from './kpi.api';
import { KPI_CATEGORIES, KPI_FREQUENCIES } from './kpi.labels';
import { KpiCategory, KpiDefinition, KpiFrequency } from './kpi.models';

@Component({
  selector: 'app-kpis-admin-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    RouterLink,
    PageHeader,
    EmptyState,
    ErrorState,
    TPipe,
  ],
  template: `
    <app-page-header [title]="'kpis.title' | t" [subtitle]="'kpis.subtitle' | t">
      @if (canEdit() && !editing()) {
        <button mat-flat-button color="primary" type="button" (click)="startCreate()">{{ 'kpis.create' | t }}</button>
      }
    </app-page-header>

    @if (behindOnly() && behindStudents().length) {
      <section class="behind ra-card">
        <h2>{{ 'kpis.belowTarget' | t }}</h2>
        <ul>
          @for (item of behindStudents(); track item.studentId) {
            <li>
              <div>
                <strong>{{ item.studentName }}</strong>
                <p>{{ item.detail }}</p>
              </div>
              <a mat-stroked-button [routerLink]="item.href">{{ 'dashboard.viewStudent' | t }}</a>
            </li>
          }
        </ul>
      </section>
    } @else if (behindOnly() && !loading() && !error()) {
      <p class="quiet">{{ 'kpis.noneBelow' | t }}</p>
    }

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (error(); as message) {
      <app-error-state [title]="'kpis.loadError' | t" [message]="message" (retry)="reload()" />
    } @else if (definitions().length === 0 && !editing()) {
      <app-empty-state [title]="'kpis.empty' | t" [message]="'kpis.emptyHint' | t" />
    } @else {
      <div class="grid">
        @for (item of definitions(); track item.id) {
          <article [attr.data-active]="item.active">
            <p class="kicker">
              {{ 'kpis.cardMeta' | t:{
                category: i18n.kpiCategoryLabel(item.category),
                frequency: i18n.frequencyLabel(item.frequency),
                weight: item.weight
              } }}
            </p>
            <h2>{{ item.name }}</h2>
            <p>{{ item.description }}</p>
            <p class="meta">
              {{ 'kpis.targetMeta' | t:{ target: item.target, unit: item.unit } }}
              @if (!item.active) {
                · {{ 'common.inactive' | t }}
              }
            </p>
            @if (canEdit()) {
              <div class="actions">
                <button mat-button type="button" (click)="startEdit(item)">{{ 'common.edit' | t }}</button>
                @if (item.active) {
                  <button mat-button type="button" (click)="deactivate(item.id)">{{ 'common.deactivate' | t }}</button>
                }
              </div>
            }
          </article>
        }
      </div>
    }

    @if (canEdit() && editing()) {
      <form [formGroup]="form" (ngSubmit)="save()">
        <h2>{{ editingId() ? ('kpis.edit' | t) : ('kpis.add' | t) }}</h2>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'kpis.name' | t }}</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'kpis.description' | t }}</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'kpis.category' | t }}</mat-label>
          <mat-select formControlName="category">
            @for (category of categories; track category) {
              <mat-option [value]="category">{{ i18n.kpiCategoryLabel(category) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'kpis.target' | t }}</mat-label>
          <input matInput type="number" formControlName="target" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'kpis.unit' | t }}</mat-label>
          <input matInput formControlName="unit" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'kpis.frequency' | t }}</mat-label>
          <mat-select formControlName="frequency">
            @for (frequency of frequencies; track frequency) {
              <mat-option [value]="frequency">{{ i18n.frequencyLabel(frequency) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'kpis.weight' | t }}</mat-label>
          <input matInput type="number" formControlName="weight" />
        </mat-form-field>
        <div class="actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            {{ 'kpis.save' | t }}
          </button>
          <button mat-button type="button" (click)="editing.set(false)">{{ 'common.cancel' | t }}</button>
        </div>
      </form>
    }
  `,
  styles: `
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    article,
    form {
      padding: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: var(--mat-sys-surface-container-lowest);
      display: grid;
      gap: 10px;
    }

    article[data-active='false'] {
      opacity: 0.65;
    }

    form {
      margin-top: 24px;
    }

    .kicker,
    .meta,
    p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .kicker {
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
    }

    h2 {
      margin: 0;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .behind {
      padding: 20px;
      margin-block-end: 20px;
    }

    .behind ul {
      list-style: none;
      margin: 12px 0 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }

    .behind li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }

    .behind p,
    .quiet {
      margin: 4px 0 16px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class KpisAdminPage {
  private readonly api = inject(KpiApi);
  private readonly dashboardApi = inject(DashboardApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly behindOnly = signal(false);
  readonly behindStudents = signal<DashboardAttentionItem[]>([]);
  readonly definitions = signal<KpiDefinition[]>([]);
  readonly categories = KPI_CATEGORIES;
  readonly frequencies = KPI_FREQUENCIES;
  readonly canEdit = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    category: new FormControl<KpiCategory>('PRACTICE', { nonNullable: true }),
    target: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    unit: new FormControl('count', { nonNullable: true, validators: [Validators.required] }),
    frequency: new FormControl<KpiFrequency>('WEEKLY', { nonNullable: true }),
    weight: new FormControl(10, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
    }),
  });

  constructor() {
    this.behindOnly.set(this.route.snapshot.queryParamMap.get('status') === 'behind');
    this.reload();
  }

  categoryLabel(category: KpiCategory): string {
    return this.i18n.kpiCategoryLabel(category);
  }

  frequencyLabel(frequency: KpiFrequency): string {
    return this.i18n.frequencyLabel(frequency);
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      description: '',
      category: 'PRACTICE',
      target: 1,
      unit: 'count',
      frequency: 'WEEKLY',
      weight: 10,
    });
    this.editing.set(true);
  }

  startEdit(item: KpiDefinition): void {
    this.editingId.set(item.id);
    this.form.reset({
      name: item.name,
      description: item.description,
      category: item.category,
      target: item.target,
      unit: item.unit,
      frequency: item.frequency,
      weight: item.weight,
    });
    this.editing.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue();
    const request = this.editingId()
      ? this.api.updateDefinition(this.editingId() ?? '', payload)
      : this.api.createDefinition(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.snackBar.open(this.i18n.t('kpis.saved'), this.i18n.t('common.ok'), { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snackBar.open(this.toMessage(error), this.i18n.t('common.ok'), { duration: 4000 });
      },
    });
  }

  deactivate(id: string): void {
    this.api.deactivateDefinition(id).subscribe({
      next: () => {
        this.snackBar.open(this.i18n.t('kpis.deactivated'), this.i18n.t('common.ok'), { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => this.snackBar.open(this.toMessage(error), this.i18n.t('common.ok'), { duration: 4000 }),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listDefinitions().subscribe({
      next: (items) => {
        this.definitions.set(items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(httpErrorMessage(error, this.i18n.t('errors.connection')));
        this.loading.set(false);
      },
    });
    if (this.behindOnly()) {
      this.dashboardApi.getDashboard().subscribe({
        next: (dashboard) => this.behindStudents.set(dashboard.attention.kpiBelowTarget),
      });
    }
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return this.i18n.t('kpis.updateFailed');
  }
}
