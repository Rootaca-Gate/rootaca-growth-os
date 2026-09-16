import { Direction } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { DirectionService } from './direction.service';

describe('DirectionService', () => {
  let service: DirectionService;
  let documentRef: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectionService);
    documentRef = TestBed.inject(DOCUMENT);
    service.setDirection('ltr');
  });

  it('defaults to LTR', () => {
    expect(service.direction()).toBe('ltr');
  });

  it('applies RTL to the document', () => {
    const direction: Direction = 'rtl';
    service.setDirection(direction);

    expect(service.direction()).toBe('rtl');
    expect(documentRef.documentElement.dir).toBe('rtl');
    expect(documentRef.documentElement.lang).toBe('ar');
  });

  it('toggles between LTR and RTL', () => {
    service.toggle();
    expect(service.direction()).toBe('rtl');

    service.toggle();
    expect(service.direction()).toBe('ltr');
    expect(documentRef.documentElement.lang).toBe('en');
  });
});
