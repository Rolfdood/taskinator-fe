import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProjectsApi } from '../../core/api/projects.api';
import { problemMessage } from '../../core/api/problem-detail';
import { ProjectDto } from '../../shared/types/api.types';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="page">
      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <header class="detail-header panel">
        <div>
          <a routerLink="/app/projects" class="back-link">Projects</a>
          <h1>{{ project()?.name || 'Project' }}</h1>
          <p class="muted">{{ project()?.description || 'No description' }}</p>
        </div>
        <nav>
          <a [routerLink]="['/app/projects', projectId(), 'tasks']" routerLinkActive="active">Tasks</a>
          <a [routerLink]="['/app/projects', projectId(), 'members']" routerLinkActive="active">Members</a>
          <a [routerLink]="['/app/projects', projectId(), 'roles']" routerLinkActive="active">Roles</a>
        </nav>
      </header>

      <router-outlet />
    </main>
  `,
  styles: `
    .page {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
    }
    .detail-header {
      display: grid;
      gap: 1rem;
      padding: 1rem;
    }
    h1 {
      margin: 0.2rem 0;
    }
    .back-link {
      color: var(--color-muted);
      font-size: 0.85rem;
      font-weight: 800;
      text-decoration: none;
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    nav a {
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      text-decoration: none;
    }
    nav a.active {
      background: var(--color-text);
      border-color: var(--color-text);
      color: var(--color-bg);
    }
  `,
})
export class ProjectDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProjectsApi);
  readonly projects = signal<ProjectDto[]>([]);
  readonly error = signal<string | null>(null);
  readonly projectId = computed(() => this.route.snapshot.paramMap.get('projectId') ?? '');
  readonly project = computed(() => this.projects().find((project) => project.id === this.projectId()) ?? null);

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
}
