import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([{ path: 'dashboard', component: LoginPage }]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('requires a valid email and password', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;

    page.submit();
    expect(page.form.invalid).toBe(true);

    page.form.setValue({ email: 'admin@rootaca.com', password: 'DevAdmin#2026' });
    page.submit();

    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({
      email: 'admin@rootaca.com',
      password: 'DevAdmin#2026',
    });
    request.flush({
      accessToken: 'access',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: '1',
        email: 'admin@rootaca.com',
        displayName: 'ROOTACA Admin',
        role: 'ADMIN',
      },
    });
    http.verify();
  });
});
