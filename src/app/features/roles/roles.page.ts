import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { problemMessage } from '../../core/api/problem-detail';
import { RolesApi } from '../../core/api/roles.api';
import { PROJECT_PERMISSIONS, ProjectPermission, RoleDto } from '../../shared/types/api.types';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel feature">
      <header>
        <h2>{{ editing() ? 'Edit role' : 'New role' }}</h2>
        <p class="muted">Create project roles from explicit permission sets.</p>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="field">
          <label for="name">Role name</label>
          <input id="name" formControlName="name" />
        </div>
        <fieldset>
          <legend>Permissions</legend>
          @for (permission of permissions; track permission) {
            <label class="check">
              <input
                type="checkbox"
                [checked]="selected().includes(permission)"
                (change)="toggle(permission, $event)"
              />
              <span>{{ permission }}</span>
            </label>
          }
        </fieldset>
        <div class="actions">
          <button class="button" type="submit" [disabled]="form.invalid || !selected().length || saving()">Save role</button>
          @if (editing()) {
            <button class="button secondary" type="button" (click)="resetForm()">Cancel</button>
          }
        </div>
      </form>
    </section>

    <section class="panel table-panel">
      @if (!roles().length) {
        <p class="muted">No roles found.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Permissions</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (role of roles(); track role.id) {
              <tr>
                <td><strong>{{ role.name }}</strong></td>
                <td>{{ role.permissions.join(', ') }}</td>
                <td>{{ role.createdAt?.slice(0, 10) || 'Unknown' }}</td>
                <td class="actions">
                  <button class="button secondary" type="button" (click)="edit(role)">Edit</button>
                  <button class="button danger" type="button" (click)="delete(role)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    .feature,
    .table-panel {
      display: grid;
      gap: 1rem;
      padding: 1rem;
    }
    form {
      display: grid;
      gap: 0.85rem;
    }
    h2 {
      margin: 0;
    }
    fieldset {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      display: grid;
      gap: 0.5rem;
      margin: 0;
      padding: 0.8rem;
    }
    legend {
      color: var(--color-muted);
      font-weight: 800;
    }
    .check {
      align-items: center;
      display: flex;
      gap: 0.5rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th,
    td {
      border-bottom: 1px solid var(--color-border);
      padding: 0.7rem;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--color-muted);
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    @media (max-width: 760px) {
      .table-panel {
        overflow-x: auto;
      }
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

  async save(): Promise<void> {
    if (this.form.invalid || !this.selected().length) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
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

  async delete(role: RoleDto): Promise<void> {
    if (!confirm(`Delete ${role.name}?`)) {
      return;
    }
    try {
      await firstValueFrom(this.api.delete(this.projectId(), role.id));
      await this.load();
    } catch (error) {
      this.error.set(problemMessage(error));
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
