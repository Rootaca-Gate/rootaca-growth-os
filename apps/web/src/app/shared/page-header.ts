import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div class="page-header__copy">
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
      gap: 16px 24px;
      margin-block-end: var(--ra-section-gap, 28px);
    }

    .page-header__copy {
      flex: 1 1 240px;
      min-width: 0;
    }

    h1 {
      margin: 4px 0 0;
      font-size: var(--ra-title-page, 1.625rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.2;
      color: var(--ra-text);
    }

    .subtitle {
      margin: 8px 0 0;
      max-width: 42rem;
      color: var(--ra-muted);
      font-size: var(--ra-body-sm, 0.875rem);
      font-weight: 400;
      line-height: 1.55;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    @media (max-width: 720px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .actions {
        justify-content: stretch;
      }

      .actions ::ng-deep a,
      .actions ::ng-deep button {
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
