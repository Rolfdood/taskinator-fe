import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, Pencil, Plus, Search, Trash } from 'lucide-angular';
import { ProjectsApi } from '../../core/api/projects.api';
import { problemMessage } from '../../core/api/problem-detail';
import { ProjectDto } from '../../shared/types/api.types';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { DialogComponent } from '../../shared/ui/dialog.component';
import { MenuComponent, MenuItem } from '../../shared/ui/menu.component';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    DialogComponent,
    ConfirmDialogComponent,
    MenuComponent,
  ],
  template: `
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header class="flex items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-ink">Projects</h1>
          <p class="mt-1 text-sm text-muted">Create, search, edit, and delete project workspaces.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="openCreate()">
          <lucide-icon [img]="plusIcon" size="18"></lucide-icon>
          New project
        </button>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <div class="relative">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <lucide-icon [img]="searchIcon" size="16"></lucide-icon>
        </span>
        <input
          class="input pl-9"
          type="search"
          placeholder="Search projects by name or description"
          [value]="query()"
          (input)="onSearch($event)"
        />
      </div>

      <section class="panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr
                class="border-b border-line bg-surface-strong/60 text-xs font-semibold uppercase tracking-wide text-muted"
              >
                <th class="px-5 py-3">Name</th>
                <th class="px-5 py-3">Description</th>
                <th class="px-5 py-3">Created</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (project of paged(); track project.id) {
                <tr
                  class="cursor-pointer transition-colors hover:bg-surface-strong/50"
                  tabindex="0"
                  (click)="openProject(project)"
                  (keydown.enter)="openProject(project)"
                >
                  <td class="px-5 py-4">
                    <span class="font-semibold text-ink">{{ project.name }}</span>
                  </td>
                  <td class="px-5 py-4 text-muted">{{ project.description || 'No description' }}</td>
                  <td class="px-5 py-4 text-muted">{{ project.createdAt?.slice(0, 10) || '—' }}</td>
                  <td class="px-5 py-4">
                    <div class="flex justify-end">
                      <app-menu [items]="menuFor(project)" [label]="'Actions for ' + project.name" />
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-5 py-14 text-center text-muted">
                    {{ loading() ? 'Loading projects' : 'No projects found.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (pageCount() > 1) {
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
            <p class="text-sm text-muted">
              Showing {{ startIndex() }}–{{ endIndex() }} of {{ filtered().length }}
            </p>
            <div class="flex items-center gap-2">
              <button class="btn btn-secondary" type="button" (click)="prevPage()" [disabled]="page() === 1">
                Previous
              </button>
              <span class="px-1 text-sm text-muted">Page {{ page() }} of {{ pageCount() }}</span>
              <button
                class="btn btn-secondary"
                type="button"
                (click)="nextPage()"
                [disabled]="page() === pageCount()"
              >
                Next
              </button>
            </div>
          </div>
        }
      </section>
    </main>

    @if (formOpen()) {
      <app-dialog [title]="editing() ? 'Edit project' : 'New project'" (closed)="closeForm()">
        <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-4">
          @if (formError()) {
            <p class="error-banner">{{ formError() }}</p>
          }
          <div class="field">
            <label class="label" for="name">Name</label>
            <input id="name" class="input" formControlName="name" placeholder="e.g. Website redesign" />
          </div>
          <div class="field">
            <label class="label" for="description">Description</label>
            <textarea
              id="description"
              class="input min-h-24 resize-y"
              formControlName="description"
              placeholder="What is this project about?"
            ></textarea>
          </div>
          <div class="mt-2 flex items-center justify-end gap-2">
            <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving' : editing() ? 'Save changes' : 'Create project' }}
            </button>
          </div>
        </form>
      </app-dialog>
    }

    @if (deleting()) {
      <app-confirm-dialog
        title="Delete project?"
        [message]="deleteMessage()"
        confirmLabel="Delete project"
        [busy]="saving()"
        (confirm)="confirmDelete()"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
})
export class ProjectsPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(ProjectsApi);
  private readonly router = inject(Router);

  readonly plusIcon = Plus;
  readonly searchIcon = Search;
  readonly editIcon = Pencil;
  readonly trashIcon = Trash;

  readonly projects = signal<ProjectDto[]>([]);
  readonly query = signal('');
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly formOpen = signal(false);
  readonly editing = signal<ProjectDto | null>(null);
  readonly deleting = signal<ProjectDto | null>(null);

  readonly pageSize = 10;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.projects();
    }
    return this.projects().filter(
      (project) =>
        project.name.toLowerCase().includes(q) ||
        (project.description ?? '').toLowerCase().includes(q),
    );
  });

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );

  readonly startIndex = computed(() => (this.page() - 1) * this.pageSize + 1);
  readonly endIndex = computed(() => Math.min(this.page() * this.pageSize, this.filtered().length));

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

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
      this.page.set(1);
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update((value) => Math.max(1, value - 1));
  }

  nextPage(): void {
    this.page.update((value) => Math.min(this.pageCount(), value + 1));
  }

  openProject(project: ProjectDto): void {
    void this.router.navigate(['/app/projects', project.id]);
  }

  openCreate(): void {
    this.editing.set(null);
    this.formError.set(null);
    this.form.reset({ name: '', description: '' });
    this.formOpen.set(true);
  }

  openEdit(project: ProjectDto): void {
    this.editing.set(project);
    this.formError.set(null);
    this.form.setValue({ name: project.name, description: project.description ?? '' });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.formError.set(null);
  }

  openDelete(project: ProjectDto): void {
    this.deleting.set(project);
  }

  menuFor(project: ProjectDto): MenuItem[] {
    return [
      { label: 'Edit', icon: this.editIcon, onSelect: () => this.openEdit(project) },
      { label: 'Delete', icon: this.trashIcon, danger: true, onSelect: () => this.openDelete(project) },
    ];
  }

  deleteMessage(): string {
    const project = this.deleting();
    return project
      ? `Delete "${project.name}"? Tasks, documents, and other information related to this project will be permanently deleted. This action cannot be undone.`
      : '';
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    const request = this.form.getRawValue();
    try {
      const existing = this.editing();
      if (existing) {
        await firstValueFrom(this.api.update(existing.id, request));
      } else {
        await firstValueFrom(this.api.create(request));
      }
      this.closeForm();
      await this.load();
    } catch (error) {
      this.formError.set(problemMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete(): Promise<void> {
    const project = this.deleting();
    if (!project) {
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.api.delete(project.id));
      this.deleting.set(null);
      await this.load();
    } catch (error) {
      this.error.set(problemMessage(error));
      this.deleting.set(null);
    } finally {
      this.saving.set(false);
    }
  }
}
