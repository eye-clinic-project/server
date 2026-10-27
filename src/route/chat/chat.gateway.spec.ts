import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { TokenService } from '../../common/service/token.service.js';
import { UtilService } from '../../common/service/util.service.js';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: {} },
        { provide: TokenService, useValue: {} },
        UtilService,
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
