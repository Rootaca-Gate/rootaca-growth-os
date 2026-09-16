import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardApi } from './dashboard.api';

describe('DashboardApi', () => {
  let api: DashboardApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DashboardApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the live growth OS dashboard', () => {
    api.getDashboard().subscribe((dashboard) => {
      expect(dashboard.cards.totalStudents).toBe(6);
      expect(dashboard.cards.averageProgress).toBe(72);
    });
    const request = http.expectOne('/api/dashboard');
    expect(request.request.method).toBe('GET');
    request.flush({
      generatedAt: '2026-09-16T12:00:00.000Z',
      cards: {
        totalStudents: 6,
        activeStudents: 3,
        todaysSessions: 1,
        pendingAssessments: 2,
        averageProgress: 72,
        projectsCompleted: 4,
        newThisWeek: 1,
        averageSkillScore: null,
      },
      charts: {
        studentsByLevel: [],
        studentsByPath: [],
        averageSkillScores: [],
        kpiStatus: [],
        monthlyProgress: [],
      },
      attention: {
        kpiBelowTarget: [],
        assessmentPending: [],
        noRecentActivity: [],
        roadmapBehindSchedule: [],
        orientationNotCompleted: [],
        assessmentInProgress: [],
        roadmapOverdue: [],
      },
      recentSessions: [],
      upcomingSessions: [],
      todaysSessionsList: [],
      students: [],
      recentActivity: [],
    });
  });
});
