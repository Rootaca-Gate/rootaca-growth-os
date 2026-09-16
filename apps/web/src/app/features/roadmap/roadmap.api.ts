import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateItemPayload,
  CreatePhasePayload,
  StudentRoadmap,
  UpdateItemPayload,
} from './roadmap.models';

@Injectable({ providedIn: 'root' })
export class RoadmapApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get(studentId: string): Observable<StudentRoadmap> {
    return this.http.get<StudentRoadmap>(`${this.baseUrl}/students/${studentId}/roadmap`);
  }

  generate(studentId: string): Observable<StudentRoadmap> {
    return this.http.post<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/generate`,
      {},
    );
  }

  addPhase(studentId: string, payload: CreatePhasePayload): Observable<StudentRoadmap> {
    return this.http.post<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/phases`,
      payload,
    );
  }

  updatePhase(
    studentId: string,
    phaseId: string,
    payload: Partial<CreatePhasePayload>,
  ): Observable<StudentRoadmap> {
    return this.http.patch<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/phases/${phaseId}`,
      payload,
    );
  }

  removePhase(studentId: string, phaseId: string): Observable<StudentRoadmap> {
    return this.http.delete<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/phases/${phaseId}`,
    );
  }

  reorderPhases(studentId: string, ids: string[]): Observable<StudentRoadmap> {
    return this.http.put<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/phases/reorder`,
      { ids },
    );
  }

  addItem(
    studentId: string,
    phaseId: string,
    payload: CreateItemPayload,
  ): Observable<StudentRoadmap> {
    return this.http.post<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/phases/${phaseId}/items`,
      payload,
    );
  }

  updateItem(
    studentId: string,
    itemId: string,
    payload: UpdateItemPayload,
  ): Observable<StudentRoadmap> {
    return this.http.patch<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/items/${itemId}`,
      payload,
    );
  }

  removeItem(studentId: string, itemId: string): Observable<StudentRoadmap> {
    return this.http.delete<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/items/${itemId}`,
    );
  }

  reorderItems(studentId: string, phaseId: string, ids: string[]): Observable<StudentRoadmap> {
    return this.http.put<StudentRoadmap>(
      `${this.baseUrl}/students/${studentId}/roadmap/phases/${phaseId}/items/reorder`,
      { ids },
    );
  }
}
