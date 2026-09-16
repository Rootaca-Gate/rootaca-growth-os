import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TPipe } from '../../core/i18n/t.pipe';
import { PageHeader } from '../../shared/page-header';
import { StudentProjectBoard } from './student-project-board';

@Component({
  selector: 'app-student-projects-page',
  imports: [RouterLink, MatButtonModule, PageHeader, StudentProjectBoard, TPipe],
  template: `
    <app-page-header
      [title]="'projects.title' | t"
      [subtitle]="'projects.studentSubtitle' | t"
    >
      <a mat-stroked-button routerLink="/projects">{{ 'common.catalog' | t }}</a>
      <a mat-button [routerLink]="['/students', studentId]">{{ 'orientation.backToProfile' | t }}</a>
    </app-page-header>
    <app-student-project-board [studentId]="studentId" />
  `,
})
export class StudentProjectsPage {
  readonly studentId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}
