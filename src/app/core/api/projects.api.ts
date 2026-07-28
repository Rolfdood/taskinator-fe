import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectDto, ProjectRequest, UUID } from '../../shared/types/api.types';

@Injectable({ providedIn: 'root' })
export class ProjectsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/projects`;

  list(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(this.baseUrl);
  }

  search(name: string): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.baseUrl}/search`, { params: { name } });
  }

  create(request: ProjectRequest): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(this.baseUrl, request);
  }

  update(projectId: UUID, request: ProjectRequest): Observable<ProjectDto> {
    return this.http.put<ProjectDto>(`${this.baseUrl}/${projectId}`, request);
  }

  delete(projectId: UUID): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${projectId}`);
  }
}
