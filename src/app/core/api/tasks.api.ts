import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TaskDto, TaskRequest, UUID } from '../../shared/types/api.types';

@Injectable({ providedIn: 'root' })
export class TasksApi {
  private readonly http = inject(HttpClient);

  list(projectId: UUID): Observable<TaskDto[]> {
    return this.http.get<TaskDto[]>(this.baseUrl(projectId));
  }

  get(projectId: UUID, taskId: UUID): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${this.baseUrl(projectId)}/${taskId}`);
  }

  create(projectId: UUID, request: TaskRequest): Observable<TaskDto> {
    return this.http.post<TaskDto>(this.baseUrl(projectId), request);
  }

  update(projectId: UUID, taskId: UUID, request: TaskRequest): Observable<TaskDto> {
    return this.http.put<TaskDto>(`${this.baseUrl(projectId)}/${taskId}`, request);
  }

  delete(projectId: UUID, taskId: UUID): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(projectId)}/${taskId}`);
  }

  private baseUrl(projectId: UUID): string {
    return `${environment.apiBaseUrl}/projects/${projectId}/tasks`;
  }
}
