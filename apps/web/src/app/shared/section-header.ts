import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  template: `
    <header class="section">
      <div>
        <h2>{{ title() }}</h2>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </div>
      <div class="actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .section {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-end;
      margin-block-end: 14px;
    }

    h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 650;
    }

    p {
      margin: 4px 0 0;
      color: var(--ra-muted);
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  `,
})
export class SectionHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
