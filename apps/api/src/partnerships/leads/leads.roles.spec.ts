import { CRM_READ_ROLES, CRM_WRITE_ROLES } from '../common/partnership.roles';
import { Role } from '@prisma/client';

describe('Leads CRM roles', () => {
  it('allows CRM_READ roles to list leads', () => {
    expect(CRM_READ_ROLES).toEqual(
      expect.arrayContaining([Role.ADMIN, Role.MENTOR, Role.COUNSELOR]),
    );
  });

  it('keeps write roles aligned without loosening read authorization', () => {
    for (const role of CRM_READ_ROLES) {
      expect(CRM_WRITE_ROLES).toContain(role);
    }
  });
});
