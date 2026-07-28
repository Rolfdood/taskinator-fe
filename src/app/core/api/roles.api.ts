import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleDto, RoleRequest, UUID } from '../../shared/types/api.types';

@Injectable({ providedIn: 'root' })
export class RolesApi {
  private readonly http = inject(HttpClient);

  list(projectId: UUID): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(this.baseUrl(projectId));
  }

  create(projectId: UUID, request: RoleRequest): Observable<RoleDto> {
    return this.http.post<RoleDto>(this.baseUrl(projectId), request);
  }

  update(projectId: UUID, roleId: UUID, request: RoleRequest): Observable<RoleDto> {
    return this.http.put<RoleDto>(`${this.baseUrl(projectId)}/${roleId}`, request);
  }

  delete(projectId: UUID, roleId: UUID): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(projectId)}/${roleId}`);
  }

  private baseUrl(projectId: UUID): string {
    return `${environment.apiBaseUrl}/projects/${projectId}/roles`;
  }
}
