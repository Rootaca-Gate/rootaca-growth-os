import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportLocale, StudentProgressReport } from './report.models';

@Injectable({ providedIn: 'root' })
export class ReportApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getPreview(studentId: string, locale: ReportLocale): Observable<StudentProgressReport> {
    return this.http.get<StudentProgressReport>(`${this.baseUrl}/students/${studentId}/report`, {
      params: { locale },
    });
  }

  getPdf(studentId: string, locale: ReportLocale): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/students/${studentId}/report.pdf`, {
      params: { locale },
      responseType: 'blob',
    });
  }
}
