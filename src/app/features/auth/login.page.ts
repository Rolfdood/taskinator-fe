import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { problemMessage } from '../../core/api/problem-detail';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-canvas p-4">
      <form class="panel flex w-full max-w-md flex-col gap-5 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <header>
          <p class="text-xs font-bold uppercase tracking-wider text-brand">Taskinator</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-ink">Log in</h1>
          <p class="mt-1 text-sm text-muted">Access your projects, tasks, members, and roles.</p>
        </header>

        @if (error()) {
          <p class="error-banner">{{ error() }}</p>
        }

        <div class="field">
          <label class="label" for="email">Email</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
        </div>

        <div class="field">
          <label class="label" for="password">Password</label>
          <input
            id="password"
            class="input"
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
        </div>

        <button class="btn btn-primary" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Logging in' : 'Log in' }}
        </button>

        <p class="text-sm text-muted">
          No account?
          <a routerLink="/register" class="font-semibold text-brand hover:text-brand-strong">Create one</a>
        </p>
      </form>
    </main>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl('/app/projects');
    } catch (error) {
      this.error.set(problemMessage(error, { context: 'login' }));
    } finally {
      this.loading.set(false);
    }
  }
}
