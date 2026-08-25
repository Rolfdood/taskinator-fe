import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { problemMessage } from '../../core/api/problem-detail';
import { UserApi } from '../../core/api/user.api';
import { UserDto, displayName } from '../../shared/types/api.types';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 class="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p class="mt-1 text-sm text-muted">Manage your Taskinator profile credentials.</p>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }
      @if (notice()) {
        <p class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          {{ notice() }}
        </p>
      }

      <section class="panel flex items-center gap-4 px-5 py-4">
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
        >
          {{ initial() }}
        </span>
        <div>
          <p class="font-semibold text-ink">{{ displayName(user()?.name) || 'Loading profile' }}</p>
          <p class="text-sm text-muted">{{ user()?.email || 'Loading profile' }}</p>
        </div>
      </section>

      <section class="panel px-5 py-4">
        <form [formGroup]="emailForm" (ngSubmit)="changeEmail()" class="grid gap-4">
          <h2 class="text-base font-semibold text-ink">Change email</h2>
          <div class="field">
            <label class="label" for="newEmail">New email</label>
            <input id="newEmail" class="input" type="email" formControlName="newEmail" />
          </div>
          <div>
            <button class="btn btn-primary" type="submit" [disabled]="emailForm.invalid || saving()">
              Update email
            </button>
          </div>
        </form>
      </section>

      <section class="panel px-5 py-4">
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="grid gap-4">
          <h2 class="text-base font-semibold text-ink">Change password</h2>
          <div class="field">
            <label class="label" for="currentPassword">Current password</label>
            <input id="currentPassword" class="input" type="password" formControlName="currentPassword" />
          </div>
          <div class="field">
            <label class="label" for="newPassword">New password</label>
            <input id="newPassword" class="input" type="password" formControlName="newPassword" />
          </div>
          <div>
            <button class="btn btn-primary" type="submit" [disabled]="passwordForm.invalid || saving()">
              Update password
            </button>
          </div>
        </form>
      </section>
    </main>
  `,
})
export class SettingsPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(UserApi);
  readonly displayName = displayName;
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

  initial(): string {
    const name = displayName(this.user()?.name);
    return name.trim().charAt(0).toUpperCase() || '?';
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
      this.error.set(problemMessage(error, { context: 'emailUpdate' }));
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
      this.error.set(problemMessage(error, { context: 'passwordUpdate' }));
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
