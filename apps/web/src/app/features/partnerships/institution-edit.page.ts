import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { ErrorState } from '../../shared/error-state';
import { PageHeader } from '../../shared/page-header';
import { InstitutionForm } from './institution-form';
import { Institution, InstitutionWritePayload } from './partnership.models';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

@Component({
  selector: 'app-institution-edit-page',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    PageHeader,
    InstitutionForm,
    RouterLink,
    ErrorState,
    TPipe,
  ],
  template: `
    <app-page-header [title]="'partnerships.editInstitution' | t">
      @if (institution(); as current) {
        <a mat-stroked-button [routerLink]="['/partnerships/institutions', current.id]">{{
          'common.back' | t
        }}</a>
      }
    </app-page-header>
    @if (loading()) {
      <mat-spinner diameter="36" />
    } @else if (error(); as message) {
      <app-error-state [title]="'partnerships.loadError' | t" [message]="message" (retry)="load()" />
    } @else if (institution(); as current) {
      <mat-card appearance="outlined">
        <mat-card-content>
          <app-institution-form
            [initial]="current"
            [saveLabel]="'common.save' | t"
            [submitting]="submitting()"
            (saved)="save($event)"
            (cancelled)="back(current.id)"
          />
        </mat-card-content>
      </mat-card>
    }
  `,
})
export class InstitutionEditPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly institution = signal<Institution | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.getInstitution(id).subscribe({
      next: (institution) => {
        this.institution.set(institution);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(error, this.i18n.t('partnerships.loadError')));
      },
    });
  }

  save(payload: InstitutionWritePayload): void {
    const id = this.institution()?.id;
    if (!id) {
      return;
    }
    this.submitting.set(true);
    this.api.updateInstitution(id, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        void this.router.navigate(['/partnerships/institutions', id]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        );
      },
    });
  }

  back(id: string): void {
    void this.router.navigate(['/partnerships/institutions', id]);
  }
}
