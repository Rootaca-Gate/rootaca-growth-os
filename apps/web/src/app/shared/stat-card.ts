import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <article class="stat ra-card">
      <p class="ra-kicker">{{ label() }}</p>
      <strong>{{ value() }}</strong>
      @if (hint()) {
        <p class="hint">{{ hint() }}</p>
      }
    </article>
  `,
  styles: `
    .stat {
      padding: var(--ra-card-pad, 22px);
    }

    strong {
      display: block;
      margin-block-start: 10px;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .hint {
      margin: 8px 0 0;
      color: var(--ra-muted);
      font-size: var(--ra-body-sm, 0.875rem);
    }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input<string>();
}
