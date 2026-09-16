import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReportApi } from './report.api';

describe('ReportApi', () => {
  let api: ReportApi;
  let http: HttpTestingController;
  const studentId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ReportApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the student progress report preview', () => {
    api.getPreview(studentId, 'en').subscribe((report) => {
      expect(report.title).toBe('Student Progress Report');
    });
    const request = http.expectOne(`/api/students/${studentId}/report?locale=en`);
    expect(request.request.method).toBe('GET');
    request.flush({ title: 'Student Progress Report', locale: 'en' });
  });

  it('downloads the student progress PDF', () => {
    api.getPdf(studentId, 'ar').subscribe((blob) => {
      expect(blob.size).toBe(4);
    });
    const request = http.expectOne(`/api/students/${studentId}/report.pdf?locale=ar`);
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['%PDF']));
  });
});
