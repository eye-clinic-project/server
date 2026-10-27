import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service.js';
import { ChatService } from '../chat/chat.service.js';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageService, { provide: ChatService, useValue: {} }],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
