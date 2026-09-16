import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeader } from '../../shared/page-header';
import { StudentKpiDashboard } from './student-kpi-dashboard';

@Component({
  selector: 'app-student-kpi-page',
  imports: [RouterLink, MatButtonModule, PageHeader, StudentKpiDashboard],
  template: `
    <app-page-header title="KPIs" subtitle="Target, actual, progress, status, and period history">
      <a mat-button [routerLink]="['/students', studentId]">Back to profile</a>
    </app-page-header>
    <app-student-kpi-dashboard [studentId]="studentId" />
  `,
})
export class StudentKpiPage {
  readonly studentId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}
