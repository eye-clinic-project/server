import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';
import { ChatService } from '../chat/chat.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';

describe('MessageController', () => {
  let controller: MessageController;

  beforeEach(async () => {
    const builder = Test.createTestingModule({
      controllers: [MessageController],
      providers: [MessageService, { provide: ChatService, useValue: {} }],
    });
    builder.overrideGuard(AuthGuard).useValue({ canActivate: () => true });
    builder.overrideGuard(RolesGuard).useValue({ canActivate: () => true });
    const module: TestingModule = await builder.compile();

    controller = module.get<MessageController>(MessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
