import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MembersApi } from '../../core/api/members.api';
import { problemMessage } from '../../core/api/problem-detail';
import { RolesApi } from '../../core/api/roles.api';
import { MemberDto, RoleDto, displayName } from '../../shared/types/api.types';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';

@Component({
  selector: 'app-members-page',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <main class="flex flex-col gap-6">
      <header>
        <h2 class="text-xl font-bold tracking-tight text-ink">Members</h2>
        <p class="mt-0.5 text-sm text-muted">Add people to this project and manage their role.</p>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <section class="panel px-5 py-4">
        <form [formGroup]="form" (ngSubmit)="add()" class="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div class="field">
            <label class="label" for="email">Email</label>
            <input id="email" class="input" type="email" formControlName="email" placeholder="name@example.com" />
          </div>
          <div class="field">
            <label class="label" for="roleId">Role</label>
            <select id="roleId" class="input" formControlName="roleId">
              <option value="">Select role</option>
              @for (role of roles(); track role.id) {
                <option [value]="role.id">{{ role.name }}</option>
              }
            </select>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || saving()">Add member</button>
        </form>
      </section>

      <section class="panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-line bg-surface-strong/60 text-xs font-semibold uppercase tracking-wide text-muted">
                <th class="px-5 py-3">Email</th>
                <th class="px-5 py-3">Name</th>
                <th class="px-5 py-3">Role</th>
                <th class="px-5 py-3">Joined</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (member of members(); track member.userId) {
                <tr>
                  <td class="px-5 py-3 text-ink">{{ member.email }}</td>
                  <td class="px-5 py-3 text-muted">{{ memberDisplayName(member) || '—' }}</td>
                  <td class="px-5 py-3">
                    <select class="input max-w-52" [value]="member.roleId" (change)="changeRole(member, $event)">
                      @for (role of roles(); track role.id) {
                        <option [value]="role.id">{{ role.name }}</option>
                      }
                    </select>
                  </td>
                  <td class="px-5 py-3 text-muted">{{ member.joinedAt?.slice(0, 10) || 'Unknown' }}</td>
                  <td class="px-5 py-3">
                    <div class="flex justify-end">
                      <button class="btn btn-danger" type="button" (click)="remove(member)">Remove</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-5 py-14 text-center text-muted">No members found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </main>

    @if (removing()) {
      <app-confirm-dialog
        title="Remove member?"
        [message]="removeMessage()"
        confirmLabel="Remove"
        [busy]="saving()"
        (confirm)="confirmRemove()"
        (cancelled)="removing.set(null)"
      />
    }

    @if (roleChange()) {
      <app-confirm-dialog
        title="Change role?"
        [message]="roleChangeMessage()"
        confirmLabel="Change role"
        [busy]="saving()"
        (confirm)="confirmRoleChange()"
        (cancelled)="cancelRoleChange()"
      />
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
  readonly removing = signal<MemberDto | null>(null);
  readonly roleChange = signal<{ member: MemberDto; roleId: string } | null>(null);
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
    this.error.set(null);
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

  changeRole(member: MemberDto, event: Event): void {
    const roleId = (event.target as HTMLSelectElement).value;
    this.roleChange.set({ member, roleId });
  }

  remove(member: MemberDto): void {
    this.removing.set(member);
  }

  removeMessage(): string {
    const member = this.removing();
    return member ? `Remove ${member.email} from this project?` : '';
  }

  roleChangeMessage(): string {
    const change = this.roleChange();
    return change ? `Change ${change.member.email}'s role?` : '';
  }

  async confirmRemove(): Promise<void> {
    const member = this.removing();
    if (!member) {
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.membersApi.remove(this.projectId(), member.userId));
      this.removing.set(null);
      await this.loadMembers();
    } catch (error) {
      this.error.set(problemMessage(error));
      this.removing.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async confirmRoleChange(): Promise<void> {
    const change = this.roleChange();
    if (!change) {
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.membersApi.update(this.projectId(), change.member.userId, { roleId: change.roleId }),
      );
      this.roleChange.set(null);
      await this.loadMembers();
    } catch (error) {
      this.error.set(problemMessage(error));
      this.roleChange.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async cancelRoleChange(): Promise<void> {
    this.roleChange.set(null);
    await this.loadMembers();
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

  memberDisplayName(member: MemberDto): string {
    return displayName(member.name) || [member.firstName, member.lastName].filter(Boolean).join(' ');
  }
}
