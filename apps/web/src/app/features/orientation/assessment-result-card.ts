import { Component, input } from '@angular/core';
import { PathRecommendationCard } from '../placement/path-recommendation-card';
import { AssessmentResult } from './orientation.models';

@Component({
  selector: 'app-assessment-result-card',
  imports: [PathRecommendationCard],
  template: `
    @if (result(); as current) {
      <section class="result">
        <header>
          <p class="kicker">Student assessment result</p>
          <h2>{{ current.overallScore }}/100</h2>
          @if (current.placement; as placement) {
            <p class="level">Current level · {{ placement.finalLevel.name }}</p>
          }
          <p>{{ current.summary }}</p>
        </header>
        <div class="grid">
          @for (category of current.categoryScores; track category.code) {
            <article>
              <h3>{{ category.name }}</h3>
              <p>{{ category.score }}/100 · {{ category.weightPercent }}% weight</p>
            </article>
          }
        </div>
        @if (current.skillScores.length) {
          <ul>
            @for (skill of current.skillScores; track skill.key) {
              <li>{{ skill.key }} · {{ skill.score }}</li>
            }
          </ul>
        }
        <app-path-recommendation-card [placement]="current.placement" />
      </section>
    }
  `,
  styles: `
    .result {
      padding: 20px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-low);
    }

    .kicker {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
    }

    h2 {
      margin: 8px 0;
      font-size: 2rem;
    }

    .level {
      margin: 0 0 8px;
      font-weight: 600;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    article,
    ul {
      margin: 0;
    }

    article {
      padding: 12px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-lowest);
    }

    h3 {
      margin: 0 0 4px;
      font-size: 0.95rem;
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      padding: 16px 0 0;
      list-style: none;
      color: var(--mat-sys-on-surface-variant);
    }

    app-path-recommendation-card {
      display: block;
      margin-top: 16px;
    }
  `,
})
export class AssessmentResultCard {
  readonly result = input.required<AssessmentResult | null | undefined>();
}
