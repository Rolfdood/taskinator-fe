import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, Pencil, Plus, Trash } from 'lucide-angular';
import { MembersApi } from '../../core/api/members.api';
import { problemMessage } from '../../core/api/problem-detail';
import { TasksApi } from '../../core/api/tasks.api';
import {
  MemberDto,
  TASK_STATUSES,
  TaskDto,
  TaskRequest,
  TaskStatus,
  displayName,
  groupTasksByStatus,
  toApiDateTime,
  toDateInputValue,
} from '../../shared/types/api.types';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { DialogComponent } from '../../shared/ui/dialog.component';
import { MenuComponent, MenuItem } from '../../shared/ui/menu.component';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DragDropModule,
    LucideAngularModule,
    DialogComponent,
    ConfirmDialogComponent,
    MenuComponent,
  ],
  template: `
    <header class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-ink">Task Board</h2>
        <p class="mt-0.5 text-sm text-muted">Drag tasks between columns to update their status.</p>
      </div>
      <button class="btn btn-primary" type="button" (click)="openCreate()">
        <lucide-icon [img]="plusIcon" size="18"></lucide-icon>
        New task
      </button>
    </header>

    @if (error()) {
      <p class="error-banner">{{ error() }}</p>
    }

    <div class="grid gap-4 md:grid-cols-3" cdkDropListGroup>
      @for (status of statuses; track status) {
        <section
          class="panel flex min-h-0 flex-col"
          cdkDropList
          (cdkDropListDropped)="onDrop($event, status)"
        >
          <header class="flex items-center justify-between border-b border-line px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full" [class]="statusDot(status)"></span>
              <h3 class="text-sm font-semibold text-ink">{{ statusLabel(status) }}</h3>
            </div>
            <span class="rounded-full bg-surface-strong px-2.5 py-0.5 text-xs font-semibold text-muted">
              {{ grouped()[status].length }}
            </span>
          </header>

          <div class="flex flex-1 flex-col gap-3 p-3">
            @for (task of grouped()[status]; track task.id) {
              <article
                class="cursor-grab rounded-lg border border-line bg-surface p-3 shadow-sm transition-shadow hover:shadow-card active:cursor-grabbing"
                cdkDrag
                [cdkDragData]="task"
              >
                <div class="flex items-start justify-between gap-2">
                  <strong class="text-sm leading-snug text-ink">{{ task.title }}</strong>
                  <app-menu [items]="taskMenu(task)" [label]="'Actions for ' + task.title" />
                </div>
                @if (task.description) {
                  <p class="mt-1 text-xs leading-relaxed text-muted">{{ task.description }}</p>
                }
                <div class="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{{ toDate(task.dueDate) || 'No due date' }}</span>
                  <span>{{ task.assigneeName || 'Unassigned' }}</span>
                </div>
              </article>
            } @empty {
              <div
                class="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-xs text-muted"
              >
                Drop tasks here
              </div>
            }
          </div>
        </section>
      }
    </div>

    @if (formOpen()) {
      <app-dialog [title]="editing() ? 'Edit task' : 'New task'" (closed)="closeForm()">
        <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-4">
          @if (formError()) {
            <p class="error-banner">{{ formError() }}</p>
          }
          <div class="field">
            <label class="label" for="title">Title</label>
            <input id="title" class="input" formControlName="title" placeholder="e.g. Design landing page" />
          </div>
          <div class="field">
            <label class="label" for="description">Description</label>
            <textarea
              id="description"
              class="input min-h-20 resize-y"
              formControlName="description"
              placeholder="Optional details"
            ></textarea>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="field">
              <label class="label" for="status">Status</label>
              <select id="status" class="input" formControlName="status">
                @for (status of statuses; track status) {
                  <option [value]="status">{{ statusLabel(status) }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label class="label" for="dueDate">Due date</label>
              <input id="dueDate" class="input" type="date" formControlName="dueDate" />
            </div>
            <div class="field">
              <label class="label" for="assignedTo">Assignee</label>
              <select id="assignedTo" class="input" formControlName="assignedTo">
                <option value="">Unassigned</option>
                @for (member of members(); track member.userId) {
                  <option [value]="member.userId">{{ memberDisplayName(member) || member.email }}</option>
                }
              </select>
            </div>
          </div>
          <div class="mt-2 flex items-center justify-end gap-2">
            <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving' : editing() ? 'Save changes' : 'Create task' }}
            </button>
          </div>
        </form>
      </app-dialog>
    }

    @if (deleting()) {
      <app-confirm-dialog
        title="Delete task?"
        [message]="deleteMessage()"
        confirmLabel="Delete task"
        [busy]="saving()"
        (confirm)="confirmDelete()"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
})
export class TasksPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tasksApi = inject(TasksApi);
  private readonly membersApi = inject(MembersApi);

  readonly plusIcon = Plus;
  readonly editIcon = Pencil;
  readonly trashIcon = Trash;

  readonly statuses = TASK_STATUSES;
  readonly tasks = signal<TaskDto[]>([]);
  readonly members = signal<MemberDto[]>([]);
  readonly editing = signal<TaskDto | null>(null);
  readonly deleting = signal<TaskDto | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly grouped = computed(() => groupTasksByStatus(this.tasks()));
  readonly form = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    status: ['TODO' as TaskStatus, [Validators.required]],
    dueDate: [''],
    assignedTo: [''],
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadTasks(), this.loadMembers()]);
  }

  toDate(value: string | null | undefined): string {
    return toDateInputValue(value);
  }

  memberDisplayName(member: MemberDto): string {
    return displayName(member.name) || [member.firstName, member.lastName].filter(Boolean).join(' ');
  }

  statusDot(status: TaskStatus): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-amber-500';
      case 'DONE':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-400';
    }
  }

  statusLabel(status: TaskStatus): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'DONE':
        return 'Done';
      default:
        return 'To Do';
    }
  }

  onDrop(event: CdkDragDrop<unknown>, status: TaskStatus): void {
    const task = event.item.data as TaskDto;
    if (!task || task.status === status) {
      return;
    }
    const updated: TaskDto = { ...task, status };
    this.tasks.update((list) => list.map((item) => (item.id === task.id ? updated : item)));
    void this.moveTask(updated);
  }

  openCreate(): void {
    this.editing.set(null);
    this.formError.set(null);
    this.form.reset({ title: '', description: '', status: 'TODO', dueDate: '', assignedTo: '' });
    this.formOpen.set(true);
  }

  openEdit(task: TaskDto): void {
    this.editing.set(task);
    this.formError.set(null);
    this.form.setValue({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      dueDate: toDateInputValue(task.dueDate),
      assignedTo: task.assignedTo ?? '',
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.formError.set(null);
  }

  openDelete(task: TaskDto): void {
    this.deleting.set(task);
  }

  taskMenu(task: TaskDto): MenuItem[] {
    return [
      { label: 'Edit', icon: this.editIcon, onSelect: () => this.openEdit(task) },
      { label: 'Delete', icon: this.trashIcon, danger: true, onSelect: () => this.openDelete(task) },
    ];
  }

  deleteMessage(): string {
    const task = this.deleting();
    return task ? `Delete "${task.title}"? This action cannot be undone.` : '';
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    try {
      const values = this.form.getRawValue();
      const request: TaskRequest = {
        title: values.title,
        description: values.description,
        status: values.status,
        dueDate: toApiDateTime(values.dueDate),
        assignedTo: values.assignedTo || null,
      };
      const existing = this.editing();
      if (existing) {
        await firstValueFrom(this.tasksApi.update(this.projectId(), existing.id, request));
      } else {
        await firstValueFrom(this.tasksApi.create(this.projectId(), request));
      }
      this.closeForm();
      await this.loadTasks();
    } catch (error) {
      this.formError.set(problemMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete(): Promise<void> {
    const task = this.deleting();
    if (!task) {
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.tasksApi.delete(this.projectId(), task.id));
      this.deleting.set(null);
      await this.loadTasks();
    } catch (error) {
      this.error.set(problemMessage(error));
      this.deleting.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  private async moveTask(task: TaskDto): Promise<void> {
    try {
      await firstValueFrom(this.tasksApi.update(this.projectId(), task.id, this.toRequest(task)));
      await this.loadTasks();
    } catch (error) {
      this.error.set(problemMessage(error));
      await this.loadTasks();
    }
  }

  private toRequest(task: TaskDto): TaskRequest {
    return {
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      dueDate: task.dueDate ?? null,
      assignedTo: task.assignedTo ?? null,
    };
  }

  private async loadTasks(): Promise<void> {
    try {
      this.tasks.set(await firstValueFrom(this.tasksApi.list(this.projectId())));
    } catch (error) {
      this.error.set(problemMessage(error));
    }
  }

  private async loadMembers(): Promise<void> {
    try {
      this.members.set(await firstValueFrom(this.membersApi.list(this.projectId())));
    } catch {
      this.members.set([]);
    }
  }

  private projectId(): string {
    return this.route.parent?.snapshot.paramMap.get('projectId') ?? '';
  }
}
