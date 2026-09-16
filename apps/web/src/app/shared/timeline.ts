import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DirectionService } from '../core/direction.service';

export type TimelineItem = {
  title: string;
  occurredAt: string;
  href?: string;
};

@Component({
  selector: 'app-timeline',
  imports: [DatePipe, RouterLink],
  template: `
    <ol class="timeline">
      @for (item of items(); track $index) {
        <li>
          <span class="dot"></span>
          <div>
            @if (item.href) {
              <a [routerLink]="item.href">{{ i18n.activityTitle(item.title) }}</a>
            } @else {
              <strong>{{ i18n.activityTitle(item.title) }}</strong>
            }
            <time>{{ item.occurredAt | date: 'mediumDate' : undefined : i18n.locale() }}</time>
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    .timeline {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 14px;
    }

    li {
      display: grid;
      grid-template-columns: 12px 1fr;
      gap: 12px;
    }

    .dot {
      width: 10px;
      height: 10px;
      margin-top: 6px;
      border-radius: 50%;
      background: var(--ra-accent);
    }

    a,
    strong {
      display: block;
      color: var(--ra-text);
      text-decoration: none;
      font-weight: 600;
    }

    time {
      color: var(--ra-muted);
      font-size: 0.82rem;
    }
  `,
})
export class Timeline {
  readonly i18n = inject(DirectionService);
  readonly items = input.required<TimelineItem[]>();
}
