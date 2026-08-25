import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, Trash, Users, ShieldCheck } from 'lucide-angular';
import { ProjectsApi } from '../../core/api/projects.api';
import { problemMessage } from '../../core/api/problem-detail';
import { ProjectDto } from '../../shared/types/api.types';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { MenuComponent, MenuItem } from '../../shared/ui/menu.component';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [RouterLink, RouterOutlet, LucideAngularModule, MenuComponent, ConfirmDialogComponent],
  template: `
    <main class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <header class="panel flex items-start justify-between gap-4 px-5 py-4">
        <div class="min-w-0">
          <a routerLink="/app/projects" class="text-xs font-semibold text-muted hover:text-ink">
            ← Projects
          </a>
          <h1 class="mt-1 truncate text-2xl font-bold tracking-tight text-ink">
            {{ project()?.name || 'Project' }}
          </h1>
          <p class="mt-1 text-sm text-muted">{{ project()?.description || 'No description' }}</p>
        </div>
        <app-menu [items]="settingsItems()" label="Project settings" />
      </header>

      <router-outlet />
    </main>

    @if (deleting()) {
      <app-confirm-dialog
        title="Delete project?"
        [message]="deleteMessage()"
        confirmLabel="Delete project"
        [busy]="deletingBusy()"
        (confirm)="confirmDelete()"
        (cancelled)="deleting.set(false)"
      />
    }
  `,
})
export class ProjectDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ProjectsApi);

  readonly membersIcon = Users;
  readonly rolesIcon = ShieldCheck;
  readonly trashIcon = Trash;

  readonly projects = signal<ProjectDto[]>([]);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly deletingBusy = signal(false);
  readonly projectId = computed(() => this.route.snapshot.paramMap.get('projectId') ?? '');
  readonly project = computed(
    () => this.projects().find((project) => project.id === this.projectId()) ?? null,
  );

  async ngOnInit(): Promise<void> {
    try {
      this.projects.set(await firstValueFrom(this.api.list()));
      if (!this.project()) {
        this.error.set('Project not found.');
      }
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  settingsItems(): MenuItem[] {
    return [
      {
        label: 'Members',
        icon: this.membersIcon,
        onSelect: () => this.navigate('members'),
      },
      {
        label: 'Roles',
        icon: this.rolesIcon,
        onSelect: () => this.navigate('roles'),
      },
      {
        label: 'Delete project',
        icon: this.trashIcon,
        danger: true,
        onSelect: () => this.deleting.set(true),
      },
    ];
  }

  navigate(section: string): void {
    void this.router.navigate(['/app/projects', this.projectId(), section]);
  }

  deleteMessage(): string {
    const project = this.project();
    return project
      ? `Delete "${project.name}"? Tasks, documents, and other information related to this project will be permanently deleted. This action cannot be undone.`
      : '';
  }

  async confirmDelete(): Promise<void> {
    this.deletingBusy.set(true);
    try {
      await firstValueFrom(this.api.delete(this.projectId()));
      this.deleting.set(false);
      await this.router.navigate(['/app/projects']);
    } catch (error) {
      this.error.set(problemMessage(error));
      this.deleting.set(false);
    } finally {
      this.deletingBusy.set(false);
    }
  }
}
