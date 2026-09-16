import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AssignProjectPayload,
  EducationalProject,
  ProjectDetails,
  StudentProject,
  StudentProjectSummary,
  UpdateMilestonePayload,
  UpdateStudentProjectPayload,
  UpsertProjectPayload,
} from './project.models';

@Injectable({ providedIn: 'root' })
export class ProjectApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  list(): Observable<EducationalProject[]> {
    return this.http.get<EducationalProject[]>(`${this.baseUrl}/projects`);
  }

  get(id: string): Observable<ProjectDetails> {
    return this.http.get<ProjectDetails>(`${this.baseUrl}/projects/${id}`);
  }

  create(payload: UpsertProjectPayload): Observable<EducationalProject> {
    return this.http.post<EducationalProject>(`${this.baseUrl}/projects`, payload);
  }

  update(id: string, payload: Partial<UpsertProjectPayload> & { active?: boolean }): Observable<EducationalProject> {
    return this.http.patch<EducationalProject>(`${this.baseUrl}/projects/${id}`, payload);
  }

  deactivate(id: string): Observable<EducationalProject> {
    return this.http.delete<EducationalProject>(`${this.baseUrl}/projects/${id}`);
  }

  assign(projectId: string, payload: AssignProjectPayload): Observable<StudentProject> {
    return this.http.post<StudentProject>(`${this.baseUrl}/projects/${projectId}/assign`, payload);
  }

  listForStudent(studentId: string): Observable<StudentProjectSummary> {
    return this.http.get<StudentProjectSummary>(`${this.baseUrl}/students/${studentId}/projects`);
  }

  getForStudent(studentId: string, studentProjectId: string): Observable<StudentProject> {
    return this.http.get<StudentProject>(
      `${this.baseUrl}/students/${studentId}/projects/${studentProjectId}`,
    );
  }

  updateAssignment(
    studentId: string,
    studentProjectId: string,
    payload: UpdateStudentProjectPayload,
  ): Observable<StudentProject> {
    return this.http.patch<StudentProject>(
      `${this.baseUrl}/students/${studentId}/projects/${studentProjectId}`,
      payload,
    );
  }

  updateMilestone(
    studentId: string,
    studentProjectId: string,
    milestoneId: string,
    payload: UpdateMilestonePayload,
  ): Observable<StudentProject> {
    return this.http.patch<StudentProject>(
      `${this.baseUrl}/students/${studentId}/projects/${studentProjectId}/milestones/${milestoneId}`,
      payload,
    );
  }

  unassign(studentId: string, studentProjectId: string): Observable<StudentProjectSummary> {
    return this.http.delete<StudentProjectSummary>(
      `${this.baseUrl}/students/${studentId}/projects/${studentProjectId}`,
    );
  }
}
