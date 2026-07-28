import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { problemMessage } from '../../core/api/problem-detail';
import { UserApi } from '../../core/api/user.api';
import { UserDto } from '../../shared/types/api.types';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="page">
      <header>
        <h1>Settings</h1>
        <p class="muted">Manage your Taskinator profile credentials.</p>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }
      @if (notice()) {
        <p class="notice">{{ notice() }}</p>
      }

      <section class="panel profile">
        <h2>Profile</h2>
        <p><strong>{{ user()?.firstName }} {{ user()?.lastName }}</strong></p>
        <p class="muted">{{ user()?.email || 'Loading profile' }}</p>
      </section>

      <section class="panel form-panel">
        <form [formGroup]="emailForm" (ngSubmit)="changeEmail()">
          <h2>Change email</h2>
          <div class="field">
            <label for="newEmail">New email</label>
            <input id="newEmail" type="email" formControlName="newEmail" />
          </div>
          <button class="button" type="submit" [disabled]="emailForm.invalid || saving()">Update email</button>
        </form>
      </section>

      <section class="panel form-panel">
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <h2>Change password</h2>
          <div class="field">
            <label for="currentPassword">Current password</label>
            <input id="currentPassword" type="password" formControlName="currentPassword" />
          </div>
          <div class="field">
            <label for="newPassword">New password</label>
            <input id="newPassword" type="password" formControlName="newPassword" />
          </div>
          <button class="button" type="submit" [disabled]="passwordForm.invalid || saving()">Update password</button>
        </form>
      </section>
    </main>
  `,
  styles: `
    .page {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
    }
    h1,
    h2 {
      margin: 0;
    }
    .profile,
    .form-panel {
      padding: 1rem;
    }
    form {
      display: grid;
      gap: 0.85rem;
      max-width: 34rem;
    }
    .notice {
      background: var(--color-bg);
      border: 1px solid var(--color-border-strong);
      border-radius: 6px;
      padding: 0.75rem;
    }
  `,
})
export class SettingsPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(UserApi);
  readonly user = signal<UserDto | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly emailForm = this.fb.group({
    newEmail: ['', [Validators.required, Validators.email]],
  });
  readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async changeEmail(): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.clearMessages();
    try {
      this.user.set(await firstValueFrom(this.api.changeEmail(this.emailForm.getRawValue())));
      this.emailForm.reset({ newEmail: '' });
      this.notice.set('Email updated.');
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(this.api.changePassword(this.passwordForm.getRawValue()));
      this.passwordForm.reset({ currentPassword: '', newPassword: '' });
      this.notice.set('Password updated.');
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.user.set(await firstValueFrom(this.api.me()));
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  private clearMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }
}
