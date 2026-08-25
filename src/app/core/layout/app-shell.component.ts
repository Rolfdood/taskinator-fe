import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FolderKanban, LucideAngularModule, LogOut, Settings } from 'lucide-angular';
import { UserApi } from '../api/user.api';
import { AuthService } from '../auth/auth.service';
import { UserDto, displayName } from '../../shared/types/api.types';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet, LucideAngularModule],
  template: `
    <div class="flex min-h-screen">
      <aside class="sticky top-0 flex h-screen w-16 shrink-0 flex-col gap-6 bg-ink px-3 py-4 lg:w-64 lg:px-4">
        <a routerLink="/app/projects" class="flex items-center gap-2.5 px-1.5 lg:px-2">
          <span class="hidden text-lg font-bold text-white lg:inline">Taskinator</span>
        </a>

        <nav class="flex flex-1 flex-col gap-1">
          <a
            routerLink="/app/projects"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors {{
              navLinkClass('/app/projects')
            }}"
          >
            <lucide-icon [img]="projectsIcon" size="16"></lucide-icon>
            <span class="hidden lg:inline">Projects</span>
          </a>
          <a
            routerLink="/app/settings"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors {{
              navLinkClass('/app/settings')
            }}"
          >
            <lucide-icon [img]="settingsIcon" size="16"></lucide-icon>
            <span class="hidden lg:inline">Settings</span>
          </a>
        </nav>

        <button
          type="button"
          (click)="logout()"
          class="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <lucide-icon [img]="logoutIcon" size="16"></lucide-icon>
          <span class="hidden lg:inline">Log out</span>
        </button>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center gap-4 border-b border-line bg-surface px-4 py-3 sm:px-6">
          <div class="min-w-0">
            <p class="text-xs text-muted">Signed in</p>
            <strong class="block truncate text-sm text-ink">{{ userLabel() }}</strong>
          </div>
        </header>

        <main class="flex-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
  `,
})
export class AppShellComponent implements OnInit {
  private readonly userApi = inject(UserApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly logoutIcon = LogOut;
  readonly projectsIcon = FolderKanban;
  readonly settingsIcon = Settings;
  readonly user = signal<UserDto | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.user.set(await firstValueFrom(this.userApi.me()));
    } catch {
      this.user.set(null);
    }
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  navLinkClass(path: string): string {
    return this.isActive(path)
      ? 'bg-white text-ink'
      : 'text-white hover:bg-white/10';
  }

  userLabel(): string {
    const user = this.user();
    return user ? `${displayName(user.name)} · ${user.email}` : 'Loading profile';
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
