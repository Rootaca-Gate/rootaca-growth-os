import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="progress">
      <span class="fill" [style.width.%]="safeValue()"></span>
    </div>
  `,
  styles: `
    .progress {
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: #e8eee9;
    }

    .fill {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--ra-accent);
    }
  `,
})
export class ProgressBar {
  readonly value = input<number | null>(null);

  safeValue(): number {
    const value = this.value();
    if (value === null || Number.isNaN(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, value));
  }
}
