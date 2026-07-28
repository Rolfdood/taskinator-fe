import { HttpErrorResponse } from '@angular/common/http';
import { problemMessage } from './problem-detail';

describe('problemMessage', () => {
  const messageFor = problemMessage as (error: unknown, options?: { context: string }) => string;

  function httpError(status: number, error?: unknown): HttpErrorResponse {
    return new HttpErrorResponse({
      status,
      statusText: 'Request failed',
      url: 'https://internal.example.test/api/v1/projects',
      error,
    });
  }

  it('does not expose backend details for server errors', () => {
    const message = problemMessage(
      httpError(500, {
        title: 'SQLException',
        detail: 'select * from users where credential = private-value',
      }),
    );

    expect(message).toBe('Something went wrong on our side. Please try again shortly.');
    expect(message).not.toContain('SQLException');
    expect(message).not.toContain('credential');
    expect(message).not.toContain('internal.example');
  });

  it('uses clean status-based request messages', () => {
    expect(problemMessage(httpError(0))).toBe("We couldn't reach the server. Check your connection and try again.");
    expect(problemMessage(httpError(422))).toBe('Please check your information and try again.');
    expect(problemMessage(httpError(403))).toBe("You don't have permission to do that.");
    expect(problemMessage(httpError(404))).toBe("We couldn't find that item.");
    expect(problemMessage(httpError(409))).toBe('That change conflicts with existing data. Review it and try again.');
    expect(problemMessage(httpError(429))).toBe('Too many attempts. Please wait and try again.');
  });

  it('uses context-specific messages for account flows', () => {
    expect(messageFor(httpError(401), { context: 'login' })).toBe('Email or password is incorrect.');
    expect(messageFor(httpError(409), { context: 'register' })).toBe('An account with this email already exists.');
    expect(messageFor(httpError(409), { context: 'emailUpdate' })).toBe('That email is already in use.');
    expect(messageFor(httpError(400), { context: 'passwordUpdate' })).toBe(
      'Check your current password and try again.',
    );
  });

  it('does not expose raw JavaScript error messages', () => {
    expect(problemMessage(new Error('TypeError: Cannot read properties of undefined'))).toBe(
      'The request could not be completed. Please try again.',
    );
  });
});
