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
      min-height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 650;
      background: #eef2ef;
      color: var(--ra-text);
    }

    .badge[data-tone='success'],
    .badge[data-tone='ACTIVE'],
    .badge[data-tone='ON_TRACK'],
    .badge[data-tone='COMPLETED'] {
      background: #e8f5ee;
      color: #17664a;
    }

    .badge[data-tone='warning'],
    .badge[data-tone='PAUSED'],
    .badge[data-tone='AT_RISK'],
    .badge[data-tone='DRAFT'],
    .badge[data-tone='UPCOMING'] {
      background: #fef4e6;
      color: #9a4d0b;
    }

    .badge[data-tone='danger'],
    .badge[data-tone='BEHIND'],
    .badge[data-tone='OVERDUE'],
    .badge[data-tone='BLOCKED'],
    .badge[data-tone='WITHDRAWN'] {
      background: #fdeceb;
      color: #b42318;
    }

    .badge[data-tone='info'],
    .badge[data-tone='IN_PROGRESS'],
    .badge[data-tone='INTAKE'] {
      background: #eaf2ff;
      color: #175cd3;
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
