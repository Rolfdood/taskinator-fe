import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'projects',
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects.page').then((m) => m.ProjectsPage),
      },
      {
        path: 'projects/:projectId',
        loadComponent: () => import('./features/projects/project-detail.page').then((m) => m.ProjectDetailPage),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'tasks' },
          { path: 'tasks', loadComponent: () => import('./features/tasks/tasks.page').then((m) => m.TasksPage) },
          { path: 'members', loadComponent: () => import('./features/members/members.page').then((m) => m.MembersPage) },
          { path: 'roles', loadComponent: () => import('./features/roles/roles.page').then((m) => m.RolesPage) },
        ],
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
