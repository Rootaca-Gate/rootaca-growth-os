import { HttpErrorResponse } from '@angular/common/http';

export function partnershipErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && Array.isArray(error.error?.message)) {
    return error.error.message.join(', ');
  }
  if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
    return error.error.message;
  }
  return fallback;
}
