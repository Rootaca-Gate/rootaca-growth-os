import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty">
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      padding: 48px 24px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }

    h2 {
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface);
      font-size: 1.25rem;
    }

    p {
      margin: 0 0 16px;
    }
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
