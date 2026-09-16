import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { DirectionService } from '../core/direction.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly directionService = inject(DirectionService);
  readonly auth = inject(AuthService);
  readonly direction = this.directionService.direction;

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
