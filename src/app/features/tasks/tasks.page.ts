import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MembersApi } from '../../core/api/members.api';
import { problemMessage } from '../../core/api/problem-detail';
import { TasksApi } from '../../core/api/tasks.api';
import { MemberDto, TASK_STATUSES, TaskDto, TaskStatus, groupTasksByStatus, toApiDateTime, toDateInputValue } from '../../shared/types/api.types';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel feature" [formGroup]="form">
      <header>
        <h2>{{ editing() ? 'Edit task' : 'New task' }}</h2>
      </header>

      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <form (ngSubmit)="save()">
        <div class="field">
          <label for="title">Title</label>
          <input id="title" formControlName="title" />
        </div>
        <div class="field">
          <label for="description">Description</label>
          <textarea id="description" formControlName="description"></textarea>
        </div>
        <div class="grid">
          <div class="field">
            <label for="status">Status</label>
            <select id="status" formControlName="status">
              @for (status of statuses; track status) {
                <option [value]="status">{{ status }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="dueDate">Due date</label>
            <input id="dueDate" type="date" formControlName="dueDate" />
          </div>
          <div class="field">
            <label for="assignedTo">Assignee</label>
            <select id="assignedTo" formControlName="assignedTo">
              <option value="">Unassigned</option>
              @for (member of members(); track member.userId) {
                <option [value]="member.userId">{{ member.email }}</option>
              }
            </select>
          </div>
        </div>
        <div class="actions">
          <button class="button" type="submit" [disabled]="form.invalid || saving()">Save task</button>
          @if (editing()) {
            <button class="button secondary" type="button" (click)="resetForm()">Cancel</button>
          }
        </div>
      </form>
    </section>

    <section class="task-board">
      @for (status of statuses; track status) {
        <article class="panel column">
          <h3>{{ status }}</h3>
          @for (task of grouped()[status]; track task.id) {
            <div class="task-card">
              <strong>{{ task.title }}</strong>
              <p class="muted">{{ task.description || 'No description' }}</p>
              <p class="muted">Due {{ toDate(task.dueDate) || 'not set' }}</p>
              <div class="actions">
                <button class="button secondary" type="button" (click)="edit(task)">Edit</button>
                <button class="button danger" type="button" (click)="delete(task)">Delete</button>
              </div>
            </div>
          } @empty {
            <p class="muted">No tasks.</p>
          }
        </article>
      }
    </section>
  `,
  styles: `
    .feature,
    .column {
      padding: 1rem;
    }
    form {
      display: grid;
      gap: 0.8rem;
    }
    h2,
    h3 {
      margin: 0 0 0.75rem;
    }
    .grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .task-board {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 1rem;
    }
    .task-card {
      border-top: 1px solid var(--color-border);
      display: grid;
      gap: 0.45rem;
      padding: 0.75rem 0;
    }
    .task-card p {
      margin: 0;
    }
    @media (max-width: 900px) {
      .task-board,
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class TasksPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tasksApi = inject(TasksApi);
  private readonly membersApi = inject(MembersApi);
  readonly statuses = TASK_STATUSES;
  readonly tasks = signal<TaskDto[]>([]);
  readonly members = signal<MemberDto[]>([]);
  readonly editing = signal<TaskDto | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
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

  edit(task: TaskDto): void {
    this.editing.set(task);
    this.form.setValue({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      dueDate: toDateInputValue(task.dueDate),
      assignedTo: task.assignedTo ?? '',
    });
  }

  resetForm(): void {
    this.editing.set(null);
    this.form.reset({ title: '', description: '', status: 'TODO', dueDate: '', assignedTo: '' });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const values = this.form.getRawValue();
      const request = {
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
      this.resetForm();
      await this.loadTasks();
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  async delete(task: TaskDto): Promise<void> {
    if (!confirm(`Delete ${task.title}?`)) {
      return;
    }
    try {
      await firstValueFrom(this.tasksApi.delete(this.projectId(), task.id));
      await this.loadTasks();
    } catch (error) {
      this.error.set(problemMessage(error));
    }
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
