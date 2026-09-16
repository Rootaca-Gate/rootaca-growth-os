import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TPipe } from '../core/i18n/t.pipe';

@Component({
  selector: 'app-error-state',
  imports: [MatButtonModule, TPipe],
  template: `
    <div class="error ra-card" role="alert">
      <h2>{{ title() || ('errors.pageTitle' | t) }}</h2>
      <p>{{ message() || ('errors.connection' | t) }}</p>
      <button mat-flat-button color="primary" type="button" (click)="retry.emit()">
        {{ 'common.retry' | t }}
      </button>
    </div>
  `,
  styles: `
    .error {
      padding: 36px 24px;
      text-align: center;
    }

    h2 {
      margin: 0 0 8px;
      font-size: 1.15rem;
    }

    p {
      margin: 0 auto 16px;
      max-width: 34rem;
      color: var(--ra-muted);
    }
  `,
})
export class ErrorState {
  readonly title = input<string>();
  readonly message = input<string>();
  readonly retry = output<void>();
}
