import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { DirectionService } from '../core/direction.service';
import { TPipe } from '../core/i18n/t.pipe';
import { APP_NAV } from './nav';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
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
  readonly isMobile = toSignal(
    this.breakpoints.observe('(max-width: 1024px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  readonly sidenavMode = computed(() => (this.isMobile() ? 'over' : 'side'));

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
