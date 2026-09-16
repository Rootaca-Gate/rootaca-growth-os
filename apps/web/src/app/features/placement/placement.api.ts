import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LearningPath, Level, Placement, Skill, StudentSkill } from './placement.models';

@Injectable({ providedIn: 'root' })
export class PlacementApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listLevels(): Observable<Level[]> {
    return this.http.get<Level[]>(`${this.baseUrl}/levels`);
  }

  listSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.baseUrl}/skills`);
  }

  listPaths(): Observable<LearningPath[]> {
    return this.http.get<LearningPath[]>(`${this.baseUrl}/learning-paths`);
  }

  getStudentSkills(studentId: string): Observable<StudentSkill[]> {
    return this.http.get<StudentSkill[]>(`${this.baseUrl}/students/${studentId}/skills`);
  }

  getPlacement(studentId: string): Observable<Placement> {
    return this.http.get<Placement>(`${this.baseUrl}/students/${studentId}/placement`);
  }

  overrideLevel(studentId: string, levelId: string, reason: string): Observable<Placement> {
    return this.http.patch<Placement>(`${this.baseUrl}/students/${studentId}/placement/level`, {
      levelId,
      reason,
    });
  }

  overridePath(studentId: string, pathId: string, reason: string): Observable<Placement> {
    return this.http.patch<Placement>(`${this.baseUrl}/students/${studentId}/placement/path`, {
      pathId,
      reason,
    });
  }
}
