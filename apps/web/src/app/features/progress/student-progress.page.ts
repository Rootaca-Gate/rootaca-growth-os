import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TPipe } from '../../core/i18n/t.pipe';
import { PageHeader } from '../../shared/page-header';
import { StudentProgressDashboard } from './student-progress-dashboard';

@Component({
  selector: 'app-student-progress-page',
  imports: [RouterLink, MatButtonModule, PageHeader, StudentProgressDashboard, TPipe],
  template: `
    <app-page-header
      [title]="'hubs.reviewsTitle' | t"
      [subtitle]="'hubs.reviewsSubtitle' | t"
    >
      <a mat-button [routerLink]="['/students', studentId]">{{ 'orientation.backToProfile' | t }}</a>
    </app-page-header>
    <app-student-progress-dashboard [studentId]="studentId" />
  `,
})
export class StudentProgressPage {
  readonly studentId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}
