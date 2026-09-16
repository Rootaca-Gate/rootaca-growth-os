import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { KpiApi } from './kpi.api';
import {
  KPI_CATEGORIES,
  KPI_CATEGORY_LABELS,
  KPI_FREQUENCIES,
  KPI_FREQUENCY_LABELS,
} from './kpi.labels';
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
    PageHeader,
    EmptyState,
  ],
  template: `
    <app-page-header title="KPIs" subtitle="Definitions used for weekly and monthly student records">
      @if (canEdit() && !editing()) {
        <button mat-stroked-button type="button" (click)="startCreate()">Add KPI</button>
      }
    </app-page-header>

    @if (loading()) {
      <div class="loading"><mat-spinner diameter="36" /></div>
    } @else if (definitions().length === 0 && !editing()) {
      <app-empty-state title="No KPIs" message="Seed the catalog or add a definition." />
    } @else {
      <div class="grid">
        @for (item of definitions(); track item.id) {
          <article [attr.data-active]="item.active">
            <p class="kicker">
              {{ categoryLabel(item.category) }} · {{ frequencyLabel(item.frequency) }} · weight
              {{ item.weight }}
            </p>
            <h2>{{ item.name }}</h2>
            <p>{{ item.description }}</p>
            <p class="meta">
              Target {{ item.target }} {{ item.unit }}
              @if (!item.active) {
                · Inactive
              }
            </p>
            @if (canEdit()) {
              <div class="actions">
                <button mat-button type="button" (click)="startEdit(item)">Edit</button>
                @if (item.active) {
                  <button mat-button type="button" (click)="deactivate(item.id)">Deactivate</button>
                }
              </div>
            }
          </article>
        }
      </div>
    }

    @if (canEdit() && editing()) {
      <form [formGroup]="form" (ngSubmit)="save()">
        <h2>{{ editingId() ? 'Edit KPI' : 'Add KPI' }}</h2>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            @for (category of categories; track category) {
              <mat-option [value]="category">{{ categoryLabel(category) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Target</mat-label>
          <input matInput type="number" formControlName="target" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Unit</mat-label>
          <input matInput formControlName="unit" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Frequency</mat-label>
          <mat-select formControlName="frequency">
            @for (frequency of frequencies; track frequency) {
              <mat-option [value]="frequency">{{ frequencyLabel(frequency) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Weight</mat-label>
          <input matInput type="number" formControlName="weight" />
        </mat-form-field>
        <div class="actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            Save definition
          </button>
          <button mat-button type="button" (click)="editing.set(false)">Cancel</button>
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
  `,
})
export class KpisAdminPage {
  private readonly api = inject(KpiApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly editingId = signal<string | null>(null);
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
    target: new FormControl(1, { nonNullable: true, validators: [Validators.min(0)] }),
    unit: new FormControl('count', { nonNullable: true, validators: [Validators.required] }),
    frequency: new FormControl<KpiFrequency>('WEEKLY', { nonNullable: true }),
    weight: new FormControl(10, { nonNullable: true, validators: [Validators.min(1), Validators.max(100)] }),
  });

  constructor() {
    this.reload();
  }

  categoryLabel(category: KpiCategory): string {
    return KPI_CATEGORY_LABELS[category];
  }

  frequencyLabel(frequency: KpiFrequency): string {
    return KPI_FREQUENCY_LABELS[frequency];
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
        this.snackBar.open('KPI definition saved', 'OK', { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snackBar.open(this.toMessage(error), 'OK', { duration: 4000 });
      },
    });
  }

  deactivate(id: string): void {
    this.api.deactivateDefinition(id).subscribe({
      next: () => {
        this.snackBar.open('KPI deactivated', 'OK', { duration: 2000 });
        this.reload();
      },
      error: (error: unknown) => this.snackBar.open(this.toMessage(error), 'OK', { duration: 4000 }),
    });
  }

  private reload(): void {
    this.api.listDefinitions().subscribe({
      next: (items) => {
        this.definitions.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Unable to update KPI definitions.';
  }
}
