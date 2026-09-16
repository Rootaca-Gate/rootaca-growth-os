import { Component, inject, input } from '@angular/core';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { Placement } from './placement.models';

@Component({
  selector: 'app-path-recommendation-card',
  imports: [TPipe],
  template: `
    @if (placement(); as current) {
      <section class="card">
        <header>
          <p class="kicker">{{ 'students.pathRecommendation' | t }}</p>
          <h2>{{ current.finalPath.name }}</h2>
          @if (current.finalPath.id !== current.systemPath.id) {
            <p class="override">{{ 'catalogs.systemRecommended' | t:{ name: current.systemPath.name } }}</p>
          }
        </header>
        <div class="grid">
          <article>
            <h3>{{ 'students.recommendedPath' | t }}</h3>
            <p>{{ current.finalPath.description }}</p>
            <ul>
              @for (reason of current.recommendationReasons; track reason) {
                <li>{{ reason }}</li>
              }
            </ul>
          </article>
          <article>
            <h3>{{ 'students.alternativePath' | t }}</h3>
            <p>{{ current.alternativePath.name }} — {{ current.alternativePath.description }}</p>
            <ul>
              @for (reason of current.alternativeReasons; track reason) {
                <li>{{ reason }}</li>
              }
            </ul>
          </article>
        </div>
      </section>
    }
  `,
  styles: `
    .card {
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
      margin: 8px 0 0;
      font-size: 1.5rem;
    }

    .override,
    p,
    li {
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 16px;
    }

    article {
      padding: 14px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-lowest);
    }

    h3 {
      margin: 0 0 6px;
      font-size: 0.95rem;
    }

    ul {
      margin: 10px 0 0;
      padding-inline-start: 18px;
    }

    @media (max-width: 720px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class PathRecommendationCard {
  readonly i18n = inject(DirectionService);
  readonly placement = input<Placement | null | undefined>();
}
