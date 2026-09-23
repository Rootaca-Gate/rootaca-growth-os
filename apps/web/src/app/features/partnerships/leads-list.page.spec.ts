import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { DirectionService } from '../../core/direction.service';
import { environment } from '../../../environments/environment';
import { Lead, Paginated } from './partnership.models';
import { PartnershipsApi } from './partnerships.api';
import { LeadsListPage } from './leads-list.page';

const sampleLead: Lead = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  institutionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  institutionName: 'ABC School',
  primaryContactId: null,
  primaryContactName: 'Sara Contact',
  status: 'NEW',
  priority: 'HIGH',
  sourceId: null,
  qualificationReason: null,
  estimatedStudentCount: null,
  estimatedOpportunity: null,
  nextAction: 'Call',
  nextActionDate: '2026-09-25',
  ownerId: null,
  ownerName: 'Admin',
  lastActivityAt: '2026-09-22T00:00:00.000Z',
  nextFollowUpDate: '2026-09-26',
  createdAt: '2026-09-22T00:00:00.000Z',
  updatedAt: '2026-09-22T00:00:00.000Z',
};

describe('LeadsListPage', () => {
  let fixture: ComponentFixture<LeadsListPage>;
  let api: { listLeads: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = {
      listLeads: vi.fn().mockReturnValue(
        of<Paginated<Lead>>({
          items: [sampleLead],
          total: 1,
          page: 1,
          pageSize: 20,
          pageCount: 1,
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [LeadsListPage],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PartnershipsApi, useValue: api },
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({
              id: 'u1',
              email: 'a@b.c',
              displayName: 'Admin',
              role: 'ADMIN',
            }),
          },
        },
        {
          provide: DirectionService,
          useValue: { t: (key: string) => key, lang: () => 'ar' },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsListPage);
  });

  it('populates leads from API response.items', () => {
    fixture.detectChanges();
    expect(api.listLeads).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 20 }),
    );
    expect(fixture.componentInstance.result().items).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('ABC School');
    expect(fixture.nativeElement.textContent).toContain('Sara Contact');
  });

  it('renders board cards from the same result signal', () => {
    fixture.detectChanges();
    fixture.componentInstance.onViewChange('board');
    fixture.detectChanges();
    expect(api.listLeads).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 100 }),
    );
    expect(fixture.nativeElement.querySelector('.board')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('ABC School');
  });

  it('shows empty state only when items.length === 0', () => {
    api.listLeads.mockReturnValue(
      of({ items: [], total: 0, page: 1, pageSize: 20, pageCount: 0 }),
    );
    fixture = TestBed.createComponent(LeadsListPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('partnerships.leadsEmptyTitle');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('shows error state on API failure instead of empty', () => {
    api.listLeads.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture = TestBed.createComponent(LeadsListPage);
    fixture.detectChanges();
    expect(fixture.componentInstance.errorMessage()).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('partnerships.leadsLoadError');
    expect(fixture.nativeElement.textContent).not.toContain('partnerships.leadsEmptyTitle');
  });

  it('does not send empty status/priority filters', () => {
    fixture.detectChanges();
    const args = api.listLeads.mock.calls[0][0] as Record<string, unknown>;
    expect(args['status']).toBeUndefined();
    expect(args['priority']).toBeUndefined();
  });
});

describe('PartnershipsApi listLeads mapping', () => {
  it('reads response.items from GET /partnerships/leads', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PartnershipsApi],
    });
    const apiClient = TestBed.inject(PartnershipsApi);
    const http = TestBed.inject(HttpTestingController);
    let received: Paginated<Lead> | undefined;
    apiClient.listLeads({ page: 1, pageSize: 20 }).subscribe((result) => {
      received = result;
    });
    const request = http.expectOne(
      (req) => req.url === `${environment.apiBaseUrl}/partnerships/leads`,
    );
    request.flush({
      items: [sampleLead],
      total: 1,
      page: 1,
      pageSize: 20,
      pageCount: 1,
    });
    expect(received?.items).toHaveLength(1);
    expect(received?.items[0].institutionName).toBe('ABC School');
    http.verify();
  });
});
