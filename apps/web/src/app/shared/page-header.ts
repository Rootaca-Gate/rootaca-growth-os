import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div>
        @if (eyebrow()) {
          <p class="ra-kicker">{{ eyebrow() }}</p>
        }
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-block-end: 28px;
    }

    h1 {
      margin: 4px 0 0;
      font-size: 1.75rem;
      font-weight: 650;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }

    .subtitle {
      margin: 8px 0 0;
      max-width: 46rem;
      color: var(--ra-muted);
      line-height: 1.5;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    @media (max-width: 720px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .page-header > div:first-child {
        flex: 1 1 auto;
      }
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly eyebrow = input<string>();
}
