import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MembersApi } from '../../core/api/members.api';
import { problemMessage } from '../../core/api/problem-detail';
import { RolesApi } from '../../core/api/roles.api';
import { MemberDto, RoleDto } from '../../shared/types/api.types';

@Component({
  selector: 'app-members-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel feature">
      <header>
        <h2>Members</h2>
        <p class="muted">Add people to this project and manage their role.</p>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="add()">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />
        </div>
        <div class="field">
          <label for="roleId">Role</label>
          <select id="roleId" formControlName="roleId">
            <option value="">Select role</option>
            @for (role of roles(); track role.id) {
              <option [value]="role.id">{{ role.name }}</option>
            }
          </select>
        </div>
        <button class="button" type="submit" [disabled]="form.invalid || saving()">Add member</button>
      </form>
    </section>

    <section class="panel table-panel">
      @if (!members().length) {
        <p class="muted">No members found.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (member of members(); track member.userId) {
              <tr>
                <td>{{ member.email }}</td>
                <td>{{ member.firstName || '' }} {{ member.lastName || '' }}</td>
                <td>
                  <select [value]="member.roleId" (change)="changeRole(member, $event)">
                    @for (role of roles(); track role.id) {
                      <option [value]="role.id">{{ role.name }}</option>
                    }
                  </select>
                </td>
                <td>{{ member.joinedAt?.slice(0, 10) || 'Unknown' }}</td>
                <td>
                  <button class="button danger" type="button" (click)="remove(member)">Remove</button>
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
      gap: 0.75rem;
      grid-template-columns: 1.5fr 1fr auto;
      align-items: end;
    }
    h2 {
      margin: 0;
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
    }
    th {
      color: var(--color-muted);
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    select {
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 0.45rem;
    }
    @media (max-width: 760px) {
      form {
        grid-template-columns: 1fr;
      }
      .table-panel {
        overflow-x: auto;
      }
    }
  `,
})
export class MembersPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly membersApi = inject(MembersApi);
  private readonly rolesApi = inject(RolesApi);
  readonly members = signal<MemberDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    roleId: ['', [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadMembers(), this.loadRoles()]);
  }

  async add(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.membersApi.add(this.projectId(), this.form.getRawValue()));
      this.form.reset({ email: '', roleId: '' });
      await this.loadMembers();
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  async changeRole(member: MemberDto, event: Event): Promise<void> {
    const roleId = (event.target as HTMLSelectElement).value;
    if (!confirm(`Change ${member.email}'s role?`)) {
      await this.loadMembers();
      return;
    }
    try {
      await firstValueFrom(this.membersApi.update(this.projectId(), member.userId, { roleId }));
      await this.loadMembers();
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  async remove(member: MemberDto): Promise<void> {
    if (!confirm(`Remove ${member.email}?`)) {
      return;
    }
    try {
      await firstValueFrom(this.membersApi.remove(this.projectId(), member.userId));
      await this.loadMembers();
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  private async loadMembers(): Promise<void> {
    try {
      this.members.set(await firstValueFrom(this.membersApi.list(this.projectId())));
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  private async loadRoles(): Promise<void> {
    try {
      this.roles.set(await firstValueFrom(this.rolesApi.list(this.projectId())));
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  private projectId(): string {
    return this.route.parent?.snapshot.paramMap.get('projectId') ?? '';
  }
}
