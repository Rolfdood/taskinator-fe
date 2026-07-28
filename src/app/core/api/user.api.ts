import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDto } from '../../shared/types/api.types';

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);

  me(): Observable<UserDto> {
    return this.http.get<UserDto>(`${environment.apiBaseUrl}/me`);
  }

  changeEmail(request: ChangeEmailRequest): Observable<UserDto> {
    return this.http.post<UserDto>(`${environment.apiBaseUrl}/me/email`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/me/password`, request);
  }
}
