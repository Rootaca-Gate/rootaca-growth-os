import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipLeadPriority,
  PartnershipLeadStatus,
} from '@prisma/client';
import { ensureDefaultLeadForInstitution } from './ensure-default-lead';

describe('ensureDefaultLeadForInstitution', () => {
  const prisma = {
    partnershipLead: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    partnershipContact: {
      findFirst: jest.fn(),
    },
  };
  const audit = { record: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns existing lead without creating another', async () => {
    prisma.partnershipLead.findFirst.mockResolvedValue({ id: 'lead-1' });
    const result = await ensureDefaultLeadForInstitution(
      prisma as never,
      audit as never,
      { institutionId: 'inst-1', actorId: 'user-1' },
    );
    expect(result).toEqual({ id: 'lead-1', created: false });
    expect(prisma.partnershipLead.create).not.toHaveBeenCalled();
  });

  it('creates a NEW lead when institution has none', async () => {
    prisma.partnershipLead.findFirst.mockResolvedValue(null);
    prisma.partnershipContact.findFirst.mockResolvedValue({ id: 'contact-1' });
    prisma.partnershipLead.create.mockResolvedValue({ id: 'lead-new' });

    const result = await ensureDefaultLeadForInstitution(
      prisma as never,
      audit as never,
      {
        institutionId: 'inst-1',
        actorId: 'user-1',
        priority: PartnershipLeadPriority.HIGH,
        sourceId: 'source-1',
      },
    );

    expect(result).toEqual({ id: 'lead-new', created: true });
    expect(prisma.partnershipLead.create).toHaveBeenCalledWith({
      data: {
        institutionId: 'inst-1',
        status: PartnershipLeadStatus.NEW,
        priority: PartnershipLeadPriority.HIGH,
        sourceId: 'source-1',
        primaryContactId: 'contact-1',
        ownerId: null,
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: PartnershipAuditEntityType.LEAD,
        entityId: 'lead-new',
        action: PartnershipAuditAction.LEAD_CREATED,
      }),
    );
  });
});
