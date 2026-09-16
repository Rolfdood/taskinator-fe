import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { problemMessage } from '../../core/api/problem-detail';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-canvas p-4">
      <form class="panel flex w-full max-w-md flex-col gap-5 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <header>
          <p class="text-xs font-bold uppercase tracking-wider text-brand">Taskinator</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-ink">Create account</h1>
          <p class="mt-1 text-sm text-muted">Start managing project work with your team.</p>
        </header>

        @if (error()) {
          <p class="error-banner">{{ error() }}</p>
        }

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="field">
            <label class="label" for="firstName">First name</label>
            <input id="firstName" class="input" formControlName="firstName" autocomplete="given-name" />
          </div>
          <div class="field">
            <label class="label" for="lastName">Last name</label>
            <input id="lastName" class="input" formControlName="lastName" autocomplete="family-name" />
          </div>
        </div>

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
            autocomplete="new-password"
          />
        </div>

        <button class="btn btn-primary" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Creating account' : 'Create account' }}
        </button>

        <p class="text-sm text-muted">
          Already registered?
          <a routerLink="/login" class="font-semibold text-brand hover:text-brand-strong">Log in</a>
        </p>
      </form>
    </main>
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
