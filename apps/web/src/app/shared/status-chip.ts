import { Component, computed, inject, input } from '@angular/core';
import { StudentStatus } from '../features/students/student.models';
import { DirectionService } from '../core/direction.service';
import { StatusBadge } from './status-badge';

@Component({
  selector: 'app-status-chip',
  imports: [StatusBadge],
  template: `<app-status-badge [tone]="status()" [text]="label()" />`,
})
export class StatusChip {
  private readonly i18n = inject(DirectionService);
  readonly status = input.required<StudentStatus>();
  readonly label = computed(() => {
    this.i18n.locale();
    return this.i18n.statusLabel(this.status());
  });
}
