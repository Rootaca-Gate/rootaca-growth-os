import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  KpiDefinition,
  RecordKpiPayload,
  StudentKpiDashboard,
  UpsertKpiPayload,
} from './kpi.models';

@Injectable({ providedIn: 'root' })
export class KpiApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listDefinitions(): Observable<KpiDefinition[]> {
    return this.http.get<KpiDefinition[]>(`${this.baseUrl}/kpis`);
  }

  createDefinition(payload: UpsertKpiPayload): Observable<KpiDefinition> {
    return this.http.post<KpiDefinition>(`${this.baseUrl}/kpis`, payload);
  }

  updateDefinition(id: string, payload: Partial<UpsertKpiPayload> & { active?: boolean }): Observable<KpiDefinition> {
    return this.http.patch<KpiDefinition>(`${this.baseUrl}/kpis/${id}`, payload);
  }

  deactivateDefinition(id: string): Observable<KpiDefinition> {
    return this.http.delete<KpiDefinition>(`${this.baseUrl}/kpis/${id}`);
  }

  getDashboard(studentId: string): Observable<StudentKpiDashboard> {
    return this.http.get<StudentKpiDashboard>(`${this.baseUrl}/students/${studentId}/kpis`);
  }

  record(studentId: string, studentKpiId: string, payload: RecordKpiPayload): Observable<StudentKpiDashboard> {
    return this.http.patch<StudentKpiDashboard>(
      `${this.baseUrl}/students/${studentId}/kpis/${studentKpiId}`,
      payload,
    );
  }
}
