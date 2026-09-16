import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (auth.isAuthEndpoint(req.url)) {
    return next(req);
  }

  const token = auth.accessToken();
  const authorizedRequest = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !auth.accessToken()) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap((session) => {
          const retry = req.clone({
            setHeaders: { Authorization: `Bearer ${session.accessToken}` },
          });
          return next(retry);
        }),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
