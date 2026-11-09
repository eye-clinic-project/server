import { Test, TestingModule } from '@nestjs/testing';
import { ConversationGateway } from './conversation.gateway.js';
import { ConversationService } from './conversation.service.js';

describe('ConversationGateway', () => {
  let gateway: ConversationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationGateway, ConversationService],
    }).compile();

    gateway = module.get<ConversationGateway>(ConversationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
