import { Component, input } from '@angular/core';

@Component({
  selector: 'app-coming-soon-panel',
  template: `
    <section class="panel">
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
    </section>
  `,
  styles: `
    .panel {
      padding: 32px 8px 16px;
    }

    h2 {
      margin: 0 0 8px;
      font-size: 1.15rem;
    }

    p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.6;
    }
  `,
})
export class ComingSoonPanel {
  readonly title = input.required<string>();
  readonly message = input(
    'This area is part of a later phase. No assessment or progress logic is implemented yet.',
  );
}
