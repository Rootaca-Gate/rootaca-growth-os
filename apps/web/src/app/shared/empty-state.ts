import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  imports: [MatButtonModule],
  template: `
    <div class="empty ra-card">
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
      <div class="actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .empty {
      padding: 40px 24px;
      text-align: center;
    }

    h2 {
      margin: 0 0 8px;
      font-size: 1.15rem;
    }

    p {
      margin: 0 auto 16px;
      max-width: 36rem;
      color: var(--ra-muted);
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
}
