import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProgressApi } from './progress.api';

describe('ProgressApi', () => {
  let api: ProgressApi;
  let http: HttpTestingController;
  const studentId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProgressApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the student progress dashboard', () => {
    api.getDashboard(studentId).subscribe((dashboard) => {
      expect(dashboard.currentScore).toBe(50);
      expect(dashboard.growth).toBe(15);
    });
    const request = http.expectOne(`/api/students/${studentId}/progress`);
    expect(request.request.method).toBe('GET');
    request.flush({ currentScore: 50, previousScore: 35, growth: 15, history: [] });
  });

  it('creates a mentor review', () => {
    api
      .create(studentId, {
        kind: 'MONTHLY_REVIEW',
        technicalSkills: 55,
        problemSolving: 45,
        projects: 40,
        independence: 50,
        communication: 60,
      })
      .subscribe((review) => {
        expect(review.overallGrowth).toBe(15);
      });
    const request = http.expectOne(`/api/students/${studentId}/progress/reviews`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.kind).toBe('MONTHLY_REVIEW');
    request.flush({ overallScore: 50, overallGrowth: 15 });
  });
});
