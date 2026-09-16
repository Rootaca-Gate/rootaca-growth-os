import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProgressReview, StudentProgressDashboard, UpsertProgressReview } from './progress.models';

@Injectable({ providedIn: 'root' })
export class ProgressApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getDashboard(studentId: string): Observable<StudentProgressDashboard> {
    return this.http.get<StudentProgressDashboard>(
      `${this.baseUrl}/students/${studentId}/progress`,
    );
  }

  list(studentId: string): Observable<ProgressReview[]> {
    return this.http.get<ProgressReview[]>(
      `${this.baseUrl}/students/${studentId}/progress/reviews`,
    );
  }

  create(studentId: string, payload: UpsertProgressReview): Observable<ProgressReview> {
    return this.http.post<ProgressReview>(
      `${this.baseUrl}/students/${studentId}/progress/reviews`,
      payload,
    );
  }

  update(
    studentId: string,
    reviewId: string,
    payload: Partial<UpsertProgressReview>,
  ): Observable<ProgressReview> {
    return this.http.patch<ProgressReview>(
      `${this.baseUrl}/students/${studentId}/progress/reviews/${reviewId}`,
      payload,
    );
  }
}
