import { Direction, Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { EventEmitter, Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { AppLocale, LOCALE_STORAGE_KEY, MESSAGES } from './i18n/messages';

function readStoredLocale(): AppLocale {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return value === 'ar' || value === 'en' ? value : 'en';
  } catch {
    return 'en';
  }
}

function lookup(source: unknown, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
  return typeof value === 'string' ? value : undefined;
}

@Injectable({ providedIn: 'root' })
export class DirectionService implements Directionality, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly dateAdapter = inject(DateAdapter, { optional: true });

  readonly locale = signal<AppLocale>(readStoredLocale());
  readonly direction = computed<Direction>(() => (this.locale() === 'ar' ? 'rtl' : 'ltr'));
  readonly valueSignal = signal<Direction>(readStoredLocale() === 'ar' ? 'rtl' : 'ltr');
  readonly copy = computed(() => MESSAGES[this.locale()]);
  readonly change = new EventEmitter<Direction>();

  get value(): Direction {
    return this.valueSignal();
  }

  constructor() {
    this.apply(this.locale());
  }

  ngOnDestroy(): void {
    this.change.complete();
  }

  setLocale(locale: AppLocale): void {
    if (this.locale() === locale) {
      this.apply(locale);
      return;
    }
    this.locale.set(locale);
    this.valueSignal.set(locale === 'ar' ? 'rtl' : 'ltr');
    this.apply(locale);
    this.change.emit(this.valueSignal());
  }

  setDirection(direction: Direction): void {
    this.setLocale(direction === 'rtl' ? 'ar' : 'en');
  }

  toggle(): void {
    this.setLocale(this.locale() === 'ar' ? 'en' : 'ar');
  }

  t(key: string, params?: Record<string, string | number>): string {
    const raw = lookup(this.copy(), key) ?? key;
    if (!params) {
      return raw;
    }
    return Object.entries(params).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      raw,
    );
  }

  statusLabel(code: string): string {
    return lookup(this.copy().status, code) ?? code.replaceAll('_', ' ').toLowerCase();
  }

  levelLabel(code: string): string {
    return lookup(this.copy().levels, code) ?? code;
  }

  pathLabel(code: string): string {
    return lookup(this.copy().paths, code) ?? code;
  }

  namedLevel(name: string): string {
    const match = Object.entries(MESSAGES.en.levels).find(([, label]) => label === name);
    return match ? this.levelLabel(match[0]) : name;
  }

  namedPath(name: string): string {
    const match = Object.entries(MESSAGES.en.paths).find(([, label]) => label === name);
    return match ? this.pathLabel(match[0]) : name;
  }

  interestLabel(name: string): string {
    return lookup(this.copy().interests, name) ?? name;
  }

  experienceLabel(code: string): string {
    return lookup(this.copy().experience, code) ?? code;
  }

  englishLabel(code: string): string {
    return lookup(this.copy().english, code) ?? code;
  }

  sortLabel(code: string): string {
    return lookup(this.copy().sort, code) ?? code;
  }

  kpiCategoryLabel(code: string): string {
    return lookup(this.copy().kpiCategory, code) ?? code;
  }

  frequencyLabel(code: string): string {
    return lookup(this.copy().frequency, code) ?? code;
  }

  stageLabel(code: string): string {
    if (code === 'STUDENT_PROFILE') {
      return this.t('orientation.studentProfile');
    }
    if (code === 'TECHNICAL_CHECK') {
      return this.t('orientation.technicalCheck');
    }
    if (code === 'PROBLEM_SOLVING') {
      return this.t('orientation.problemSolving');
    }
    if (code === 'INTEREST_PATH') {
      return this.t('orientation.interestPath');
    }
    if (code === 'SUMMARY') {
      return this.t('orientation.summary');
    }
    return code;
  }

  activityLabel(label: string): string {
    if (label === 'Today' || label === MESSAGES.en.activity.today) {
      return this.t('activity.today');
    }
    if (label === 'Yesterday' || label === MESSAGES.en.activity.yesterday) {
      return this.t('activity.yesterday');
    }
    if (label === 'No recent activity' || label === MESSAGES.en.activity.noRecent) {
      return this.t('activity.noRecent');
    }
    const days = label.match(/^(\d+) days ago$/);
    if (days) {
      return this.t('activity.daysAgo', { count: days[1] ?? '0' });
    }
    return label;
  }

  activityTitle(title: string): string {
    const rules: Array<[string, string]> = [
      [' completed orientation', 'activity.completedOrientation'],
      [' KPI updated', 'activity.kpiUpdated'],
      [' was assigned a project', 'activity.projectAssigned'],
      [' progress reviewed', 'activity.progressReviewed'],
    ];
    for (const [suffix, key] of rules) {
      if (title.endsWith(suffix)) {
        const name = title.slice(0, -suffix.length);
        return `${name} ${this.t(key)}`;
      }
    }
    if (title === 'Progress reviewed' || title === MESSAGES.en.activity.progressReviewed) {
      return this.t('activity.progressReviewed');
    }
    return title;
  }

  private apply(locale: AppLocale): void {
    const direction: Direction = locale === 'ar' ? 'rtl' : 'ltr';
    this.valueSignal.set(direction);
    this.document.documentElement.dir = direction;
    this.document.documentElement.lang = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore quota / private mode */
    }
    this.dateAdapter?.setLocale(locale === 'ar' ? 'ar' : 'en-GB');
  }
}
