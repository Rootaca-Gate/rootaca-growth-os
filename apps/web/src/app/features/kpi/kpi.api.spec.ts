import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { KpiApi } from './kpi.api';

describe('KpiApi', () => {
  let api: KpiApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(KpiApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads a student KPI dashboard', () => {
    api.getDashboard('11111111-1111-4111-8111-111111111111').subscribe((dashboard) => {
      expect(dashboard.overallPercent).toBe(40);
    });
    const request = http.expectOne('/api/students/11111111-1111-4111-8111-111111111111/kpis');
    expect(request.request.method).toBe('GET');
    request.flush({ overallPercent: 40, items: [] });
  });

  it('lists KPI definitions', () => {
    api.listDefinitions().subscribe((items) => {
      expect(items.length).toBe(1);
    });
    const request = http.expectOne('/api/kpis');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'kpi-def', name: 'Coding Problems' }]);
  });

  it('records an actual value', () => {
    api
      .record('11111111-1111-4111-8111-111111111111', 'kpi-1', { actual: 6 })
      .subscribe();
    const request = http.expectOne(
      '/api/students/11111111-1111-4111-8111-111111111111/kpis/kpi-1',
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ actual: 6 });
    request.flush({ overallPercent: 50, items: [] });
  });
});
