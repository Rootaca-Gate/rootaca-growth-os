import { inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/auth/auth.models';

/** Frontend visibility helpers — backend remains authoritative. */
export function usePartnershipPermissions() {
  const auth = inject(AuthService);

  const role = (): Role | null => auth.currentUser()?.role ?? null;

  const canRead = (): boolean => {
    const r = role();
    return r === 'ADMIN' || r === 'MENTOR' || r === 'COUNSELOR';
  };

  const canWrite = (): boolean => {
    const r = role();
    return r === 'ADMIN' || r === 'MENTOR' || r === 'COUNSELOR';
  };

  const canAdmin = (): boolean => role() === 'ADMIN';

  return { role, canRead, canWrite, canAdmin };
}
