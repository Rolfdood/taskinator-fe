import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-canvas p-4">
      <section class="panel flex w-full max-w-md flex-col gap-5 p-6">
        <a routerLink="/login" class="text-xl font-bold text-ink">Taskinator</a>
        <router-outlet />
      </section>
    </main>
  `,
})
export class AuthShellComponent {}
