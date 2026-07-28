import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { problemMessage } from '../../core/api/problem-detail';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <form class="panel auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <header>
          <p class="eyebrow">Taskinator</p>
          <h1>Create account</h1>
          <p class="muted">Start managing project work with your team.</p>
        </header>

        @if (error()) {
          <p class="error-banner">{{ error() }}</p>
        }

        <div class="name-grid">
          <div class="field">
            <label for="firstName">First name</label>
            <input id="firstName" formControlName="firstName" autocomplete="given-name" />
          </div>
          <div class="field">
            <label for="lastName">Last name</label>
            <input id="lastName" formControlName="lastName" autocomplete="family-name" />
          </div>
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" />
        </div>

        <button class="button" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Creating account' : 'Create account' }}
        </button>

        <p class="muted">Already registered? <a routerLink="/login">Log in</a></p>
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
      max-width: 32rem;
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
    .name-grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 620px) {
      .name-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
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
      await this.auth.register(this.form.getRawValue());
      await this.router.navigateByUrl('/app/projects');
    } catch (error) {
      this.error.set(problemMessage(error, { context: 'register' }));
    } finally {
      this.loading.set(false);
    }
  }
}
