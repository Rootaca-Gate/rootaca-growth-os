import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PartnershipsApi } from './partnerships.api';

describe('PartnershipsApi import', () => {
  let api: PartnershipsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PartnershipsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts CSV preview as multipart', () => {
    const file = new File(['name\nAlpha\n'], 'schools.csv', { type: 'text/csv' });
    api.previewImport(file, { name: 'name' }).subscribe((result) => {
      expect(result.job.id).toBe('job-1');
    });
    const request = http.expectOne(`${environment.apiBaseUrl}/partnerships/import/preview`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);
    request.flush({
      job: {
        id: 'job-1',
        fileName: 'schools.csv',
        fileSizeBytes: 10,
        uploadedById: 'u1',
        uploadedByName: 'Admin',
        status: 'DRAFT',
        headers: ['name'],
        mapping: { name: 'name' },
        summary: {
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
          newInstitutions: 1,
          exactDuplicates: 0,
          possibleDuplicates: 0,
          csvDuplicates: 0,
          needsReview: 0,
        },
        result: null,
        errorMessage: null,
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      },
      suggestedMapping: { name: 'name' },
      crmFields: ['name'],
      rows: [],
      rowsTotal: 0,
      page: 1,
      pageSize: 50,
      pageCount: 0,
    });
  });

  it('executes import job', () => {
    api.executeImport('job-1').subscribe((job) => {
      expect(job.status).toBe('COMPLETED');
    });
    const request = http.expectOne(`${environment.apiBaseUrl}/partnerships/import/jobs/job-1/execute`);
    expect(request.request.method).toBe('POST');
    request.flush({
      id: 'job-1',
      fileName: 'schools.csv',
      fileSizeBytes: 10,
      uploadedById: 'u1',
      uploadedByName: 'Admin',
      status: 'COMPLETED',
      headers: ['name'],
      mapping: { name: 'name' },
      summary: null,
      result: { imported: 1, merged: 0, skipped: 0, failed: 0, invalid: 0 },
      errorMessage: null,
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  });

  it('lists import history', () => {
    api.listImportHistory(1, 20).subscribe((result) => {
      expect(result.items).toEqual([]);
    });
    const request = http.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/partnerships/import/history` &&
        req.params.get('page') === '1',
    );
    request.flush({ items: [], total: 0, page: 1, pageSize: 20, pageCount: 0 });
  });
});
