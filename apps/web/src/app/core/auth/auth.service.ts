import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  firstValueFrom,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, CurrentUser } from './auth.models';

const ACCESS_KEY = 'rootaca.auth.accessToken';
const REFRESH_KEY = 'rootaca.auth.refreshToken';
const USER_KEY = 'rootaca.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiBaseUrl;
  private refreshInFlight$: Observable<AuthResponse> | null = null;
  private hydratePromise: Promise<void> | null = null;

  readonly accessToken = signal<string | null>(this.readAccessToken());
  readonly currentUser = signal<CurrentUser | null>(this.readUser());
  readonly ready = signal(false);
  readonly isAuthenticated = computed(() => !!this.accessToken() && !!this.currentUser());

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/auth/login`, { email, password })
      .pipe(tap((session) => this.persist(session)));
  }

  logout(): Observable<void> {
    const refreshToken = this.readRefreshToken();
    const request$ = refreshToken
      ? this.http.post<{ success: true }>(`${this.api}/auth/logout`, { refreshToken }).pipe(
          map(() => undefined),
          catchError(() => of(undefined)),
        )
      : of(undefined);

    return request$.pipe(finalize(() => this.clearSession()));
  }

  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.api}/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.writeUser(user);
      }),
    );
  }

  refreshSession(): Observable<AuthResponse> {
    const refreshToken = this.readRefreshToken();

    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token'));
    }

    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<AuthResponse>(`${this.api}/auth/refresh`, { refreshToken })
        .pipe(
          tap((session) => this.persist(session)),
          finalize(() => {
            this.refreshInFlight$ = null;
          }),
          shareReplay(1),
        );
    }

    return this.refreshInFlight$;
  }

  hydrate(): Promise<void> {
    this.hydratePromise ??= this.restoreSession();
    return this.hydratePromise;
  }

  isAuthEndpoint(url: string): boolean {
    return (
      url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
    );
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private async restoreSession(): Promise<void> {
    const accessToken = this.readAccessToken();
    const refreshToken = this.readRefreshToken();
    const user = this.readUser();

    if (accessToken && user) {
      this.accessToken.set(accessToken);
      this.currentUser.set(user);
    }

    try {
      if (accessToken) {
        await firstValueFrom(this.me());
      } else if (refreshToken) {
        await firstValueFrom(this.refreshSession());
      }
    } catch {
      if (refreshToken && accessToken) {
        try {
          await firstValueFrom(this.refreshSession());
        } catch {
          this.clearSession();
        }
      } else if (!accessToken) {
        this.clearSession();
      }
    } finally {
      this.ready.set(true);
    }
  }

  private persist(session: AuthResponse): void {
    this.accessToken.set(session.accessToken);
    this.currentUser.set(session.user);
    localStorage.setItem(ACCESS_KEY, session.accessToken);
    localStorage.setItem(REFRESH_KEY, session.refreshToken);
    this.writeUser(session.user);
  }

  private readAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  private readRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private readUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }

  private writeUser(user: CurrentUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}
