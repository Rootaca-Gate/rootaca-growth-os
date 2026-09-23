import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PartnershipsApi } from './partnerships.api';

describe('PartnershipsApi', () => {
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

  it('lists institutions with query params', () => {
    api.listInstitutions({ search: 'abc', page: 1, pageSize: 20, hasCoding: true }).subscribe((result) => {
      expect(result.items).toEqual([]);
    });
    const request = http.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/partnerships/institutions` &&
        req.params.get('search') === 'abc' &&
        req.params.get('hasCoding') === 'true',
    );
    request.flush({ items: [], total: 0, page: 1, pageSize: 20, pageCount: 0 });
  });

  it('patches lead status', () => {
    api.updateLead('lead-1', { status: 'REPLIED' }).subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/partnerships/leads/lead-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'REPLIED' });
    request.flush({
      id: 'lead-1',
      institutionId: 'inst-1',
      institutionName: 'ABC',
      primaryContactId: null,
      status: 'REPLIED',
      priority: 'HIGH',
      sourceId: null,
      qualificationReason: null,
      estimatedStudentCount: null,
      estimatedOpportunity: null,
      nextAction: null,
      nextActionDate: null,
      ownerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('completes a follow-up', () => {
    api.updateFollowUp('fu-1', { complete: true }).subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/partnerships/followups/fu-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ complete: true });
    request.flush({
      id: 'fu-1',
      institutionId: 'inst-1',
      contactId: null,
      leadId: null,
      title: 'Call',
      description: '',
      dueDate: '2026-09-23',
      priority: 'HIGH',
      status: 'COMPLETED',
      assignedToId: null,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('loads dashboard', () => {
    api.getDashboard().subscribe((dashboard) => {
      expect(dashboard.totalInstitutions).toBe(0);
    });
    const request = http.expectOne(`${environment.apiBaseUrl}/partnerships/dashboard`);
    request.flush({
      totalInstitutions: 0,
      totalLeads: 0,
      newLeads: 0,
      qualifiedLeads: 0,
      contactedLeads: 0,
      repliedLeads: 0,
      meetings: 0,
      proposals: 0,
      partners: 0,
      notInterested: 0,
      noResponse: 0,
      followUpsDueToday: 0,
      overdueFollowUps: 0,
      institutionsByGovernorate: [],
      institutionsByType: [],
      leadsByStatus: [],
      leadsByPriority: [],
    });
  });
});
