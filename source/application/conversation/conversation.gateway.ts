import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { ConversationService } from './conversation.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { UpdateConversationDto } from './dto/update-conversation.dto.js';

@WebSocketGateway()
export class ConversationGateway {
  constructor(private readonly conversationService: ConversationService) {}

  @SubscribeMessage('createConversation')
  create(@MessageBody() createConversationDto: CreateConversationDto) {
    return this.conversationService.create(createConversationDto);
  }

  @SubscribeMessage('findAllConversation')
  findAll() {
    return this.conversationService.findAll();
  }

  @SubscribeMessage('findOneConversation')
  findOne(@MessageBody() id: number) {
    return this.conversationService.findOne(id);
  }

  @SubscribeMessage('updateConversation')
  update(@MessageBody() updateConversationDto: UpdateConversationDto) {
    return this.conversationService.update(updateConversationDto.id, updateConversationDto);
  }

  @SubscribeMessage('removeConversation')
  remove(@MessageBody() id: number) {
    return this.conversationService.remove(id);
  }
}
