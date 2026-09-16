import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnswerPayload,
  AssessmentResult,
  OrientationSession,
  OrientationSessionSummary,
  OrientationStage,
} from './orientation.models';

@Injectable({ providedIn: 'root' })
export class OrientationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/orientation-sessions`;

  list(studentId?: string): Observable<OrientationSessionSummary[]> {
    let params = new HttpParams();
    if (studentId) {
      params = params.set('studentId', studentId);
    }
    return this.http.get<OrientationSessionSummary[]>(this.baseUrl, { params });
  }

  create(studentId: string): Observable<OrientationSession> {
    return this.http.post<OrientationSession>(this.baseUrl, { studentId });
  }

  get(id: string): Observable<OrientationSession> {
    return this.http.get<OrientationSession>(`${this.baseUrl}/${id}`);
  }

  start(id: string): Observable<OrientationSession> {
    return this.http.post<OrientationSession>(`${this.baseUrl}/${id}/start`, {});
  }

  pause(id: string): Observable<OrientationSession> {
    return this.http.post<OrientationSession>(`${this.baseUrl}/${id}/pause`, {});
  }

  resume(id: string): Observable<OrientationSession> {
    return this.http.post<OrientationSession>(`${this.baseUrl}/${id}/resume`, {});
  }

  save(
    id: string,
    payload: { notes?: string; currentStage?: OrientationStage; answers?: AnswerPayload[] },
  ): Observable<OrientationSession> {
    return this.http.patch<OrientationSession>(`${this.baseUrl}/${id}`, payload);
  }

  submitAnswers(id: string, answers: AnswerPayload[]): Observable<OrientationSession> {
    return this.http.put<OrientationSession>(`${this.baseUrl}/${id}/answers`, { answers });
  }

  complete(id: string): Observable<OrientationSession> {
    return this.http.post<OrientationSession>(`${this.baseUrl}/${id}/complete`, {});
  }

  getResult(id: string): Observable<AssessmentResult> {
    return this.http.get<AssessmentResult>(`${this.baseUrl}/${id}/result`);
  }
}
