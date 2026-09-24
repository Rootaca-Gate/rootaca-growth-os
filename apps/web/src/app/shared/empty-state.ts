import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="empty ra-card">
      <div class="empty__icon" aria-hidden="true">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
      <div class="actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .empty {
      padding: 48px 28px;
      text-align: center;
    }

    .empty__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      margin-block-end: 16px;
      border-radius: 14px;
      background: var(--ra-accent-soft);
      color: var(--ra-accent);
    }

    .empty__icon mat-icon {
      width: 28px;
      height: 28px;
      font-size: 28px;
    }

    h2 {
      margin: 0 0 8px;
      font-size: var(--ra-title-card, 1.05rem);
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    p {
      margin: 0 auto 20px;
      max-width: 28rem;
      color: var(--ra-muted);
      font-size: var(--ra-body-sm, 0.875rem);
      line-height: 1.55;
    }

    .actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly icon = input('inbox');
}
