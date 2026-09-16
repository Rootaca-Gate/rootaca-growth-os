import { Component, computed, input } from '@angular/core';
import { DashboardMonthlyPoint } from './dashboard.models';

type Dot = { x: number; y: number; value: number; label: string };

@Component({
  selector: 'app-dashboard-line-chart',
  template: `
    <figure>
      <figcaption>{{ title() }}</figcaption>
      @if (!hasValues()) {
        <p>{{ empty() }}</p>
      } @else {
        <svg viewBox="0 0 640 280" role="img" [attr.aria-label]="title()">
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
          @for (segment of paths(); track $index) {
            <path [attr.d]="segment" />
          }
          @for (dot of dots(); track dot.label) {
            <circle [attr.cx]="dot.x" [attr.cy]="dot.y" r="4.5">
              <title>{{ dot.label }} · {{ dot.value }}</title>
            </circle>
          }
          @for (point of points(); track point.month; let i = $index) {
            <text class="x" [attr.x]="x(i)" [attr.y]="height - 12">
              {{ shortLabel(point.label) }}
            </text>
          }
        </svg>
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
      fill: none;
      stroke: #0c6b56;
      stroke-width: 2.5;
      stroke-linejoin: round;
      stroke-linecap: round;
    }

    circle {
      fill: #0c6b56;
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
  `,
})
export class DashboardLineChart {
  readonly title = input.required<string>();
  readonly empty = input('No monthly reviews yet');
  readonly points = input.required<DashboardMonthlyPoint[]>();
  readonly width = 640;
  readonly height = 280;
  readonly pad = { top: 16, right: 16, bottom: 36, left: 40 };
  readonly ticks = [0, 25, 50, 75, 100];

  readonly hasValues = computed(() => this.points().some((point) => point.average !== null));

  readonly dots = computed((): Dot[] =>
    this.points().flatMap((point, index) =>
      point.average === null
        ? []
        : [
            {
              x: this.x(index),
              y: this.y(point.average),
              value: point.average,
              label: point.label,
            },
          ],
    ),
  );

  readonly paths = computed(() => {
    const segments: string[] = [];
    let current = '';
    for (const [index, point] of this.points().entries()) {
      if (point.average === null) {
        if (current) {
          segments.push(current);
          current = '';
        }
        continue;
      }
      const command = current ? 'L' : 'M';
      current += `${command}${this.x(index)} ${this.y(point.average)} `;
    }
    if (current) {
      segments.push(current.trim());
    }
    return segments;
  });

  x(index: number): number {
    const count = Math.max(1, this.points().length - 1);
    const inner = this.width - this.pad.left - this.pad.right;
    if (this.points().length <= 1) {
      return this.pad.left + inner / 2;
    }
    return this.pad.left + (inner * index) / count;
  }

  y(value: number): number {
    const inner = this.height - this.pad.top - this.pad.bottom;
    return this.pad.top + inner * (1 - Math.min(100, Math.max(0, value)) / 100);
  }

  shortLabel(value: string): string {
    return value.replace(/ \d{4}$/, '');
  }
}
