import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MemberDto, MemberRequest, MemberRoleRequest, UUID } from '../../shared/types/api.types';

@Injectable({ providedIn: 'root' })
export class MembersApi {
  private readonly http = inject(HttpClient);

  list(projectId: UUID): Observable<MemberDto[]> {
    return this.http.get<MemberDto[]>(this.baseUrl(projectId));
  }

  add(projectId: UUID, request: MemberRequest): Observable<MemberDto> {
    return this.http.post<MemberDto>(this.baseUrl(projectId), request);
  }

  update(projectId: UUID, userId: UUID, request: MemberRoleRequest): Observable<MemberDto> {
    return this.http.put<MemberDto>(`${this.baseUrl(projectId)}/${userId}`, request);
  }

  remove(projectId: UUID, userId: UUID): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(projectId)}/${userId}`);
  }

  private baseUrl(projectId: UUID): string {
    return `${environment.apiBaseUrl}/projects/${projectId}/members`;
  }
}
