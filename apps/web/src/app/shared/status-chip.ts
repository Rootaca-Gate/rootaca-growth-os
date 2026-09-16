import { Component, input } from '@angular/core';
import { STATUS_LABELS } from '../features/students/student.labels';
import { StudentStatus } from '../features/students/student.models';

@Component({
  selector: 'app-status-chip',
  template: `<span class="chip" [attr.data-status]="status()">{{ label }}</span>`,
  styles: `
    .chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      background: var(--mat-sys-surface-container-high);
    }

    .chip[data-status='ACTIVE'] {
      background: color-mix(in srgb, var(--mat-sys-primary) 18%, white);
    }

    .chip[data-status='PAUSED'] {
      background: color-mix(in srgb, #c47b17 18%, white);
    }

    .chip[data-status='COMPLETED'] {
      background: color-mix(in srgb, #2f6fed 16%, white);
    }

    .chip[data-status='WITHDRAWN'] {
      background: color-mix(in srgb, var(--mat-sys-error) 14%, white);
    }
  `,
})
export class StatusChip {
  readonly status = input.required<StudentStatus>();

  get label(): string {
    return STATUS_LABELS[this.status()];
  }
}
