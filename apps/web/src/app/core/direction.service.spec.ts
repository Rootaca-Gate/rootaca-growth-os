import { Direction } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { LOCALE_STORAGE_KEY } from './i18n/messages';
import { DirectionService } from './direction.service';

describe('DirectionService', () => {
  let service: DirectionService;
  let documentRef: Document;

  beforeEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectionService);
    documentRef = TestBed.inject(DOCUMENT);
    service.setLocale('en');
  });

  afterEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
  });

  it('defaults to LTR English', () => {
    expect(service.direction()).toBe('ltr');
    expect(service.locale()).toBe('en');
  });

  it('applies RTL Arabic to the document and stores it', () => {
    const direction: Direction = 'rtl';
    service.setDirection(direction);

    expect(service.direction()).toBe('rtl');
    expect(service.locale()).toBe('ar');
    expect(documentRef.documentElement.dir).toBe('rtl');
    expect(documentRef.documentElement.lang).toBe('ar');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ar');
  });

  it('toggles between LTR and RTL', () => {
    service.toggle();
    expect(service.direction()).toBe('rtl');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ar');

    service.toggle();
    expect(service.direction()).toBe('ltr');
    expect(documentRef.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('restores the last language from storage', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'ar');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(DirectionService);
    expect(restored.locale()).toBe('ar');
    expect(restored.direction()).toBe('rtl');
  });
});
