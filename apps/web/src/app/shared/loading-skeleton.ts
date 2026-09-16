import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  template: `
    <div class="ra-loading" [attr.aria-label]="label()">
      @for (row of placeholders(); track $index) {
        <div class="ra-skeleton" [style.height.px]="height()"></div>
      }
    </div>
  `,
})
export class LoadingSkeleton {
  readonly rows = input(6);
  readonly height = input(18);
  readonly label = input('Loading');
  readonly placeholders = computed(() => Array.from({ length: this.rows() }));
}
