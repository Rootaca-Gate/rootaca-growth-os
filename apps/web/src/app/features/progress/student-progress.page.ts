import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeader } from '../../shared/page-header';
import { StudentProgressDashboard } from './student-progress-dashboard';

@Component({
  selector: 'app-student-progress-page',
  imports: [RouterLink, MatButtonModule, PageHeader, StudentProgressDashboard],
  template: `
    <app-page-header
      title="Progress reviews"
      subtitle="Initial assessment, monthly reviews, current score, previous score, and growth"
    >
      <a mat-button [routerLink]="['/students', studentId]">Back to profile</a>
    </app-page-header>
    <app-student-progress-dashboard [studentId]="studentId" />
  `,
})
export class StudentProgressPage {
  readonly studentId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}
