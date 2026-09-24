import { Component, computed, inject, input } from '@angular/core';
import { DirectionService } from '../core/direction.service';

export type StatusTone = string;

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-tone]="tone()">{{ label() }}</span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      padding: 0 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      background: var(--ra-surface-muted, #f7f9f7);
      color: var(--ra-text);
      border: 1px solid transparent;
      white-space: nowrap;
    }

    .badge[data-tone='success'],
    .badge[data-tone='ACTIVE'],
    .badge[data-tone='ON_TRACK'],
    .badge[data-tone='COMPLETED'],
    .badge[data-tone='PUBLISHED'] {
      background: var(--ra-success-soft, #e8f5ee);
      color: var(--ra-success, #17664a);
    }

    .badge[data-tone='warning'],
    .badge[data-tone='PAUSED'],
    .badge[data-tone='AT_RISK'],
    .badge[data-tone='DRAFT'],
    .badge[data-tone='UPCOMING'],
    .badge[data-tone='PENDING'] {
      background: var(--ra-warning-soft, #fef4e6);
      color: var(--ra-warning, #b54708);
    }

    .badge[data-tone='danger'],
    .badge[data-tone='BEHIND'],
    .badge[data-tone='OVERDUE'],
    .badge[data-tone='BLOCKED'],
    .badge[data-tone='WITHDRAWN'],
    .badge[data-tone='ARCHIVED'] {
      background: var(--ra-danger-soft, #fdeceb);
      color: var(--ra-danger, #b42318);
    }

    .badge[data-tone='info'],
    .badge[data-tone='IN_PROGRESS'],
    .badge[data-tone='INTAKE'] {
      background: var(--ra-info-soft, #eaf2ff);
      color: var(--ra-info, #175cd3);
    }

    .badge[data-tone='neutral'],
    .badge[data-tone='INACTIVE'] {
      background: #eef1ef;
      color: var(--ra-muted);
    }
  `,
})
export class StatusBadge {
  private readonly i18n = inject(DirectionService);
  readonly tone = input<StatusTone>('neutral');
  readonly text = input<string>();

  readonly label = computed(() => {
    this.i18n.locale();
    const custom = this.text();
    if (custom) {
      return custom;
    }
    return this.i18n.statusLabel(this.tone());
  });
}
