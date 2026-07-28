import { HttpErrorResponse } from '@angular/common/http';

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

export type ProblemMessageContext = 'login' | 'register' | 'emailUpdate' | 'passwordUpdate';

export interface ProblemMessageOptions {
  context?: ProblemMessageContext;
}

export function problemMessage(error: unknown, options: ProblemMessageOptions = {}): string {
  const status = errorStatus(error);

  if (options.context === 'login' && status === 401) {
    return 'Email or password is incorrect.';
  }
  if (options.context === 'register' && status === 409) {
    return 'An account with this email already exists.';
  }
  if (options.context === 'emailUpdate' && status === 409) {
    return 'That email is already in use.';
  }
  if (options.context === 'passwordUpdate' && (status === 400 || status === 401)) {
    return 'Check your current password and try again.';
  }

  switch (status) {
    case 0:
      return "We couldn't reach the server. Check your connection and try again.";
    case 400:
    case 422:
      return 'Please check your information and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "We couldn't find that item.";
    case 409:
      return 'That change conflicts with existing data. Review it and try again.';
    case 429:
      return 'Too many attempts. Please wait and try again.';
    default:
      if (status && status >= 500) {
        return 'Something went wrong on our side. Please try again shortly.';
      }
      return 'The request could not be completed. Please try again.';
  }
}

function errorStatus(error: unknown): number | undefined {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }

  return undefined;
}
