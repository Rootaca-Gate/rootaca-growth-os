import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AuthResponse } from './auth.models';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const session: AuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'admin@rootaca.com',
      displayName: 'ROOTACA Admin',
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('stores the session after login', () => {
    let result: AuthResponse | undefined;
    service.login('admin@rootaca.com', 'DevAdmin#2026').subscribe((value) => {
      result = value;
    });

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush(session);

    expect(result?.accessToken).toBe('access-token');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.role).toBe('ADMIN');
    expect(localStorage.getItem('rootaca.auth.refreshToken')).toBe('refresh-token');
  });

  it('clears the session on logout', () => {
    service.login('admin@rootaca.com', 'DevAdmin#2026').subscribe();
    http.expectOne('/api/auth/login').flush(session);

    service.logout().subscribe();
    http.expectOne('/api/auth/logout').flush({ success: true });

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('rootaca.auth.accessToken')).toBeNull();
  });
});
