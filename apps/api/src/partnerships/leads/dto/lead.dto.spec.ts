import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PartnershipLeadStatus } from '@prisma/client';
import { QueryLeadsDto } from './lead.dto';

describe('QueryLeadsDto', () => {
  it('accepts empty status as undefined (all leads)', async () => {
    const dto = plainToInstance(QueryLeadsDto, { status: '', page: '1', pageSize: '20' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.status).toBeUndefined();
  });

  it('rejects invalid status instead of silently filtering to empty', async () => {
    const dto = plainToInstance(QueryLeadsDto, { status: 'NOT_A_REAL_STATUS' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });

  it('accepts a valid PartnershipLeadStatus', async () => {
    const dto = plainToInstance(QueryLeadsDto, {
      status: PartnershipLeadStatus.NEW,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.status).toBe(PartnershipLeadStatus.NEW);
  });
});
