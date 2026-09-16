import { Component, computed, input } from '@angular/core';

export type DashboardBar = {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  tone?: string;
};

@Component({
  selector: 'app-dashboard-bar-chart',
  template: `
    <figure>
      <figcaption>{{ title() }}</figcaption>
      @if (bars().length === 0) {
        <p>{{ empty() }}</p>
      } @else {
        <ul>
          @for (bar of bars(); track bar.key) {
            <li>
              <div class="meta">
                <span>{{ bar.label }}</span>
                <strong>{{ bar.value }}{{ bar.suffix ?? '' }}</strong>
              </div>
              <div class="track" role="img" [attr.aria-label]="bar.label + ' ' + bar.value">
                <span [style.width.%]="width(bar.value)" [class]="bar.tone ?? 'default'"></span>
              </div>
            </li>
          }
        </ul>
      }
    </figure>
  `,
  styles: `
    figure {
      margin: 0;
      padding: 16px 16px 12px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-low);
      display: grid;
      gap: 12px;
      min-height: 220px;
    }

    figcaption {
      margin: 0;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 0.86rem;
    }

    strong {
      font-variant-numeric: tabular-nums;
    }

    .track {
      height: 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--mat-sys-outline-variant) 55%, transparent);
      overflow: hidden;
    }

    .track span {
      display: block;
      height: 100%;
      border-radius: inherit;
      min-width: 0;
    }

    .default {
      background: #0c6b56;
    }

    .on-track {
      background: #0c6b56;
    }

    .at-risk {
      background: color-mix(in srgb, #c47b17 80%, #0c6b56);
    }

    .behind {
      background: color-mix(in srgb, var(--mat-sys-error) 80%, #141e1a);
    }

    .completed {
      background: #7a8a83;
    }
  `,
})
export class DashboardBarChart {
  readonly title = input.required<string>();
  readonly empty = input('No data yet');
  readonly bars = input.required<DashboardBar[]>();
  readonly max = input<number | null>(null);

  readonly ceiling = computed(() => {
    const explicit = this.max();
    if (explicit && explicit > 0) {
      return explicit;
    }
    return Math.max(1, ...this.bars().map((bar) => bar.value));
  });

  width(value: number): number {
    return Math.max(0, Math.min(100, (value / this.ceiling()) * 100));
  }
}
