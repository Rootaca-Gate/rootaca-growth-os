import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageHeader } from '../../shared/page-header';
import { StudentProjectBoard } from './student-project-board';

@Component({
  selector: 'app-student-projects-page',
  imports: [RouterLink, MatButtonModule, PageHeader, StudentProjectBoard],
  template: `
    <app-page-header
      title="Educational projects"
      subtitle="Milestone completion, due dates, and mentor feedback"
    >
      <a mat-stroked-button routerLink="/projects">Catalog</a>
      <a mat-button [routerLink]="['/students', studentId]">Back to profile</a>
    </app-page-header>
    <app-student-project-board [studentId]="studentId" />
  `,
})
export class StudentProjectsPage {
  readonly studentId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}
