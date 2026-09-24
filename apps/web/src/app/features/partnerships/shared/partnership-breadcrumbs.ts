import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export type PartnershipBreadcrumb = {
  label: string;
  link?: string | unknown[];
};

/** Numbered partnership journey stages used in breadcrumbs (mirrors sidebar). */
export type PartnershipJourneyStage =
  | 'discovery'
  | 'institutions'
  | 'catalog'
  | 'sales'
  | 'execution'
  | 'results'
  | 'growth'
  | 'followup'
  | 'tools';

const STAGE_TITLE_KEY: Record<PartnershipJourneyStage, string> = {
  discovery: 'nav.stageDiscovery',
  institutions: 'nav.stageInstitutions',
  catalog: 'nav.stageCatalog',
  sales: 'nav.stageSales',
  execution: 'nav.stageExecution',
  results: 'nav.stageResults',
  growth: 'nav.stageGrowth',
  followup: 'nav.stageFollowUp',
  tools: 'nav.stageTools',
};

const STAGE_LIST_PATH: Partial<Record<PartnershipJourneyStage, string>> = {
  discovery: '/partnerships/leads',
  institutions: '/partnerships/institutions',
  catalog: '/partnerships/programs',
  sales: '/partnerships/proposals',
  execution: '/partnerships/sows',
  results: '/partnerships/reports',
  growth: '/partnerships/renewals',
  followup: '/partnerships/activities',
  tools: '/partnerships/import',
};

type TranslateFn = (key: string) => string;

/**
 * Journey-aware breadcrumbs:
 * Partnerships / Stage / List page / Current record
 */
export function partnershipJourneyCrumbs(
  t: TranslateFn,
  stage: PartnershipJourneyStage,
  listLabelKey: string,
  listPath: string,
  currentLabel?: string | null,
): PartnershipBreadcrumb[] {
  const crumbs: PartnershipBreadcrumb[] = [
    { label: t('nav.partnerships'), link: '/partnerships' },
    {
      label: t(STAGE_TITLE_KEY[stage]),
      link: STAGE_LIST_PATH[stage] ?? listPath,
    },
    { label: t(listLabelKey), link: listPath },
  ];
  if (currentLabel && currentLabel.trim()) {
    crumbs.push({ label: currentLabel.trim() });
  }
  return crumbs;
}

/**
 * RTL-friendly relationship breadcrumb trail for partnership detail headers.
 * Renders a RouterLink when `link` is present, otherwise plain text (used for
 * the current page). The chevron separator flips automatically under RTL via
 * the logical `rotate` on the icon inside a `dir`-aware container.
 */
@Component({
  selector: 'app-partnership-breadcrumbs',
  imports: [RouterLink, MatIconModule],
  template: `
    <nav class="crumbs" aria-label="breadcrumb">
      @for (item of items(); track $index; let last = $last) {
        @if (item.link && !last) {
          <a class="crumbs__item" [routerLink]="item.link">{{ item.label }}</a>
        } @else {
          <span
            class="crumbs__item"
            [class.crumbs__item--current]="last"
            [attr.aria-current]="last ? 'page' : null"
            >{{ item.label }}</span
          >
        }
        @if (!last) {
          <mat-icon class="crumbs__sep" aria-hidden="true">chevron_left</mat-icon>
        }
      }
    </nav>
  `,
  styles: `
    .crumbs {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 6px;
      margin-block-end: 12px;
      font-size: var(--ra-body-sm, 0.875rem);
      color: var(--ra-muted);
    }

    .crumbs__item {
      color: var(--ra-muted);
      text-decoration: none;
      max-width: 20rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 150ms ease;
    }

    a.crumbs__item:hover {
      color: var(--ra-accent);
      text-decoration: underline;
    }

    .crumbs__item--current {
      color: var(--ra-text);
      font-weight: 600;
    }

    .crumbs__sep {
      width: 16px;
      height: 16px;
      font-size: 16px;
      color: var(--ra-muted);
      opacity: 0.6;
    }

    :host-context([dir='ltr']) .crumbs__sep {
      transform: rotate(180deg);
    }
  `,
})
export class PartnershipBreadcrumbs {
  readonly items = input.required<PartnershipBreadcrumb[]>();
}
