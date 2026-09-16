import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TPipe } from '../../core/i18n/t.pipe';
import { PageHeader } from '../../shared/page-header';
import { StudentKpiDashboard } from './student-kpi-dashboard';

@Component({
  selector: 'app-student-kpi-page',
  imports: [RouterLink, MatButtonModule, PageHeader, StudentKpiDashboard, TPipe],
  template: `
    <app-page-header [title]="'kpis.title' | t" [subtitle]="'kpis.studentSubtitle' | t">
      <a mat-button [routerLink]="['/students', studentId]">{{ 'orientation.backToProfile' | t }}</a>
    </app-page-header>
    <app-student-kpi-dashboard [studentId]="studentId" />
  `,
})
export class StudentKpiPage {
  readonly studentId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}
