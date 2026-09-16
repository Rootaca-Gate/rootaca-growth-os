import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns an ok health payload', () => {
    const result = controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('rootaca-api');
    expect(result.timestamp).toEqual(expect.any(String));
  });
});
