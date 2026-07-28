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
    <main class="auth-page">
      <form class="panel auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <header>
          <p class="eyebrow">Taskinator</p>
          <h1>Log in</h1>
          <p class="muted">Access your projects, tasks, members, and roles.</p>
        </header>

        @if (error()) {
          <p class="error-banner">{{ error() }}</p>
        }

        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
        </div>

        <button class="button" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Logging in' : 'Log in' }}
        </button>

        <p class="muted">No account? <a routerLink="/register">Create one</a></p>
      </form>
    </main>
  `,
  styles: `
    .auth-page {
      align-items: center;
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: 1.25rem;
    }
    .auth-card {
      display: grid;
      gap: 1rem;
      max-width: 28rem;
      padding: 1.25rem;
      width: 100%;
    }
    h1 {
      font-size: 1.8rem;
      margin: 0.2rem 0;
    }
    .eyebrow {
      color: var(--color-muted);
      font-size: 0.8rem;
      font-weight: 900;
      letter-spacing: 0;
      margin: 0;
      text-transform: uppercase;
    }
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
