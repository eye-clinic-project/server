import { Test, TestingModule } from '@nestjs/testing';
import { NotificationGateway } from './notification.gateway.js';
import { NotificationService } from './notification.service.js';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationGateway, NotificationService],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
