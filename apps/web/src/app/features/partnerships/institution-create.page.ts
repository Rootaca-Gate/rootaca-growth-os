import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { PageHeader } from '../../shared/page-header';
import { InstitutionForm } from './institution-form';
import { InstitutionWritePayload } from './partnership.models';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';

@Component({
  selector: 'app-institution-create-page',
  imports: [MatCardModule, MatButtonModule, PageHeader, InstitutionForm, RouterLink, TPipe],
  template: `
    <app-page-header
      [title]="'partnerships.createInstitution' | t"
      [subtitle]="'partnerships.institutionsSubtitle' | t"
    >
      <a mat-stroked-button routerLink="/partnerships/institutions">{{ 'common.back' | t }}</a>
    </app-page-header>
    <mat-card appearance="outlined">
      <mat-card-content>
        <app-institution-form
          [saveLabel]="'partnerships.createInstitution' | t"
          [submitting]="submitting()"
          (saved)="create($event)"
          (cancelled)="back()"
        />
      </mat-card-content>
    </mat-card>
  `,
})
export class InstitutionCreatePage {
  private readonly api = inject(PartnershipsApi);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(DirectionService);
  readonly submitting = signal(false);

  create(payload: InstitutionWritePayload): void {
    this.submitting.set(true);
    this.api.createInstitution(payload).subscribe({
      next: (institution) => {
        this.submitting.set(false);
        if (institution.potentialDuplicates?.length) {
          this.snackBar.open(
            this.i18n.t('partnerships.potentialDuplicates'),
            this.i18n.t('common.ok'),
            { duration: 5000 },
          );
        } else {
          this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
            duration: 2500,
          });
        }
        void this.router.navigate(['/partnerships/institutions', institution.id]);
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

  back(): void {
    void this.router.navigateByUrl('/partnerships/institutions');
  }
}
