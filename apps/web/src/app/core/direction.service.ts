import { Direction } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DirectionService {
  private readonly document = inject(DOCUMENT);

  readonly direction = signal<Direction>('ltr');

  setDirection(direction: Direction): void {
    this.direction.set(direction);
    this.document.documentElement.dir = direction;
    this.document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
  }

  toggle(): void {
    this.setDirection(this.direction() === 'ltr' ? 'rtl' : 'ltr');
  }
}
