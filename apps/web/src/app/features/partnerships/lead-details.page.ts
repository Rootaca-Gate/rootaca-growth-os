import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import {
  ACTIVITY_TYPES,
  FOLLOWUP_PRIORITIES,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  enumLabel,
} from './partnership.labels';
import { Activity, FollowUp, Lead, LeadStatus } from './partnership.models';
import { usePartnershipPermissions } from './partnership.permissions';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';
import {
  PartnershipBreadcrumb,
  PartnershipBreadcrumbs,
  partnershipJourneyCrumbs,
} from './shared/partnership-breadcrumbs';

@Component({
  selector: 'app-lead-details-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    ErrorState,
    LoadingSkeleton,
    PartnershipBreadcrumbs,
    TPipe,
  ],
  template: `
    @if (loading()) {
      <app-loading-skeleton [rows]="8" [label]="'partnerships.loading' | t" />
    } @else if (error(); as message) {
      <app-error-state [title]="'partnerships.loadError' | t" [message]="message" (retry)="reload()" />
    } @else if (lead(); as current) {
      <app-partnership-breadcrumbs [items]="breadcrumbs()" />
      <app-page-header
        [title]="current.institutionName || ('partnerships.lead' | t)"
        [subtitle]="label(current.status) + ' · ' + label(current.priority)"
      >
        <a mat-stroked-button routerLink="/partnerships/leads">{{ 'common.back' | t }}</a>
        <a mat-stroked-button [routerLink]="['/partnerships/institutions', current.institutionId]">{{
          'partnerships.openInstitution' | t
        }}</a>
        @if (permissions.canWrite()) {
          <a
            mat-flat-button
            color="primary"
            [routerLink]="['/partnerships/proposals/new']"
            [queryParams]="{ institutionId: current.institutionId, leadId: current.id }"
            >{{ 'partnerships.leadCreateProposal' | t }}</a
          >
          <button mat-stroked-button type="button" (click)="showStatus.set(!showStatus())">
            {{ 'partnerships.changeStatus' | t }}
          </button>
        }
      </app-page-header>

      <section class="ra-card block next-steps">
        <h2>{{ 'partnerships.leadNextStepsTitle' | t }}</h2>
        <p class="muted">{{ 'partnerships.leadNextStepsHint' | t }}</p>
        <div class="actions">
          <a mat-stroked-button [routerLink]="['/partnerships/institutions', current.institutionId]">{{
            'partnerships.leadOpenInstitutionHub' | t
          }}</a>
          <a mat-stroked-button routerLink="/partnerships/programs">{{
            'partnerships.leadBrowsePrograms' | t
          }}</a>
          <a mat-stroked-button routerLink="/partnerships/offerings">{{
            'partnerships.leadBrowseOfferings' | t
          }}</a>
          @if (permissions.canWrite()) {
            <a
              mat-flat-button
              color="primary"
              [routerLink]="['/partnerships/proposals/new']"
              [queryParams]="{ institutionId: current.institutionId, leadId: current.id }"
              >{{ 'partnerships.leadCreateProposal' | t }}</a
            >
          }
        </div>
      </section>

      @if (showStatus()) {
        <section class="ra-card panel">
          <form class="row" [formGroup]="statusForm" (ngSubmit)="changeStatus()">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'partnerships.statusFrom' | t }}</mat-label>
              <input matInput [value]="label(current.status)" disabled />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'partnerships.statusTo' | t }}</mat-label>
              <mat-select formControlName="status">
                @for (item of statuses; track item) {
                  <mat-option [value]="item">{{ label(item) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit">{{ 'common.save' | t }}</button>
          </form>
        </section>
      }

      <section class="ra-card block">
        <dl class="facts">
          <div>
            <dt>{{ 'common.status' | t }}</dt>
            <dd>{{ label(current.status) }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.priority' | t }}</dt>
            <dd>{{ label(current.priority) }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.nextAction' | t }}</dt>
            <dd>{{ current.nextAction || '—' }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.dueDate' | t }}</dt>
            <dd>{{ current.nextActionDate || '—' }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.qualificationReason' | t }}</dt>
            <dd>{{ current.qualificationReason || '—' }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.estimatedStudents' | t }}</dt>
            <dd>{{ current.estimatedStudentCount ?? '—' }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.estimatedOpportunity' | t }}</dt>
            <dd>{{ current.estimatedOpportunity || '—' }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.owner' | t }}</dt>
            <dd>{{ current.ownerId || '—' }}</dd>
          </div>
        </dl>
      </section>

      @if (permissions.canWrite()) {
        <section class="ra-card panel">
          <h2>{{ 'partnerships.addActivity' | t }}</h2>
          <form class="row" [formGroup]="activityForm" (ngSubmit)="addActivity()">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'partnerships.activityType' | t }}</mat-label>
              <mat-select formControlName="activityType">
                @for (item of activityTypes; track item) {
                  <mat-option [value]="item">{{ label(item) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline"
              ><mat-label>{{ 'partnerships.subject' | t }}</mat-label
              ><input matInput formControlName="subject"
            /></mat-form-field>
            <button mat-flat-button color="primary" type="submit">{{ 'common.add' | t }}</button>
          </form>
        </section>
        <section class="ra-card panel">
          <h2>{{ 'partnerships.addFollowUp' | t }}</h2>
          <form class="row" [formGroup]="followUpForm" (ngSubmit)="addFollowUp()">
            <mat-form-field appearance="outline"
              ><mat-label>{{ 'common.titleField' | t }}</mat-label
              ><input matInput formControlName="title"
            /></mat-form-field>
            <mat-form-field appearance="outline"
              ><mat-label>{{ 'partnerships.dueDate' | t }}</mat-label
              ><input matInput type="date" formControlName="dueDate"
            /></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'partnerships.priority' | t }}</mat-label>
              <mat-select formControlName="priority">
                @for (item of followUpPriorities; track item) {
                  <mat-option [value]="item">{{ label(item) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit">{{ 'common.add' | t }}</button>
          </form>
        </section>
      }
    }
  `,
  styles: `
    .block,
    .panel {
      padding: 18px 20px;
      margin-block-end: 14px;
    }
    .next-steps h2 {
      margin: 0 0 6px;
      font-size: 1.05rem;
    }
    .muted {
      margin: 0 0 12px;
      color: var(--ra-muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin: 0;
    }
    .facts dt {
      color: var(--ra-muted);
      font-size: 0.8rem;
    }
    .facts dd {
      margin: 2px 0 0;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
  `,
})
export class LeadDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();
  readonly label = enumLabel;
  readonly statuses = LEAD_STATUSES;
  readonly activityTypes = ACTIVITY_TYPES;
  readonly followUpPriorities = FOLLOWUP_PRIORITIES;
  readonly priorities = LEAD_PRIORITIES;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lead = signal<Lead | null>(null);
  readonly showStatus = signal(false);

  readonly breadcrumbs = computed<PartnershipBreadcrumb[]>(() => {
    const current = this.lead();
    return partnershipJourneyCrumbs(
      (key) => this.i18n.t(key),
      'discovery',
      'nav.leads',
      '/partnerships/leads',
      current?.institutionName || this.i18n.t('partnerships.lead'),
    );
  });

  readonly statusForm = this.fb.nonNullable.group({
    status: ['NEW' as LeadStatus, Validators.required],
  });
  readonly activityForm = this.fb.nonNullable.group({
    activityType: ['NOTE' as string, Validators.required],
    subject: ['', Validators.required],
  });
  readonly followUpForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    dueDate: [new Date().toISOString().slice(0, 10), Validators.required],
    priority: ['MEDIUM' as string],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.getLead(id).subscribe({
      next: (lead) => {
        this.lead.set(lead);
        this.statusForm.patchValue({ status: lead.status });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(error, this.i18n.t('partnerships.loadError')));
      },
    });
  }

  changeStatus(): void {
    const current = this.lead();
    if (!current || this.statusForm.invalid) return;
    const next = this.statusForm.controls.status.value;
    if (next === current.status) {
      this.showStatus.set(false);
      return;
    }
    this.api.updateLead(current.id, { status: next }).subscribe({
      next: () => {
        this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        this.showStatus.set(false);
        this.reload();
      },
      error: (error: unknown) =>
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        ),
    });
  }

  addActivity(): void {
    const current = this.lead();
    if (!current || this.activityForm.invalid) return;
    const value = this.activityForm.getRawValue();
    this.api
      .createActivity({
        institutionId: current.institutionId,
        leadId: current.id,
        activityType: value.activityType as Activity['activityType'],
        subject: value.subject.trim(),
      })
      .subscribe({
        next: () => {
          this.activityForm.patchValue({ subject: '' });
          this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
            duration: 2500,
          });
          this.reload();
        },
        error: (error: unknown) =>
          this.snackBar.open(
            partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
            this.i18n.t('common.ok'),
            { duration: 4000 },
          ),
      });
  }

  addFollowUp(): void {
    const current = this.lead();
    if (!current || this.followUpForm.invalid) return;
    const value = this.followUpForm.getRawValue();
    this.api
      .createFollowUp({
        institutionId: current.institutionId,
        leadId: current.id,
        title: value.title.trim(),
        dueDate: value.dueDate,
        priority: value.priority as FollowUp['priority'],
      })
      .subscribe({
        next: () => {
          this.followUpForm.patchValue({ title: '' });
          this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
            duration: 2500,
          });
          this.reload();
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
