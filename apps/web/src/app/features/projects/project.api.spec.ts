import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProjectApi } from './project.api';

describe('ProjectApi', () => {
  let api: ProjectApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProjectApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists educational projects', () => {
    api.list().subscribe((items) => {
      expect(items[0].purpose).toBe('EDUCATIONAL');
    });
    const request = http.expectOne('/api/projects');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'p1', purpose: 'EDUCATIONAL', name: 'First Web Page Studio' }]);
  });

  it('assigns a project to a student', () => {
    api.assign('proj-1', { studentId: 'student-1' }).subscribe();
    const request = http.expectOne('/api/projects/proj-1/assign');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ studentId: 'student-1' });
    request.flush({ id: 'sp-1', milestones: [] });
  });

  it('updates milestone completion', () => {
    api
      .updateMilestone('student-1', 'sp-1', 'm-1', { completionPercent: 50 })
      .subscribe();
    const request = http.expectOne(
      '/api/students/student-1/projects/sp-1/milestones/m-1',
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ completionPercent: 50 });
    request.flush({ id: 'sp-1', progressPercent: 6 });
  });
});
