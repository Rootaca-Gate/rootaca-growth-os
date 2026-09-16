import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  const prisma = {
    user: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    prisma.user.count.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns an ok health payload with database status', async () => {
    prisma.user.count.mockResolvedValue(3);
    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('rootaca-api');
    expect(result.database).toBe('ok');
    expect(result.hasUsers).toBe(true);
    expect(result.timestamp).toEqual(expect.any(String));
  });

  it('keeps liveness ok when the database is unreachable', async () => {
    prisma.user.count.mockRejectedValue(new Error('connect failed'));
    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('error');
    expect(result.hasUsers).toBe(false);
  });
});
