import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DirectionService } from '../../core/direction.service';
import { PageHeader } from '../../shared/page-header';
import { StudentReportPreview } from './student-report-preview';

@Component({
  selector: 'app-student-report-page',
  imports: [RouterLink, MatButtonModule, PageHeader, StudentReportPreview],
  template: `
    <app-page-header [title]="title()" [subtitle]="subtitle()">
      <a mat-button [routerLink]="['/students', studentId]">{{ backLabel() }}</a>
    </app-page-header>
    <app-student-report-preview [studentId]="studentId" />
  `,
})
export class StudentReportPage {
  readonly studentId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  private readonly direction = inject(DirectionService).direction;
  readonly title = computed(() =>
    this.direction() === 'rtl' ? 'تقرير تقدم الطالب' : 'Student progress report',
  );
  readonly subtitle = computed(() =>
    this.direction() === 'rtl'
      ? 'معاينة وإنشاء وتنزيل تقرير ROOTACA'
      : 'Preview, generate, and download a ROOTACA-branded progress report',
  );
  readonly backLabel = computed(() =>
    this.direction() === 'rtl' ? 'العودة للملف' : 'Back to profile',
  );
}
