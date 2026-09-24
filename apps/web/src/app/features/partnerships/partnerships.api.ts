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
  PartnershipSearchResult,
  ResearchCandidate,
  ResearchCandidateWritePayload,
  ResearchDashboard,
  ResearchJob,
  ResearchJobWritePayload,
  ResearchProvidersStatus,
  Source,
  TimelineItem,
  PartnershipProgram,
  ProgramListItem,
  ProgramQuery,
  ProgramUpdatePayload,
  ProgramWritePayload,
} from './partnership.models';
import {
  OfferingListItem,
  OfferingQuery,
  OfferingUpdatePayload,
  OfferingWritePayload,
  PartnershipOffering,
} from './offerings/offering.models';
import {
  PartnershipProposal,
  PartnershipProposalStatus,
  ProposalListItem,
  ProposalQuery,
  ProposalUpdatePayload,
  ProposalWritePayload,
} from './proposals/proposal.models';
import {
  PartnershipSow,
  PartnershipSowStatus,
  SowChangeRequestPayload,
  SowDecideChangeRequestPayload,
  SowListItem,
  SowQuery,
  SowUpdatePayload,
  SowWritePayload,
} from './sows/sow.models';
import {
  DeliveryListItem,
  DeliveryQuery,
  DeliveryUpdatePayload,
  DeliveryUserOption,
  PartnershipDelivery,
  PartnershipDeliveryStatus,
} from './delivery/delivery.models';
import {
  CreateReportFromDeliveryPayload,
  PartnershipReport,
  PartnershipReportStatus,
  ReportListItem,
  ReportQuery,
  ReportUpdatePayload,
} from './reports/report.models';
import {
  AddTimelineEventPayload,
  CreateOpportunityPayload,
  CreateProposalFromOpportunityPayload,
  OpportunityDashboard,
  OpportunityListItem,
  OpportunityQuery,
  OpportunityStatus,
  OpportunityType,
  OpportunityUserOption,
  PartnershipOpportunity,
  UpdateOpportunityPayload,
} from './renewals/opportunity.models';

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

  getDashboard(period?: string): Observable<PartnershipDashboard> {
    return this.http.get<PartnershipDashboard>(`${this.base}/dashboard`, {
      params: toParams({ period: period && period !== 'all' ? period : undefined }),
    });
  }

  searchPartnerships(q: string): Observable<PartnershipSearchResult> {
    return this.http.get<PartnershipSearchResult>(`${this.base}/dashboard/search`, {
      params: toParams({ q }),
    });
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

  listPrograms(query: ProgramQuery = {}): Observable<Paginated<ProgramListItem>> {
    return this.http.get<Paginated<ProgramListItem>>(`${this.base}/programs`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getProgram(id: string): Observable<PartnershipProgram> {
    return this.http.get<PartnershipProgram>(`${this.base}/programs/${id}`);
  }

  createProgram(payload: ProgramWritePayload): Observable<PartnershipProgram> {
    return this.http.post<PartnershipProgram>(`${this.base}/programs`, payload);
  }

  updateProgram(id: string, payload: ProgramUpdatePayload): Observable<PartnershipProgram> {
    return this.http.patch<PartnershipProgram>(`${this.base}/programs/${id}`, payload);
  }

  archiveProgram(id: string): Observable<PartnershipProgram> {
    return this.http.post<PartnershipProgram>(`${this.base}/programs/${id}/archive`, {});
  }

  duplicateProgram(id: string): Observable<PartnershipProgram> {
    return this.http.post<PartnershipProgram>(`${this.base}/programs/${id}/duplicate`, {});
  }

  listOfferings(query: OfferingQuery = {}): Observable<Paginated<OfferingListItem>> {
    return this.http.get<Paginated<OfferingListItem>>(`${this.base}/offerings`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getOffering(id: string): Observable<PartnershipOffering> {
    return this.http.get<PartnershipOffering>(`${this.base}/offerings/${id}`);
  }

  createOffering(payload: OfferingWritePayload): Observable<PartnershipOffering> {
    return this.http.post<PartnershipOffering>(`${this.base}/offerings`, payload);
  }

  updateOffering(id: string, payload: OfferingUpdatePayload): Observable<PartnershipOffering> {
    return this.http.patch<PartnershipOffering>(`${this.base}/offerings/${id}`, payload);
  }

  archiveOffering(id: string): Observable<PartnershipOffering> {
    return this.http.post<PartnershipOffering>(`${this.base}/offerings/${id}/archive`, {});
  }

  duplicateOffering(id: string): Observable<PartnershipOffering> {
    return this.http.post<PartnershipOffering>(`${this.base}/offerings/${id}/duplicate`, {});
  }

  listProposals(query: ProposalQuery = {}): Observable<Paginated<ProposalListItem>> {
    return this.http.get<Paginated<ProposalListItem>>(`${this.base}/proposals`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getProposal(id: string): Observable<PartnershipProposal> {
    return this.http.get<PartnershipProposal>(`${this.base}/proposals/${id}`);
  }

  createProposal(payload: ProposalWritePayload): Observable<PartnershipProposal> {
    return this.http.post<PartnershipProposal>(`${this.base}/proposals`, payload);
  }

  updateProposal(id: string, payload: ProposalUpdatePayload): Observable<PartnershipProposal> {
    return this.http.patch<PartnershipProposal>(`${this.base}/proposals/${id}`, payload);
  }

  archiveProposal(id: string): Observable<PartnershipProposal> {
    return this.http.post<PartnershipProposal>(`${this.base}/proposals/${id}/archive`, {});
  }

  duplicateProposal(id: string): Observable<PartnershipProposal> {
    return this.http.post<PartnershipProposal>(`${this.base}/proposals/${id}/duplicate`, {});
  }

  sendProposal(id: string): Observable<PartnershipProposal> {
    return this.http.post<PartnershipProposal>(`${this.base}/proposals/${id}/send`, {});
  }

  changeProposalStatus(
    id: string,
    status: PartnershipProposalStatus,
  ): Observable<PartnershipProposal> {
    return this.http.post<PartnershipProposal>(`${this.base}/proposals/${id}/status`, { status });
  }

  reviseProposal(id: string): Observable<PartnershipProposal> {
    return this.http.post<PartnershipProposal>(`${this.base}/proposals/${id}/revise`, {});
  }

  ensureProposalShareToken(id: string): Observable<PartnershipProposal> {
    return this.http.post<PartnershipProposal>(`${this.base}/proposals/${id}/share-token`, {});
  }

  listSows(query: SowQuery = {}): Observable<Paginated<SowListItem>> {
    return this.http.get<Paginated<SowListItem>>(`${this.base}/sows`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getSow(id: string): Observable<PartnershipSow> {
    return this.http.get<PartnershipSow>(`${this.base}/sows/${id}`);
  }

  createSow(payload: SowWritePayload): Observable<PartnershipSow> {
    return this.http.post<PartnershipSow>(`${this.base}/sows`, payload);
  }

  createSowFromProposal(proposalId: string): Observable<PartnershipSow> {
    return this.http.post<PartnershipSow>(`${this.base}/sows/create-from-proposal`, {
      proposalId,
    });
  }

  updateSow(id: string, payload: SowUpdatePayload): Observable<PartnershipSow> {
    return this.http.patch<PartnershipSow>(`${this.base}/sows/${id}`, payload);
  }

  archiveSow(id: string): Observable<PartnershipSow> {
    return this.http.post<PartnershipSow>(`${this.base}/sows/${id}/archive`, {});
  }

  duplicateSow(id: string): Observable<PartnershipSow> {
    return this.http.post<PartnershipSow>(`${this.base}/sows/${id}/duplicate`, {});
  }

  changeSowStatus(id: string, status: PartnershipSowStatus): Observable<PartnershipSow> {
    return this.http.post<PartnershipSow>(`${this.base}/sows/${id}/status`, { status });
  }

  createSowChangeRequest(
    id: string,
    payload: SowChangeRequestPayload,
  ): Observable<PartnershipSow> {
    return this.http.post<PartnershipSow>(`${this.base}/sows/${id}/change-requests`, payload);
  }

  decideSowChangeRequest(
    id: string,
    crId: string,
    payload: SowDecideChangeRequestPayload,
  ): Observable<PartnershipSow> {
    return this.http.post<PartnershipSow>(
      `${this.base}/sows/${id}/change-requests/${crId}/decide`,
      payload,
    );
  }

  listDeliveries(query: DeliveryQuery = {}): Observable<Paginated<DeliveryListItem>> {
    return this.http.get<Paginated<DeliveryListItem>>(`${this.base}/delivery`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getDelivery(id: string): Observable<PartnershipDelivery> {
    return this.http.get<PartnershipDelivery>(`${this.base}/delivery/${id}`);
  }

  createDeliveryFromSow(sowId: string): Observable<PartnershipDelivery> {
    return this.http.post<PartnershipDelivery>(`${this.base}/delivery/create-from-sow`, {
      sowId,
    });
  }

  updateDelivery(id: string, payload: DeliveryUpdatePayload): Observable<PartnershipDelivery> {
    return this.http.patch<PartnershipDelivery>(`${this.base}/delivery/${id}`, payload);
  }

  changeDeliveryStatus(
    id: string,
    status: PartnershipDeliveryStatus,
  ): Observable<PartnershipDelivery> {
    return this.http.post<PartnershipDelivery>(`${this.base}/delivery/${id}/status`, { status });
  }

  archiveDelivery(id: string): Observable<PartnershipDelivery> {
    return this.http.post<PartnershipDelivery>(`${this.base}/delivery/${id}/archive`, {});
  }

  duplicateDelivery(id: string): Observable<PartnershipDelivery> {
    return this.http.post<PartnershipDelivery>(`${this.base}/delivery/${id}/duplicate`, {});
  }

  listDeliveryUsers(): Observable<DeliveryUserOption[]> {
    return this.http.get<DeliveryUserOption[]>(`${this.base}/delivery/users`);
  }

  listReports(query: ReportQuery = {}): Observable<Paginated<ReportListItem>> {
    return this.http.get<Paginated<ReportListItem>>(`${this.base}/reports`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getReport(id: string): Observable<PartnershipReport> {
    return this.http.get<PartnershipReport>(`${this.base}/reports/${id}`);
  }

  createReportFromDelivery(
    payload: CreateReportFromDeliveryPayload,
  ): Observable<PartnershipReport> {
    return this.http.post<PartnershipReport>(`${this.base}/reports/create-from-delivery`, payload);
  }

  updateReport(id: string, payload: ReportUpdatePayload): Observable<PartnershipReport> {
    return this.http.patch<PartnershipReport>(`${this.base}/reports/${id}`, payload);
  }

  changeReportStatus(id: string, status: PartnershipReportStatus): Observable<PartnershipReport> {
    return this.http.post<PartnershipReport>(`${this.base}/reports/${id}/status`, { status });
  }

  archiveReport(id: string): Observable<PartnershipReport> {
    return this.http.post<PartnershipReport>(`${this.base}/reports/${id}/archive`, {});
  }

  duplicateReport(id: string): Observable<PartnershipReport> {
    return this.http.post<PartnershipReport>(`${this.base}/reports/${id}/duplicate`, {});
  }

  refreshReportSnapshot(id: string): Observable<PartnershipReport> {
    return this.http.post<PartnershipReport>(`${this.base}/reports/${id}/refresh-snapshot`, {});
  }

  markReportPdfGenerated(id: string): Observable<PartnershipReport> {
    return this.http.post<PartnershipReport>(`${this.base}/reports/${id}/pdf-generated`, {});
  }

  listOpportunities(
    query: OpportunityQuery = {},
  ): Observable<Paginated<OpportunityListItem>> {
    return this.http.get<Paginated<OpportunityListItem>>(`${this.base}/renewals`, {
      params: toParams(query as Record<string, unknown>),
    });
  }

  getOpportunityDashboard(): Observable<OpportunityDashboard> {
    return this.http.get<OpportunityDashboard>(`${this.base}/renewals/dashboard`);
  }

  listOpportunityUsers(): Observable<OpportunityUserOption[]> {
    return this.http.get<OpportunityUserOption[]>(`${this.base}/renewals/users`);
  }

  getOpportunity(id: string): Observable<PartnershipOpportunity> {
    return this.http.get<PartnershipOpportunity>(`${this.base}/renewals/${id}`);
  }

  createOpportunity(
    payload: CreateOpportunityPayload,
  ): Observable<PartnershipOpportunity> {
    return this.http.post<PartnershipOpportunity>(`${this.base}/renewals`, payload);
  }

  updateOpportunity(
    id: string,
    payload: UpdateOpportunityPayload,
  ): Observable<PartnershipOpportunity> {
    return this.http.patch<PartnershipOpportunity>(`${this.base}/renewals/${id}`, payload);
  }

  changeOpportunityStatus(
    id: string,
    status: OpportunityStatus,
    note?: string,
  ): Observable<PartnershipOpportunity> {
    return this.http.post<PartnershipOpportunity>(`${this.base}/renewals/${id}/status`, {
      status,
      note,
    });
  }

  archiveOpportunity(id: string): Observable<PartnershipOpportunity> {
    return this.http.post<PartnershipOpportunity>(`${this.base}/renewals/${id}/archive`, {});
  }

  createOpportunityProposal(
    id: string,
    payload: CreateProposalFromOpportunityPayload = {},
  ): Observable<PartnershipOpportunity> {
    return this.http.post<PartnershipOpportunity>(
      `${this.base}/renewals/${id}/create-proposal`,
      payload,
    );
  }

  createOpportunitySow(id: string): Observable<PartnershipOpportunity> {
    return this.http.post<PartnershipOpportunity>(
      `${this.base}/renewals/${id}/create-sow`,
      {},
    );
  }

  addOpportunityTimelineEvent(
    id: string,
    payload: AddTimelineEventPayload,
  ): Observable<PartnershipOpportunity> {
    return this.http.post<PartnershipOpportunity>(
      `${this.base}/renewals/${id}/timeline`,
      payload,
    );
  }

  createOpportunityFromDelivery(
    deliveryId: string,
    type?: OpportunityType,
  ): Observable<PartnershipOpportunity> {
    return this.http.post<PartnershipOpportunity>(
      `${this.base}/renewals/create-from-delivery`,
      { deliveryId, ...(type ? { type } : {}) },
    );
  }

  createOpportunityFromReport(
    reportId: string,
    type?: OpportunityType,
  ): Observable<PartnershipOpportunity> {
    return this.http.post<PartnershipOpportunity>(
      `${this.base}/renewals/create-from-report`,
      { reportId, ...(type ? { type } : {}) },
    );
  }
}
