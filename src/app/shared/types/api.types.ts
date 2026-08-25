export type UUID = string;

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type ProjectPermission =
  | 'PROJECT_VIEW'
  | 'PROJECT_EDIT'
  | 'PROJECT_DELETE'
  | 'MEMBER_MANAGE'
  | 'TASK_CREATE'
  | 'TASK_EDIT'
  | 'TASK_DELETE';

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
}

export interface NameDto {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  fullName?: string | null;
}

export interface UserDto {
  id: UUID;
  email: string;
  name: NameDto;
}

export interface ProjectDto {
  id: UUID;
  name: string;
  description?: string | null;
  createdAt?: string;
}

export interface ProjectRequest {
  name: string;
  description?: string | null;
}

export interface TaskDto {
  id: UUID;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  assignedTo?: UUID | null;
  assigneeName?: string | null;
}

export interface TaskRequest {
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  assignedTo?: UUID | null;
}

export interface MemberDto {
  userId: UUID;
  email: string;
  name?: NameDto;
  firstName?: string;
  lastName?: string;
  roleId: UUID;
  roleName: string;
  joinedAt?: string;
}

export interface MemberRequest {
  email: string;
  roleId: UUID;
}

export interface MemberRoleRequest {
  roleId: UUID;
}

export interface RoleDto {
  id: UUID;
  name: string;
  permissions: ProjectPermission[];
  createdAt?: string;
}

export interface RoleRequest {
  name: string;
  permissions: ProjectPermission[];
}

export type TaskGroups = Record<TaskStatus, TaskDto[]>;

export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export const PROJECT_PERMISSIONS: ProjectPermission[] = [
  'PROJECT_VIEW',
  'PROJECT_EDIT',
  'PROJECT_DELETE',
  'MEMBER_MANAGE',
  'TASK_CREATE',
  'TASK_EDIT',
  'TASK_DELETE',
];

export function groupTasksByStatus(tasks: TaskDto[]): TaskGroups {
  return tasks.reduce<TaskGroups>(
    (groups, task) => {
      groups[task.status].push(task);
      return groups;
    },
    { TODO: [], IN_PROGRESS: [], DONE: [] },
  );
}

export function toApiDateTime(value: string | null): string | null {
  return value ? `${value}T00:00:00` : null;
}

export function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

export function displayName(name?: NameDto | null): string {
  if (!name) {
    return '';
  }
  if (name.fullName) {
    return name.fullName;
  }
  return [name.firstName, name.middleName, name.lastName, name.suffix]
    .filter((part) => part && part.trim().length > 0)
    .join(' ');
}
