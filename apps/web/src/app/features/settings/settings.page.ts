import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'app-settings-page',
  imports: [MatButtonModule, PageHeader, TPipe],
  template: `
    <app-page-header [title]="'settings.title' | t" [subtitle]="'settings.subtitle' | t" />
    <section class="ra-card panel">
      @if (auth.currentUser(); as user) {
        <p class="ra-kicker">{{ 'nav.admin' | t }}</p>
        <h2>{{ user.displayName }}</h2>
        <p>{{ user.email }} · {{ user.role }}</p>
      }
      <div class="actions">
        <button mat-stroked-button type="button" (click)="i18n.toggle()">
          {{ i18n.direction() === 'rtl' ? ('common.switchToEnglish' | t) : ('common.switchToArabic' | t) }}
        </button>
        <button mat-button type="button" (click)="logout()">{{ 'nav.logout' | t }}</button>
      </div>
    </section>
  `,
  styles: `
    .panel { padding: 24px; }
    .actions { display: flex; gap: 8px; margin-top: 16px; }
  `,
})
export class SettingsPage {
  readonly auth = inject(AuthService);
  readonly i18n = inject(DirectionService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
