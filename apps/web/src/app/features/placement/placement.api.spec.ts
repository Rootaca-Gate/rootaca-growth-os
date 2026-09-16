import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PlacementApi } from './placement.api';

describe('PlacementApi', () => {
  let api: PlacementApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PlacementApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists levels', () => {
    api.listLevels().subscribe((levels) => {
      expect(levels.length).toBe(1);
    });
    const request = http.expectOne('/api/levels');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: '1', code: 'EXPLORER', name: 'Explorer', description: '', sortOrder: 1 }]);
  });

  it('overrides a student path', () => {
    api
      .overridePath('11111111-1111-4111-8111-111111111111', 'path-1', 'Family constraint for web.')
      .subscribe();
    const request = http.expectOne('/api/students/11111111-1111-4111-8111-111111111111/placement/path');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      pathId: 'path-1',
      reason: 'Family constraint for web.',
    });
    request.flush({ id: 'placement' });
  });
});
