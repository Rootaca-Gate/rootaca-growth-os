import { Component, computed, input } from '@angular/core';
import { GrowthChart } from './progress.models';

type PlottedSeries = {
  key: string;
  label: string;
  color: string;
  path: string;
  dots: Array<{ x: number; y: number; value: number; label: string }>;
};

const COLORS = [
  'var(--mat-sys-primary)',
  'var(--mat-sys-tertiary)',
  'var(--mat-sys-secondary)',
  'color-mix(in srgb, var(--mat-sys-primary) 55%, var(--mat-sys-tertiary))',
  'color-mix(in srgb, var(--mat-sys-error) 55%, var(--mat-sys-tertiary))',
  'color-mix(in srgb, var(--mat-sys-primary) 35%, black)',
];

@Component({
  selector: 'app-growth-chart',
  template: `
    <figure>
      <figcaption>{{ chart().title }}</figcaption>
      @if (chart().labels.length === 0) {
        <p>No history yet.</p>
      } @else {
        <svg viewBox="0 0 640 280" role="img" [attr.aria-label]="chart().title">
          @for (tick of ticks; track tick) {
            <line
              class="grid"
              [attr.x1]="pad.left"
              [attr.x2]="width - pad.right"
              [attr.y1]="y(tick)"
              [attr.y2]="y(tick)"
            />
            <text class="y" [attr.x]="pad.left - 8" [attr.y]="y(tick) + 4">{{ tick }}</text>
          }
          @for (item of plotted(); track item.key) {
            @if (item.path) {
              <path [attr.d]="item.path" [attr.stroke]="item.color" fill="none" />
            }
            @for (dot of item.dots; track $index) {
              <circle [attr.cx]="dot.x" [attr.cy]="dot.y" r="4.5" [attr.fill]="item.color">
                <title>{{ item.label }} · {{ dot.label }} · {{ dot.value }}</title>
              </circle>
            }
          }
          @for (label of chart().labels; track label; let i = $index) {
            <text class="x" [attr.x]="x(i)" [attr.y]="height - 12">{{ shortLabel(label) }}</text>
          }
        </svg>
        <ul>
          @for (item of plotted(); track item.key) {
            <li>
              <span [style.background]="item.color"></span>
              {{ item.label }}
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
      gap: 10px;
    }

    figcaption {
      margin: 0;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    svg {
      width: 100%;
      height: auto;
      display: block;
    }

    line.grid {
      stroke: color-mix(in srgb, var(--mat-sys-outline-variant) 70%, transparent);
      stroke-width: 1;
    }

    path {
      stroke-width: 2.5;
      stroke-linejoin: round;
      stroke-linecap: round;
    }

    text {
      fill: var(--mat-sys-on-surface-variant);
      font-size: 11px;
    }

    text.y {
      text-anchor: end;
    }

    text.x {
      text-anchor: middle;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 10px 16px;
    }

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      color: var(--mat-sys-on-surface-variant);
    }

    li span {
      width: 10px;
      height: 10px;
      border-radius: 999px;
    }
  `,
})
export class GrowthChartComponent {
  readonly chart = input.required<GrowthChart>();
  readonly width = 640;
  readonly height = 280;
  readonly pad = { top: 16, right: 16, bottom: 36, left: 40 };
  readonly ticks = [0, 25, 50, 75, 100];

  readonly plotted = computed((): PlottedSeries[] => {
    const chart = this.chart();
    return chart.series.map((series, index) => {
      const dots = series.points.map((value, pointIndex) => ({
        x: this.x(pointIndex),
        y: this.y(value),
        value,
        label: chart.labels[pointIndex] ?? '',
      }));
      return {
        key: series.key,
        label: series.label,
        color: COLORS[index % COLORS.length],
        path: dots
          .map((dot, dotIndex) => `${dotIndex === 0 ? 'M' : 'L'}${dot.x} ${dot.y}`)
          .join(' '),
        dots,
      };
    });
  });

  x(index: number): number {
    const count = Math.max(1, this.chart().labels.length - 1);
    const inner = this.width - this.pad.left - this.pad.right;
    if (this.chart().labels.length <= 1) {
      return this.pad.left + inner / 2;
    }
    return this.pad.left + (inner * index) / count;
  }

  y(value: number): number {
    const inner = this.height - this.pad.top - this.pad.bottom;
    return this.pad.top + inner * (1 - Math.min(100, Math.max(0, value)) / 100);
  }

  shortLabel(value: string): string {
    return value.slice(5);
  }
}
