import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProjectsApi } from '../../core/api/projects.api';
import { problemMessage } from '../../core/api/problem-detail';
import { ProjectDto } from '../../shared/types/api.types';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Projects</h1>
          <p class="muted">Create, search, edit, and delete project workspaces.</p>
        </div>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <section class="panel toolbar" [formGroup]="searchForm">
        <div class="field">
          <label for="query">Search by name</label>
          <input id="query" formControlName="query" (input)="search()" />
        </div>
      </section>

      <section class="panel form-panel">
        <form [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ editing() ? 'Edit project' : 'New project' }}</h2>
          <div class="field">
            <label for="name">Name</label>
            <input id="name" formControlName="name" />
          </div>
          <div class="field">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description"></textarea>
          </div>
          <div class="actions">
            <button class="button" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving' : editing() ? 'Save changes' : 'Create project' }}
            </button>
            @if (editing()) {
              <button class="button secondary" type="button" (click)="resetForm()">Cancel</button>
            }
          </div>
        </form>
      </section>

      <section class="panel list">
        @if (loading()) {
          <p class="muted">Loading projects</p>
        } @else if (!projects().length) {
          <p class="muted">No projects found.</p>
        } @else {
          @for (project of projects(); track project.id) {
            <article class="row">
              <div>
                <a [routerLink]="['/app/projects', project.id]" class="row-title">{{ project.name }}</a>
                <p class="muted">{{ project.description || 'No description' }}</p>
              </div>
              <div class="row-actions">
                <button class="button secondary" type="button" (click)="edit(project)">Edit</button>
                <button class="button danger" type="button" (click)="delete(project)">Delete</button>
              </div>
            </article>
          }
        }
      </section>
    </main>
  `,
  styles: `
    .page {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
    }
    .page-header {
      align-items: end;
      display: flex;
      justify-content: space-between;
    }
    h1, h2 {
      margin: 0;
    }
    .toolbar,
    .form-panel,
    .list {
      padding: 1rem;
    }
    form {
      display: grid;
      gap: 0.8rem;
    }
    .actions,
    .row-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .list {
      display: grid;
      gap: 0.75rem;
    }
    .row {
      align-items: center;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      padding: 0.75rem 0;
    }
    .row:last-child {
      border-bottom: 0;
    }
    .row-title {
      font-weight: 900;
      text-decoration: none;
    }
    @media (max-width: 680px) {
      .row {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `,
})
export class ProjectsPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ProjectsApi);
  readonly projects = signal<ProjectDto[]>([]);
  readonly editing = signal<ProjectDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchForm = this.fb.group({ query: [''] });
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.projects.set(await firstValueFrom(this.api.list()));
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async search(): Promise<void> {
    const query = this.searchForm.controls.query.value.trim();
    if (!query) {
      await this.load();
      return;
    }
    try {
      this.projects.set(await firstValueFrom(this.api.search(query)));
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  edit(project: ProjectDto): void {
    this.editing.set(project);
    this.form.setValue({ name: project.name, description: project.description ?? '' });
  }

  resetForm(): void {
    this.editing.set(null);
    this.form.reset({ name: '', description: '' });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const request = this.form.getRawValue();
    try {
      const existing = this.editing();
      if (existing) {
        await firstValueFrom(this.api.update(existing.id, request));
      } else {
        await firstValueFrom(this.api.create(request));
      }
      this.resetForm();
      await this.load();
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  async delete(project: ProjectDto): Promise<void> {
    if (!confirm(`Delete ${project.name}?`)) {
      return;
    }
    try {
      await firstValueFrom(this.api.delete(project.id));
      await this.load();
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }
}
