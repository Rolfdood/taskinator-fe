import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const SKIP_AUTH_RETRY = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();
  const isAuthRequest = request.url.includes('/auth/');
  const authorizedRequest =
    token && !isAuthRequest ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthRequest ||
        request.context.get(SKIP_AUTH_RETRY)
      ) {
        return throwError(() => error);
      }

      return from(auth.refresh()).pipe(
        switchMap((restored) => {
          const refreshedToken = auth.accessToken();
          if (!restored || !refreshedToken) {
            return throwError(() => error);
          }

          return next(
            request.clone({
              context: request.context.set(SKIP_AUTH_RETRY, true),
              setHeaders: { Authorization: `Bearer ${refreshedToken}` },
            }),
          );
        }),
      );
    }),
  );
};
