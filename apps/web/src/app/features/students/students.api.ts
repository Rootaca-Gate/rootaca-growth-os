import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaginatedStudents,
  Student,
  StudentQuery,
  StudentStatus,
  StudentWritePayload,
} from './student.models';

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/students`;

  list(query: StudentQuery = {}): Observable<PaginatedStudents> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PaginatedStudents>(this.baseUrl, { params });
  }

  get(id: string): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/${id}`);
  }

  create(payload: StudentWritePayload): Observable<Student> {
    return this.http.post<Student>(this.baseUrl, payload);
  }

  update(id: string, payload: StudentWritePayload): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, status: StudentStatus): Observable<Student> {
    return this.http.patch<Student>(`${this.baseUrl}/${id}/status`, { status });
  }
}
