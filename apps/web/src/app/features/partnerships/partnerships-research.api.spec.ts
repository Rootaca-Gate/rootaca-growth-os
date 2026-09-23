import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PartnershipsApi } from './partnerships.api';

describe('PartnershipsApi research', () => {
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

  it('loads research dashboard', () => {
    api.getResearchDashboard().subscribe((dash) => {
      expect(dash.automatedDiscoveryConfigured).toBe(false);
    });
    const request = http.expectOne(`${environment.apiBaseUrl}/partnerships/research/dashboard`);
    request.flush({
      activeJobs: 0,
      candidates: 0,
      needsReview: 0,
      possibleDuplicates: 0,
      verified: 0,
      imported: 0,
      rejected: 0,
      stale: 0,
      availableProviders: ['MANUAL'],
      automatedDiscoveryConfigured: false,
      governorates: ['Cairo'],
      providers: [
        { type: 'MANUAL', configured: true, enabled: true },
        { type: 'WEB_SEARCH', configured: false, enabled: false },
      ],
    });
  });

  it('loads research provider status', () => {
    api.getResearchProvidersStatus().subscribe((status) => {
      expect(status.automatedDiscoveryConfigured).toBe(false);
      expect(status.providers.some((p) => p.type === 'MANUAL')).toBe(true);
    });
    const request = http.expectOne(
      `${environment.apiBaseUrl}/partnerships/research/providers/status`,
    );
    request.flush({
      providers: [
        { type: 'MANUAL', configured: true, enabled: true },
        { type: 'WEB_SEARCH', configured: false, enabled: false },
      ],
      automatedDiscoveryConfigured: false,
      engine: 'serper',
      enrichmentEnabled: false,
    });
  });

  it('imports a research candidate to CRM', () => {
    api.importResearchCandidate('cand-1').subscribe((result) => {
      expect(result.institutionId).toBe('inst-1');
    });
    const request = http.expectOne(
      `${environment.apiBaseUrl}/partnerships/research/candidates/cand-1/import`,
    );
    expect(request.request.method).toBe('POST');
    request.flush({
      institutionId: 'inst-1',
      candidate: {
        id: 'cand-1',
        jobId: null,
        discoveredName: 'School',
        discoveredNameAr: null,
        discoveredNameEn: null,
        governorate: null,
        city: null,
        district: null,
        address: null,
        institutionType: null,
        institutionCategory: null,
        curriculum: null,
        email: null,
        phone: null,
        mobile: null,
        whatsapp: null,
        website: null,
        facebook: null,
        instagram: null,
        linkedin: null,
        youtube: null,
        tiktok: null,
        googleMapsUrl: null,
        hasCoding: false,
        hasRobotics: false,
        hasStem: false,
        hasAi: false,
        hasTechClub: false,
        hasAfterSchool: false,
        hasSummerCamp: false,
        hasMakerspace: false,
        sourceType: 'MANUAL',
        sourceName: null,
        sourceUrl: null,
        discoveredAt: new Date().toISOString(),
        lastCheckedAt: null,
        researchStatus: 'IMPORTED',
        verificationStatus: 'VERIFIED',
        dataQuality: 'MEDIUM',
        duplicateStatus: 'NEW',
        duplicateOfCandidateId: null,
        matchedInstitutionId: 'inst-1',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  });
});
