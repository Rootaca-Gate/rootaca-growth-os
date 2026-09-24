import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-filter-chip',
  imports: [MatIconModule],
  template: `
    <span class="ra-filter-chip">
      <span class="ra-filter-chip__text">{{ label() }}</span>
      <button
        type="button"
        class="ra-filter-chip__remove"
        [attr.aria-label]="removeLabel()"
        (click)="removed.emit()"
      >
        <mat-icon>close</mat-icon>
      </button>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .ra-filter-chip__text {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ra-filter-chip__remove mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
  `,
})
export class FilterChip {
  readonly label = input.required<string>();
  readonly removeLabel = input('Remove filter');
  readonly removed = output<void>();
}
