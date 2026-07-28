import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserApi } from '../api/user.api';
import { AuthService } from '../auth/auth.service';
import { UserDto } from '../../shared/types/api.types';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/app/projects">Taskinator</a>
        <nav>
          <a routerLink="/app/projects" routerLinkActive="active">Projects</a>
          <a routerLink="/app/settings" routerLinkActive="active">Settings</a>
        </nav>
      </aside>

      <section class="workspace">
        <header class="topbar">
          <div>
            <p class="muted">Signed in</p>
            <strong>{{ userLabel() }}</strong>
          </div>
          <button class="button secondary" type="button" (click)="logout()">Log out</button>
        </header>
        <router-outlet />
      </section>
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: 16rem 1fr;
      min-height: 100vh;
    }
    .sidebar {
      background: #0a0a0a;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.25rem;
    }
    .brand {
      font-size: 1.25rem;
      font-weight: 900;
      text-decoration: none;
    }
    nav {
      display: grid;
      gap: 0.4rem;
    }
    nav a {
      border-radius: 6px;
      color: #d8d8d8;
      padding: 0.65rem 0.75rem;
      text-decoration: none;
    }
    nav a.active,
    nav a:hover {
      background: #fff;
      color: #0a0a0a;
    }
    .workspace {
      background: var(--color-surface);
      min-width: 0;
    }
    .topbar {
      align-items: center;
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      min-height: 4.5rem;
      padding: 0.9rem 1.25rem;
    }
    .topbar p {
      margin: 0;
    }
    @media (max-width: 760px) {
      .shell {
        grid-template-columns: 1fr;
      }
      .sidebar {
        flex-direction: row;
        overflow-x: auto;
      }
      nav {
        grid-auto-flow: column;
      }
    }
  `,
})
export class AppShellComponent implements OnInit {
  private readonly userApi = inject(UserApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly user = signal<UserDto | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.user.set(await firstValueFrom(this.userApi.me()));
    } catch {
      this.user.set(null);
    }
  }

  userLabel(): string {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName} · ${user.email}` : 'Loading profile';
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
