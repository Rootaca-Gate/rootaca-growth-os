import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OrientationApi } from './orientation.api';

describe('OrientationApi', () => {
  let api: OrientationApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(OrientationApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('creates a session', () => {
    api.create('11111111-1111-4111-8111-111111111111').subscribe();
    const request = http.expectOne('/api/orientation-sessions');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ studentId: '11111111-1111-4111-8111-111111111111' });
    request.flush({ id: 'session' });
  });

  it('completes a session', () => {
    api.complete('22222222-2222-4222-8222-222222222222').subscribe();
    const request = http.expectOne(
      '/api/orientation-sessions/22222222-2222-4222-8222-222222222222/complete',
    );
    expect(request.request.method).toBe('POST');
    request.flush({ status: 'COMPLETED' });
  });
});
