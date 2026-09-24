import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  template: `
    <div class="ra-loading" [attr.aria-label]="label()" role="status">
      @if (variant() === 'table') {
        <div class="ra-skeleton ra-skeleton--table"></div>
      } @else if (variant() === 'cards') {
        @for (row of placeholders(); track $index) {
          <div class="ra-skeleton ra-skeleton--block"></div>
        }
      } @else {
        @for (row of placeholders(); track $index) {
          <div class="ra-skeleton" [style.height.px]="height()"></div>
        }
      }
    </div>
  `,
})
export class LoadingSkeleton {
  readonly rows = input(6);
  readonly height = input(18);
  readonly label = input('Loading');
  readonly variant = input<'lines' | 'table' | 'cards'>('lines');
  readonly placeholders = computed(() => Array.from({ length: this.rows() }));
}
