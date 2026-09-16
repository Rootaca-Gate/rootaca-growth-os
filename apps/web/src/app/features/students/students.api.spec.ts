import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StudentsApi } from './students.api';

describe('StudentsApi', () => {
  let api: StudentsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(StudentsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists students with filters', () => {
    api.list({ search: 'Yara', status: 'ACTIVE', page: 1 }).subscribe((result) => {
      expect(result.total).toBe(1);
    });

    const request = http.expectOne(
      (req) => req.url === '/api/students' && req.params.get('search') === 'Yara',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], total: 1, page: 1, pageSize: 20, pageCount: 1 });
  });

  it('patches student status', () => {
    api.updateStatus('11111111-1111-4111-8111-111111111111', 'PAUSED').subscribe();
    const request = http.expectOne('/api/students/11111111-1111-4111-8111-111111111111/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'PAUSED' });
    request.flush({ id: '11111111-1111-4111-8111-111111111111', status: 'PAUSED' });
  });
});
