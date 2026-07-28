# Taskinator Angular Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate Angular frontend for the Taskinator Spring Boot API covering authentication, profile settings, projects, tasks, members, and project roles.

**Architecture:** The frontend is a separate repository named `taskinator-web`. It uses Angular standalone routing, typed API services, an auth/session service backed by Angular signals, and a credential-aware HTTP interceptor for bearer tokens and refresh-cookie session restore.

**Tech Stack:** Angular 22 latest stable, Tailwind CSS 4.3 latest stable, Angular CDK, TypeScript strict mode, standalone Angular APIs, RxJS, signals + services, Vitest or Angular default test runner, Playwright for E2E.

## Global Constraints

- Keep the Angular app in a separate repository, not inside this backend repo.
- Use Angular 22.0.8 or newer stable Angular 22 patch.
- Use Tailwind CSS 4.3.3 or newer stable Tailwind 4 patch.
- Use Angular CDK + Tailwind for UI primitives; do not use Angular Material or PrimeNG in v1.
- Store access tokens in memory only; do not persist access tokens to `localStorage` or `sessionStorage`.
- Send authenticated API requests with `Authorization: Bearer <accessToken>`.
- Call auth refresh requests with credentials so the backend HttpOnly `refreshToken` cookie is included.
- Assume production deployment uses same-site subdomains, such as `app.taskinator.com` and `api.taskinator.com`.
- Add only minimal backend support needed for CORS and credentialed frontend calls.

---

## Current API Summary

### Authentication

- `POST /api/v1/auth/register`
  - Request: `{ email, password, firstName, lastName }`
  - Response: `{ accessToken, expiresIn }`
  - Also sets HttpOnly `refreshToken` cookie.
- `POST /api/v1/auth/login`
  - Request: `{ email, password }`
  - Response: `{ accessToken, expiresIn }`
  - Also sets HttpOnly `refreshToken` cookie.
- `POST /api/v1/auth/refresh`
  - Uses `refreshToken` cookie.
  - Response: `{ accessToken, expiresIn }`
  - Also rotates the refresh cookie.
- `POST /api/v1/auth/logout`
  - Uses optional `refreshToken` cookie.
  - Clears the refresh cookie.

### User

- `GET /api/v1/me`
- `POST /api/v1/me/email`
  - Request: `{ newEmail }`
- `POST /api/v1/me/password`
  - Request: `{ currentPassword, newPassword }`

### Projects

- `GET /api/v1/projects`
- `GET /api/v1/projects/search?name=<query>`
- `POST /api/v1/projects`
  - Request: `{ name, description }`
- `PUT /api/v1/projects/{projectId}`
  - Request: `{ name, description }`
- `DELETE /api/v1/projects/{projectId}`

### Tasks

- `GET /api/v1/projects/{projectId}/tasks`
- `GET /api/v1/projects/{projectId}/tasks/{taskId}`
- `POST /api/v1/projects/{projectId}/tasks`
  - Request: `{ title, description, status, dueDate, assignedTo }`
- `PUT /api/v1/projects/{projectId}/tasks/{taskId}`
  - Request: `{ title, description, status, dueDate, assignedTo }`
- `DELETE /api/v1/projects/{projectId}/tasks/{taskId}`

### Members

- `GET /api/v1/projects/{projectId}/members`
- `POST /api/v1/projects/{projectId}/members`
  - Request: `{ email, roleId }`
- `PUT /api/v1/projects/{projectId}/members/{userId}`
  - Request: `{ roleId }`
- `DELETE /api/v1/projects/{projectId}/members/{userId}`

### Roles

- `GET /api/v1/projects/{projectId}/roles`
- `POST /api/v1/projects/{projectId}/roles`
  - Request: `{ name, permissions }`
- `PUT /api/v1/projects/{projectId}/roles/{roleId}`
  - Request: `{ name, permissions }`
- `DELETE /api/v1/projects/{projectId}/roles/{roleId}`

## Frontend Repository Structure

Create the frontend in a separate repo with this high-level structure:

```text
taskinator-web/
  src/
    app/
      core/
        api/
        auth/
        errors/
        layout/
      features/
        auth/
        projects/
        tasks/
        members/
        roles/
        settings/
      shared/
        ui/
        forms/
        types/
    environments/
```

- `core/api`: typed HTTP client wrappers and DTO contracts.
- `core/auth`: auth service, session signal, guards, and interceptor.
- `core/errors`: ProblemDetail parsing and toast/banner helpers.
- `core/layout`: authenticated app shell.
- `features/*`: route-level screens and feature-specific components.
- `shared/ui`: reusable Tailwind/CDK primitives such as dialogs, menus, confirm modal, empty states, and loading indicators.
- `shared/forms`: reusable validators and form field helpers.
- `shared/types`: shared enum and ID types.

## Task 1: Scaffold Angular Frontend Repo

**Files:**
- Create in separate repo: `package.json`
- Create in separate repo: `angular.json`
- Create in separate repo: `src/main.ts`
- Create in separate repo: `src/app/app.config.ts`
- Create in separate repo: `src/app/app.routes.ts`
- Create in separate repo: `src/styles.css`

**Interfaces:**
- Produces a strict Angular standalone app with Tailwind loaded globally.

- [ ] Create the app with Angular CLI:

```bash
npm init @angular@latest taskinator-web -- --routing --style=css --strict
```

- [ ] Install frontend dependencies:

```bash
npm install tailwindcss @tailwindcss/postcss @angular/cdk lucide-angular
npm install -D playwright
```

- [ ] Configure Tailwind 4 in `src/styles.css`:

```css
@import "tailwindcss";

:root {
  color-scheme: light;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

- [ ] Define environments:

```ts
export const environment = {
  apiBaseUrl: 'http://localhost:8080/api/v1',
};
```

- [ ] Verify:

```bash
npm run build
```

## Task 2: Add Backend CORS Support

**Files:**
- Modify: `src/main/resources/application.properties`
- Modify: `src/main/resources/application-dev.properties`
- Modify: `src/main/java/com/taskinator/taskinator/infrastructure/SecurityConfig.java`

**Interfaces:**
- Produces configurable CORS origin support for the separate frontend.

- [ ] Add properties:

```properties
application.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:4200}
```

- [ ] Enable CORS in `SecurityConfig` and register a `CorsConfigurationSource` bean that:
  - allows configured origins
  - allows credentials
  - allows `Authorization` and `Content-Type`
  - allows `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS`

- [ ] Add backend tests proving:
  - preflight from `http://localhost:4200` succeeds in dev
  - credentialed requests include the expected CORS headers

- [ ] Verify:

```bash
.\mvnw.cmd test
```

## Task 3: Define Frontend API Contracts

**Files:**
- Create in frontend repo: `src/app/shared/types/api.types.ts`
- Create in frontend repo: `src/app/core/api/problem-detail.ts`

**Interfaces:**
- Produces shared TypeScript contracts used by every API service.

- [ ] Define ID and enum types:

```ts
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
```

- [ ] Define DTO interfaces for auth, user, project, task, member, and role matching the current backend response shapes.

- [ ] Define `ProblemDetail`:

```ts
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}
```

- [ ] Add unit tests for any date conversion helpers used by tasks.

## Task 4: Build Auth Session Foundation

**Files:**
- Create in frontend repo: `src/app/core/auth/auth.service.ts`
- Create in frontend repo: `src/app/core/auth/auth.interceptor.ts`
- Create in frontend repo: `src/app/core/auth/auth.guard.ts`
- Create in frontend repo: `src/app/core/api/auth.api.ts`

**Interfaces:**
- Produces `AuthService` with `session`, `login`, `register`, `refresh`, and `logout`.
- Produces HTTP interceptor that attaches bearer tokens and retries once after refresh on `401`.

- [ ] Implement `AuthApi` methods for login, register, refresh, and logout.
- [ ] Implement `AuthService` as the single owner of the in-memory access token.
- [ ] On app start, call `refresh()` before deciding whether authenticated routes are available.
- [ ] Add an authenticated route guard that redirects unauthenticated users to `/login`.
- [ ] Add tests for successful login, failed login, refresh restore, refresh failure, logout, and interceptor retry behavior.

## Task 5: Build Auth Screens

**Files:**
- Create in frontend repo: `src/app/features/auth/login.page.ts`
- Create in frontend repo: `src/app/features/auth/register.page.ts`
- Create in frontend repo: `src/app/features/auth/auth-shell.component.ts`

**Interfaces:**
- Consumes `AuthService`.
- Produces public auth routes `/login` and `/register`.

- [ ] Build login form with email and password validation.
- [ ] Build register form with email, password, first name, and last name validation.
- [ ] Display backend `ProblemDetail.title` and `ProblemDetail.detail` in a compact error banner.
- [ ] Redirect authenticated users to `/app/projects`.
- [ ] Add component tests for validation, submit loading state, API error display, and successful redirect.

## Task 6: Build App Shell and Navigation

**Files:**
- Create in frontend repo: `src/app/core/layout/app-shell.component.ts`
- Modify in frontend repo: `src/app/app.routes.ts`

**Interfaces:**
- Produces authenticated layout wrapping all `/app/*` routes.

- [ ] Add a sidebar with navigation to Projects and Settings.
- [ ] Add top bar with current user identity and logout action.
- [ ] Add responsive behavior for mobile sidebar.
- [ ] Add loading, empty, and error states as reusable shared UI components.
- [ ] Add tests for navigation visibility and logout behavior.

## Task 7: Build Project Workflow

**Files:**
- Create in frontend repo: `src/app/core/api/projects.api.ts`
- Create in frontend repo: `src/app/features/projects/projects.page.ts`
- Create in frontend repo: `src/app/features/projects/project-form.dialog.ts`
- Create in frontend repo: `src/app/features/projects/project-detail.page.ts`

**Interfaces:**
- Produces project list/search/create/edit/delete UI and project detail route.

- [ ] Implement project API methods for list, search, create, update, and delete.
- [ ] Build project list with search input, create button, edit action, and delete confirmation.
- [ ] Build project detail header with project name, description, and tabs/links for tasks, members, and roles.
- [ ] Use `GET /api/v1/projects` as the initial source of project detail data because there is no single-project endpoint.
- [ ] Add tests for search, create validation, edit submit, delete confirmation, and not-found handling.

## Task 8: Build Task Workflow

**Files:**
- Create in frontend repo: `src/app/core/api/tasks.api.ts`
- Create in frontend repo: `src/app/features/tasks/tasks.page.ts`
- Create in frontend repo: `src/app/features/tasks/task-form.dialog.ts`

**Interfaces:**
- Produces task list/create/edit/delete UI for a selected project.

- [ ] Implement task API methods for list, get, create, update, and delete.
- [ ] Display tasks grouped by `TODO`, `IN_PROGRESS`, and `DONE`.
- [ ] Build task form with title, description, status, due date, and assignee.
- [ ] Send `dueDate` as a backend-compatible date-time string and display returned `dueDate` as a date.
- [ ] Use project members as the assignee dropdown source; include an unassigned option.
- [ ] Add tests for status grouping, create, update, delete, assignee selection, and due date mapping.

## Task 9: Build Member Workflow

**Files:**
- Create in frontend repo: `src/app/core/api/members.api.ts`
- Create in frontend repo: `src/app/features/members/members.page.ts`
- Create in frontend repo: `src/app/features/members/member-form.dialog.ts`

**Interfaces:**
- Produces member list/add/update/remove UI for a selected project.

- [ ] Implement member API methods for list, add, update role, and remove.
- [ ] Display members in a compact table with email, name, role, and joined date.
- [ ] Build add-member dialog with email and role select.
- [ ] Build role-change action with confirmation for role updates.
- [ ] Show backend errors for missing users, self-add attempts, duplicate members, and missing roles.
- [ ] Add tests for list rendering, add validation, role update, remove confirmation, and error display.

## Task 10: Build Role Workflow

**Files:**
- Create in frontend repo: `src/app/core/api/roles.api.ts`
- Create in frontend repo: `src/app/features/roles/roles.page.ts`
- Create in frontend repo: `src/app/features/roles/role-form.dialog.ts`

**Interfaces:**
- Produces role list/create/edit/delete UI for a selected project.

- [ ] Implement role API methods for list, create, update, and delete.
- [ ] Display roles in a compact table with name, permissions, created date, edit, and delete actions.
- [ ] Build role form with name input and permission checklist.
- [ ] Prevent submitting a role with no permissions.
- [ ] Surface backend duplicate-name and assigned-role deletion errors.
- [ ] Add tests for permission checklist, create, edit, delete, and invalid submission.

## Task 11: Build Settings Workflow

**Files:**
- Create in frontend repo: `src/app/core/api/user.api.ts`
- Create in frontend repo: `src/app/features/settings/settings.page.ts`

**Interfaces:**
- Produces current-user display, change-email form, and change-password form.

- [ ] Implement user API methods for current user, change email, and change password.
- [ ] Display current user name and email.
- [ ] Build change-email form with email validation.
- [ ] Build change-password form with current password and new password validation.
- [ ] Refresh displayed user data after email change.
- [ ] Add tests for profile loading, email conflict display, wrong-current-password display, and successful updates.

## Task 12: Add E2E Coverage and Release Checks

**Files:**
- Create in frontend repo: `e2e/auth.spec.ts`
- Create in frontend repo: `e2e/projects.spec.ts`
- Create in frontend repo: `e2e/tasks.spec.ts`
- Create in frontend repo: `e2e/members-roles.spec.ts`
- Create in frontend repo: `playwright.config.ts`

**Interfaces:**
- Produces browser-level smoke coverage for the complete v1 workflow.

- [ ] Add E2E tests using mocked API responses or a dedicated test backend profile.
- [ ] Cover login/register, project creation, task creation/status update, member add/update/remove, role create/update/delete, settings update, logout, and protected-route redirects.
- [ ] Add CI commands:

```bash
npm run lint
npm run test
npm run build
npm run e2e
```

- [ ] Verify desktop and mobile screenshots for the authenticated shell, project detail, dialogs, and settings page.

## Acceptance Criteria

- Users can register, log in, refresh sessions after reload, and log out.
- Authenticated API calls attach bearer tokens and recover from one expired-token `401` via refresh.
- Users can manage projects and tasks through the UI.
- Users with access can view members and roles and perform supported member/role actions.
- Profile settings support email and password changes.
- Backend ProblemDetail responses are visible in the UI without exposing raw stack traces.
- The app builds cleanly and has unit/component/E2E coverage for the primary workflows.
- Backend CORS supports the configured frontend origin with credentials.

## References

- Angular package current tag checked July 27, 2026: <https://www.npmjs.com/package/%40angular/create?activeTab=versions>
- Tailwind CSS package current tag checked July 27, 2026: <https://www.npmjs.com/package/tailwindcss?activeTab=versions>
