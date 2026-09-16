import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RoadmapApi } from './roadmap.api';

describe('RoadmapApi', () => {
  let api: RoadmapApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RoadmapApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads a student roadmap', () => {
    api.get('11111111-1111-4111-8111-111111111111').subscribe((roadmap) => {
      expect(roadmap.progress.overallPercent).toBe(25);
    });
    const request = http.expectOne(
      '/api/students/11111111-1111-4111-8111-111111111111/roadmap',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'roadmap',
      progress: { overallPercent: 25, blockedItems: [] },
      phases: [],
    });
  });

  it('patches item completion', () => {
    api
      .updateItem('11111111-1111-4111-8111-111111111111', 'item-1', {
        completionPercentage: 80,
      })
      .subscribe();
    const request = http.expectOne(
      '/api/students/11111111-1111-4111-8111-111111111111/roadmap/items/item-1',
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ completionPercentage: 80 });
    request.flush({ id: 'roadmap' });
  });

  it('regenerates a student roadmap', () => {
    api.generate('11111111-1111-4111-8111-111111111111').subscribe();
    const request = http.expectOne(
      '/api/students/11111111-1111-4111-8111-111111111111/roadmap/generate',
    );
    expect(request.request.method).toBe('POST');
    request.flush({ id: 'roadmap' });
  });
});
