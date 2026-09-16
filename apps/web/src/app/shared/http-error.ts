import { HttpErrorResponse } from '@angular/common/http';

export function httpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }
    if (Array.isArray(error.error?.message)) {
      return error.error.message.join(', ');
    }
    if (error.status === 0) {
      return 'Please check your connection and try again.';
    }
  }
  return fallback;
}
