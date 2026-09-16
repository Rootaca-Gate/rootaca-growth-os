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
      padding: 18px 20px;
    }

    strong {
      display: block;
      margin-top: 10px;
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      font-variant-numeric: tabular-nums;
    }

    .hint {
      margin: 8px 0 0;
      color: var(--ra-muted);
      font-size: 0.88rem;
    }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input<string>();
}
