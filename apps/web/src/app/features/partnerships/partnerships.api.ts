import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Activity,
  ActivityQuery,
  ActivityWritePayload,
  Contact,
  ContactQuery,
  ContactWritePayload,
  FollowUp,
  FollowUpQuery,
  FollowUpUpdatePayload,
  FollowUpWritePayload,
  ImportJob,
  ImportPreviewResponse,
  ImportPreviewRow,
  ImportRowDecision,
  ImportRowFilter,
  Institution,
  InstitutionQuery,
  InstitutionWritePayload,
  Lead,
  LeadQuery,
  LeadUpdatePayload,
  LeadWritePayload,
  Note,
  NoteWritePayload,
  Paginated,
  PartnershipDashboard,
  ResearchCandidate,
  ResearchCandidateWritePayload,
  ResearchDashboard,
  ResearchJob,
  ResearchJobWritePayload,
  ResearchProvidersStatus,
  Source,
  TimelineItem,
} from './partnership.models';

function toParams(query: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  });
  return params;
}

@Injectable({ providedIn: 'root' })
export class PartnershipsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/partnerships`;

  getDashboard(): Observable<PartnershipDashboard> {
    return this.http.get<PartnershipDashboard>(`${this.base}/dashboard`);
  }

  listInstitutions(query: InstitutionQuery = {}): Observable<Paginated<Institution>> {
    return this.http.get<Paginated<Institution>>(`${this.base}/institutions`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getInstitution(id: string): Observable<Institution> {
    return this.http.get<Institution>(`${this.base}/institutions/${id}`);
  }

  createInstitution(payload: InstitutionWritePayload): Observable<Institution> {
    return this.http.post<Institution>(`${this.base}/institutions`, payload);
  }

  updateInstitution(id: string, payload: Partial<InstitutionWritePayload>): Observable<Institution> {
    return this.http.patch<Institution>(`${this.base}/institutions/${id}`, payload);
  }

  softDeleteInstitution(id: string): Observable<Institution> {
    return this.http.delete<Institution>(`${this.base}/institutions/${id}`);
  }

  restoreInstitution(id: string): Observable<Institution> {
    return this.http.post<Institution>(`${this.base}/institutions/${id}/restore`, {});
  }

  getTimeline(institutionId: string): Observable<{ items: TimelineItem[] }> {
    return this.http.get<{ items: TimelineItem[] }>(
      `${this.base}/institutions/${institutionId}/timeline`,
    );
  }

  listContacts(query: ContactQuery = {}): Observable<Paginated<Contact>> {
    return this.http.get<Paginated<Contact>>(`${this.base}/contacts`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getContact(id: string): Observable<Contact> {
    return this.http.get<Contact>(`${this.base}/contacts/${id}`);
  }

  createContact(payload: ContactWritePayload): Observable<Contact> {
    return this.http.post<Contact>(`${this.base}/contacts`, payload);
  }

  updateContact(id: string, payload: Partial<ContactWritePayload>): Observable<Contact> {
    return this.http.patch<Contact>(`${this.base}/contacts/${id}`, payload);
  }

  deleteContact(id: string): Observable<Contact> {
    return this.http.delete<Contact>(`${this.base}/contacts/${id}`);
  }

  listLeads(query: LeadQuery = {}): Observable<Paginated<Lead>> {
    return this.http.get<Paginated<Lead>>(`${this.base}/leads`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getLead(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.base}/leads/${id}`);
  }

  createLead(payload: LeadWritePayload): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/leads`, payload);
  }

  updateLead(id: string, payload: LeadUpdatePayload): Observable<Lead> {
    return this.http.patch<Lead>(`${this.base}/leads/${id}`, payload);
  }

  listActivities(query: ActivityQuery = {}): Observable<Paginated<Activity>> {
    return this.http.get<Paginated<Activity>>(`${this.base}/activities`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  createActivity(payload: ActivityWritePayload): Observable<Activity> {
    return this.http.post<Activity>(`${this.base}/activities`, payload);
  }

  listFollowUps(query: FollowUpQuery = {}): Observable<Paginated<FollowUp>> {
    return this.http.get<Paginated<FollowUp>>(`${this.base}/followups`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  createFollowUp(payload: FollowUpWritePayload): Observable<FollowUp> {
    return this.http.post<FollowUp>(`${this.base}/followups`, payload);
  }

  updateFollowUp(id: string, payload: FollowUpUpdatePayload): Observable<FollowUp> {
    return this.http.patch<FollowUp>(`${this.base}/followups/${id}`, payload);
  }

  listNotes(institutionId: string, page = 1, pageSize = 50): Observable<Paginated<Note>> {
    return this.http.get<Paginated<Note>>(`${this.base}/institutions/${institutionId}/notes`, {
      params: toParams({ page, pageSize }),
    });
  }

  createNote(institutionId: string, payload: NoteWritePayload): Observable<Note> {
    return this.http.post<Note>(`${this.base}/institutions/${institutionId}/notes`, payload);
  }

  updateNote(id: string, payload: NoteWritePayload): Observable<Note> {
    return this.http.patch<Note>(`${this.base}/notes/${id}`, payload);
  }

  deleteNote(id: string): Observable<Note> {
    return this.http.delete<Note>(`${this.base}/notes/${id}`);
  }

  listSources(): Observable<Paginated<Source>> {
    return this.http.get<Paginated<Source>>(`${this.base}/sources`);
  }

  previewImport(file: File, mapping?: Record<string, string | null>): Observable<ImportPreviewResponse> {
    const body = new FormData();
    body.append('file', file);
    if (mapping) {
      body.append('mapping', JSON.stringify(mapping));
    }
    return this.http.post<ImportPreviewResponse>(`${this.base}/import/preview`, body);
  }

  remapImport(
    jobId: string,
    mapping: Record<string, string | null>,
  ): Observable<ImportPreviewResponse> {
    return this.http.post<ImportPreviewResponse>(`${this.base}/import/jobs/${jobId}/remap`, {
      mapping,
    });
  }

  getImportJob(
    jobId: string,
    query: { filter?: ImportRowFilter; page?: number; pageSize?: number } = {},
  ): Observable<ImportPreviewResponse> {
    return this.http.get<ImportPreviewResponse>(`${this.base}/import/jobs/${jobId}`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  listImportRows(
    jobId: string,
    query: { filter?: ImportRowFilter; page?: number; pageSize?: number } = {},
  ): Observable<Paginated<ImportPreviewRow>> {
    return this.http.get<Paginated<ImportPreviewRow>>(`${this.base}/import/jobs/${jobId}/rows`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  updateImportDecisions(
    jobId: string,
    payload: {
      decisions?: Array<{ rowNumber: number; decision: ImportRowDecision; mergeTargetId?: string }>;
      bulk?: 'SKIP_ALL_EXACT' | 'IMPORT_ALL_NEW';
    },
  ): Observable<ImportJob> {
    return this.http.patch<ImportJob>(`${this.base}/import/jobs/${jobId}/decisions`, payload);
  }

  executeImport(jobId: string): Observable<ImportJob> {
    return this.http.post<ImportJob>(`${this.base}/import/jobs/${jobId}/execute`, {});
  }

  listImportHistory(page = 1, pageSize = 20): Observable<Paginated<ImportJob>> {
    return this.http.get<Paginated<ImportJob>>(`${this.base}/import/history`, {
      params: toParams({ page, pageSize }),
    });
  }

  getImportHistory(id: string): Observable<ImportPreviewResponse> {
    return this.http.get<ImportPreviewResponse>(`${this.base}/import/history/${id}`);
  }

  getResearchDashboard(): Observable<ResearchDashboard> {
    return this.http.get<ResearchDashboard>(`${this.base}/research/dashboard`);
  }

  getResearchProvidersStatus(): Observable<ResearchProvidersStatus> {
    return this.http.get<ResearchProvidersStatus>(`${this.base}/research/providers/status`);
  }

  listResearchJobs(query: Record<string, unknown> = {}): Observable<Paginated<ResearchJob>> {
    return this.http.get<Paginated<ResearchJob>>(`${this.base}/research/jobs`, {
      params: toParams(query),
    });
  }

  createResearchJob(payload: ResearchJobWritePayload): Observable<ResearchJob> {
    return this.http.post<ResearchJob>(`${this.base}/research/jobs`, payload);
  }

  getResearchJob(id: string): Observable<ResearchJob> {
    return this.http.get<ResearchJob>(`${this.base}/research/jobs/${id}`);
  }

  runResearchJob(id: string): Observable<ResearchJob> {
    return this.http.post<ResearchJob>(`${this.base}/research/jobs/${id}/run`, {});
  }

  cancelResearchJob(id: string): Observable<ResearchJob> {
    return this.http.post<ResearchJob>(`${this.base}/research/jobs/${id}/cancel`, {});
  }

  clearResearchResults(keepImported = true): Observable<{
    deletedCandidates: number;
    deletedJobs: number;
    keptImported: number;
  }> {
    return this.http.post<{
      deletedCandidates: number;
      deletedJobs: number;
      keptImported: number;
    }>(`${this.base}/research/clear`, { keepImported });
  }

  reEnrichResearchContacts(): Observable<{
    scanned: number;
    updated: number;
    institutionsUpdated: number;
  }> {
    return this.http.post<{
      scanned: number;
      updated: number;
      institutionsUpdated: number;
    }>(`${this.base}/research/enrich-contacts`, {});
  }

  listResearchCandidates(query: Record<string, unknown> = {}): Observable<Paginated<ResearchCandidate>> {
    return this.http.get<Paginated<ResearchCandidate>>(`${this.base}/research/candidates`, {
      params: toParams(query),
    });
  }

  getResearchCandidate(id: string): Observable<ResearchCandidate> {
    return this.http.get<ResearchCandidate>(`${this.base}/research/candidates/${id}`);
  }

  createResearchCandidate(payload: ResearchCandidateWritePayload): Observable<ResearchCandidate> {
    return this.http.post<ResearchCandidate>(`${this.base}/research/candidates`, payload);
  }

  verifyResearchCandidate(id: string): Observable<ResearchCandidate> {
    return this.http.post<ResearchCandidate>(`${this.base}/research/candidates/${id}/verify`, {});
  }

  rejectResearchCandidate(id: string): Observable<ResearchCandidate> {
    return this.http.post<ResearchCandidate>(`${this.base}/research/candidates/${id}/reject`, {});
  }

  markResearchDuplicate(
    id: string,
    payload: { duplicateOfCandidateId?: string; matchedInstitutionId?: string; notes?: string } = {},
  ): Observable<ResearchCandidate> {
    return this.http.post<ResearchCandidate>(
      `${this.base}/research/candidates/${id}/duplicate`,
      payload,
    );
  }

  importResearchCandidate(
    id: string,
  ): Observable<{ candidate: ResearchCandidate; institutionId: string }> {
    return this.http.post<{ candidate: ResearchCandidate; institutionId: string }>(
      `${this.base}/research/candidates/${id}/import`,
      {},
    );
  }
}
