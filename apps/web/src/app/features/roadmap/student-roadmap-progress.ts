import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyState } from '../../shared/empty-state';
import { RoadmapApi } from './roadmap.api';
import { RoadmapProgressCard } from './roadmap-progress-card';
import { StudentRoadmap } from './roadmap.models';

@Component({
  selector: 'app-student-roadmap-progress',
  imports: [EmptyState, RoadmapProgressCard, MatProgressSpinnerModule],
  template: `
    <div class="wrap">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else if (error(); as message) {
        <app-empty-state title="No roadmap yet" [message]="message" />
      } @else if (roadmap(); as current) {
        <app-roadmap-progress-card [roadmap]="current" [linkToFull]="true" />
      }
    </div>
  `,
  styles: `
    .wrap {
      padding: 8px 0 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 24px 0;
    }
  `,
})
export class StudentRoadmapProgress {
  private readonly api = inject(RoadmapApi);
  readonly studentId = input.required<string>();
  readonly loading = signal(true);
  readonly roadmap = signal<StudentRoadmap | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const studentId = this.studentId();
      this.loading.set(true);
      this.api.get(studentId).subscribe({
        next: (roadmap) => {
          this.roadmap.set(roadmap);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.roadmap.set(null);
          this.error.set(this.toMessage(error));
          this.loading.set(false);
        },
      });
    });
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return 'Complete orientation and select a path to generate a personalized roadmap.';
    }
    return 'Unable to load roadmap progress.';
  }
}
