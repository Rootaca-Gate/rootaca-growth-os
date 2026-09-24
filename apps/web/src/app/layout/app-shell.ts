import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { DirectionService } from '../core/direction.service';
import { TPipe } from '../core/i18n/t.pipe';
import {
  APP_NAV,
  PARTNERSHIP_JOURNEY_STEPS,
  findActiveNavSection,
  isNavItemActive,
  NavSection,
} from './nav';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TPipe,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly directionService = inject(DirectionService);
  private readonly breakpoints = inject(BreakpointObserver);
  readonly auth = inject(AuthService);
  readonly i18n = this.directionService;
  readonly direction = this.directionService.direction;
  readonly nav = APP_NAV;
  readonly journeySteps = PARTNERSHIP_JOURNEY_STEPS;
  readonly sidenav = viewChild<MatSidenav>('sidenav');

  readonly isMobile = toSignal(
    this.breakpoints.observe('(max-width: 1024px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  readonly sidenavMode = computed(() => (this.isMobile() ? 'over' : 'side'));

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Expanded section keys — all sections open by default. */
  private readonly expandedKeys = signal<Set<string>>(
    new Set(APP_NAV.map((section) => section.titleKey)),
  );

  constructor() {
    // Keep the active section open when navigating (in case it was collapsed).
    effect(() => {
      const active = findActiveNavSection(this.currentUrl());
      if (!active) {
        return;
      }
      untracked(() => {
        this.expandedKeys.update((current) => {
          if (current.has(active.titleKey)) {
            return current;
          }
          const next = new Set(current);
          next.add(active.titleKey);
          return next;
        });
      });
    });
  }

  isSectionExpanded(section: NavSection): boolean {
    return this.expandedKeys().has(section.titleKey);
  }

  isItemActive(path: string, exact?: boolean): boolean {
    return isNavItemActive(this.currentUrl(), { path, exact });
  }

  toggleSection(section: NavSection, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.expandedKeys.update((current) => {
      const next = new Set(current);
      if (next.has(section.titleKey)) {
        next.delete(section.titleKey);
      } else {
        next.add(section.titleKey);
      }
      return next;
    });
  }

  onNavLinkClick(): void {
    if (this.isMobile()) {
      void this.sidenav()?.close();
    }
  }

  toggleDirection(): void {
    this.directionService.toggle();
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
