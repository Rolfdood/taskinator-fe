import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <main class="auth-shell">
      <section class="auth-panel panel">
        <a routerLink="/login" class="brand">Taskinator</a>
        <router-outlet />
      </section>
    </main>
  `,
  styles: `
    .auth-shell {
      align-items: center;
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: 1.25rem;
    }
    .auth-panel {
      display: grid;
      gap: 1.25rem;
      max-width: 28rem;
      padding: 1.25rem;
      width: 100%;
    }
    .brand {
      font-size: 1.3rem;
      font-weight: 900;
      text-decoration: none;
    }
  `,
})
export class AuthShellComponent {}
