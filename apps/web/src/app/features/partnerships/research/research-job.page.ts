import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import { ResearchJob } from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';

@Component({
  selector: 'app-research-job-page',
  imports: [RouterLink, MatButtonModule, PageHeader, ErrorState, LoadingSkeleton, TPipe],
  template: `
    <app-page-header
      [title]="job()?.name || ('partnerships.researchJobs' | t)"
      [subtitle]="'partnerships.researchCoverageNote' | t"
    >
      <a mat-stroked-button routerLink="/partnerships/research">{{ 'common.back' | t }}</a>
    </app-page-header>

    @if (loading()) {
      <app-loading-skeleton [rows]="6" [label]="'partnerships.researchLoading' | t" />
    } @else if (errorMessage(); as message) {
      <app-error-state
        [title]="'partnerships.researchErrorTitle' | t"
        [message]="message"
        (retry)="load()"
      />
    } @else if (job(); as row) {
      <section class="ra-card">
        <p>{{ 'common.status' | t }}: {{ row.status }}</p>
        <p>{{ 'partnerships.governorate' | t }}: {{ row.governorate || '—' }}</p>
        <p>{{ 'partnerships.city' | t }}: {{ row.city || '—' }}</p>
        <p>{{ row.providerNote }}</p>
        @if (row.errorMessage) {
          <p class="error">{{ row.errorMessage }}</p>
        }
        @if (row.statistics) {
          <ul>
            <li>{{ 'partnerships.researchQueriesPlanned' | t }}: {{ row.statistics['queriesPlanned'] }}</li>
            <li>{{ 'partnerships.researchQueriesExecuted' | t }}: {{ row.statistics['queriesExecuted'] }}</li>
            <li>{{ 'partnerships.researchResults' | t }}: {{ row.statistics['resultsDiscovered'] }}</li>
            <li>{{ 'partnerships.researchCandidatesCreated' | t }}: {{ row.statistics['candidatesCreated'] || row.statistics['uniqueCandidates'] }}</li>
            <li>{{ 'partnerships.researchDuplicatesDetected' | t }}: {{ row.statistics['duplicatesDetected'] || row.statistics['duplicates'] }}</li>
            <li>{{ 'partnerships.researchErrors' | t }}: {{ row.statistics['errorsCount'] || 0 }}</li>
          </ul>
        }
        <h3>{{ 'partnerships.researchQueries' | t }}</h3>
        <ol>
          @for (query of row.queries; track query.text) {
            <li>[{{ query.language }}] {{ query.text }}</li>
          }
        </ol>
        @if (permissions.canWrite()) {
          <button mat-flat-button color="primary" type="button" (click)="run()">
            {{ 'partnerships.researchRun' | t }}
          </button>
        }
      </section>
    }
  `,
  styles: `
    .ra-card { padding: 1.25rem; display: grid; gap: 0.5rem; }
    .error { color: var(--ra-danger, #b42318); }
  `,
})
export class ResearchJobPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly job = signal<ResearchJob | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Missing job id');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.api.getResearchJob(id).subscribe({
      next: (result) => {
        this.job.set(result);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  run(): void {
    const id = this.job()?.id;
    if (!id) return;
    this.api.runResearchJob(id).subscribe({
      next: (result) => this.job.set(result),
      error: (error: unknown) => {
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }
}
