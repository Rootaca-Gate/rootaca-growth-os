import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TPipe } from '../../core/i18n/t.pipe';
import { PageHeader } from '../../shared/page-header';
import { StudentReportPreview } from './student-report-preview';

@Component({
  selector: 'app-student-report-page',
  imports: [RouterLink, MatButtonModule, PageHeader, StudentReportPreview, TPipe],
  template: `
    <app-page-header [title]="'students.reportTitle' | t" [subtitle]="'students.reportSubtitle' | t">
      <a mat-button [routerLink]="['/students', studentId]">{{ 'orientation.backToProfile' | t }}</a>
    </app-page-header>
    <app-student-report-preview [studentId]="studentId" />
  `,
})
export class StudentReportPage {
  readonly studentId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}
