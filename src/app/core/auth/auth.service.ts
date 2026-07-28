import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { LoginRequest, RegisterRequest } from '../../shared/types/api.types';

export type SessionState =
  | { status: 'checking' }
  | { status: 'authenticated'; expiresAt: number }
  | { status: 'anonymous' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly token = signal<string | null>(null);
  readonly session = signal<SessionState>({ status: 'checking' });
  readonly isAuthenticated = computed(() => this.session().status === 'authenticated');

  accessToken(): string | null {
    return this.token();
  }

  async initialize(): Promise<void> {
    await this.refresh();
  }

  async login(request: LoginRequest): Promise<void> {
    const response = await firstValueFrom(this.authApi.login(request));
    this.setAuthenticated(response.accessToken, response.expiresIn);
  }

  async register(request: RegisterRequest): Promise<void> {
    const response = await firstValueFrom(this.authApi.register(request));
    this.setAuthenticated(response.accessToken, response.expiresIn);
  }

  async refresh(): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.authApi.refresh());
      this.setAuthenticated(response.accessToken, response.expiresIn);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authApi.logout());
    } catch {
      // Local session cleanup must still happen if the network call fails.
    } finally {
      this.clearSession();
    }
  }

  private setAuthenticated(accessToken: string, expiresIn: number): void {
    this.token.set(accessToken);
    this.session.set({ status: 'authenticated', expiresAt: Date.now() + expiresIn * 1000 });
  }

  private clearSession(): void {
    this.token.set(null);
    this.session.set({ status: 'anonymous' });
  }
}
