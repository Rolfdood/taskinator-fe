import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { problemMessage } from '../../core/api/problem-detail';
import { RolesApi } from '../../core/api/roles.api';
import { PROJECT_PERMISSIONS, ProjectPermission, RoleDto } from '../../shared/types/api.types';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <main class="flex flex-col gap-6">
      <header>
        <h2 class="text-xl font-bold tracking-tight text-ink">{{ editing() ? 'Edit role' : 'New role' }}</h2>
        <p class="mt-0.5 text-sm text-muted">Create project roles from explicit permission sets.</p>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <section class="panel px-5 py-4">
        <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-4">
          <div class="field">
            <label class="label" for="name">Role name</label>
            <input id="name" class="input" formControlName="name" placeholder="e.g. Editor" />
          </div>
          <fieldset class="grid gap-2 rounded-xl border border-line p-4">
            <legend class="px-1 text-xs font-semibold text-muted">Permissions</legend>
            @for (permission of permissions; track permission) {
              <label class="flex items-center gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand"
                  [checked]="selected().includes(permission)"
                  (change)="toggle(permission, $event)"
                />
                <span>{{ permission }}</span>
              </label>
            }
          </fieldset>
          <div class="flex items-center gap-2">
            <button class="btn btn-primary" type="submit" [disabled]="form.invalid || !selected().length || saving()">
              Save role
            </button>
            @if (editing()) {
              <button class="btn btn-secondary" type="button" (click)="resetForm()">Cancel</button>
            }
          </div>
        </form>
      </section>

      <section class="panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-line bg-surface-strong/60 text-xs font-semibold uppercase tracking-wide text-muted">
                <th class="px-5 py-3">Name</th>
                <th class="px-5 py-3">Permissions</th>
                <th class="px-5 py-3">Created</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (role of roles(); track role.id) {
                <tr>
                  <td class="px-5 py-3 font-semibold text-ink">{{ role.name }}</td>
                  <td class="px-5 py-3 text-muted">{{ role.permissions.join(', ') }}</td>
                  <td class="px-5 py-3 text-muted">{{ role.createdAt?.slice(0, 10) || 'Unknown' }}</td>
                  <td class="px-5 py-3">
                    <div class="flex justify-end gap-2">
                      <button class="btn btn-secondary" type="button" (click)="edit(role)">Edit</button>
                      <button class="btn btn-danger" type="button" (click)="openDelete(role)">Delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-5 py-14 text-center text-muted">No roles found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </main>

    @if (deleting()) {
      <app-confirm-dialog
        title="Delete role?"
        [message]="deleteMessage()"
        confirmLabel="Delete role"
        [busy]="saving()"
        (confirm)="confirmDelete()"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
})
export class RolesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(RolesApi);
  readonly permissions = PROJECT_PERMISSIONS;
  readonly roles = signal<RoleDto[]>([]);
  readonly selected = signal<ProjectPermission[]>([]);
  readonly editing = signal<RoleDto | null>(null);
  readonly deleting = signal<RoleDto | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  toggle(permission: ProjectPermission, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected.update((current) =>
      checked ? [...current, permission] : current.filter((value) => value !== permission),
    );
  }

  edit(role: RoleDto): void {
    this.editing.set(role);
    this.selected.set([...role.permissions]);
    this.form.setValue({ name: role.name });
  }

  resetForm(): void {
    this.editing.set(null);
    this.selected.set([]);
    this.form.reset({ name: '' });
  }

  openDelete(role: RoleDto): void {
    this.deleting.set(role);
  }

  deleteMessage(): string {
    const role = this.deleting();
    return role ? `Delete the "${role.name}" role? Members assigned to this role will lose those permissions.` : '';
  }

  async save(): Promise<void> {
    if (this.form.invalid || !this.selected().length) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const request = { name: this.form.controls.name.value, permissions: this.selected() };
      const existing = this.editing();
      if (existing) {
        await firstValueFrom(this.api.update(this.projectId(), existing.id, request));
      } else {
        await firstValueFrom(this.api.create(this.projectId(), request));
      }
      this.resetForm();
      await this.load();
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete(): Promise<void> {
    const role = this.deleting();
    if (!role) {
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.api.delete(this.projectId(), role.id));
      this.deleting.set(null);
      await this.load();
    } catch (error) {
      this.error.set(problemMessage(error));
      this.deleting.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.roles.set(await firstValueFrom(this.api.list(this.projectId())));
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  private projectId(): string {
    return this.route.parent?.snapshot.paramMap.get('projectId') ?? '';
  }
}
