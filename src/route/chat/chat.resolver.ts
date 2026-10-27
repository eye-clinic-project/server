import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { GraphQLJSON } from '../../common/graphql/json.scalar.js';
import { ChatService } from './chat.service.js';

@Resolver()
@Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
export class ChatResolver {
  constructor(private readonly chat: ChatService) {}

  @Query(() => GraphQLJSON, { name: 'myConversations' })
  findConversations(@User() user: HUserDocument) {
    return this.chat.findConversations(user._id.toString());
  }

  @Query(() => GraphQLJSON, { name: 'conversationMessages' })
  findMessages(
    @User() user: HUserDocument,
    @Args('conversationId', { type: () => ID }) conversationId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 })
    limit: number,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 })
    skip: number,
  ) {
    return this.chat.findMessages(
      user._id.toString(),
      conversationId,
      limit,
      skip,
    );
  }

  @Mutation(() => GraphQLJSON)
  startChat(
    @User() user: HUserDocument,
    @Args('participantId', { type: () => ID }) participantId: string,
  ) {
    return this.chat.startConversation(user._id.toString(), participantId);
  }

  @Mutation(() => GraphQLJSON)
  sendChatMessage(
    @User() user: HUserDocument,
    @Args('conversationId', { type: () => ID }) conversationId: string,
    @Args('input', { type: () => GraphQLJSON })
    input: { message?: string; attachments?: string[] },
  ) {
    return this.chat.sendMessage(user._id.toString(), conversationId, input);
  }

  @Mutation(() => GraphQLJSON)
  markChatDelivered(
    @User() user: HUserDocument,
    @Args('conversationId', { type: () => ID }) conversationId: string,
  ) {
    return this.chat.markDelivered(user._id.toString(), conversationId);
  }

  @Mutation(() => GraphQLJSON)
  markChatRead(
    @User() user: HUserDocument,
    @Args('conversationId', { type: () => ID }) conversationId: string,
  ) {
    return this.chat.markRead(user._id.toString(), conversationId);
  }

  @Mutation(() => GraphQLJSON)
  editChatMessage(
    @User() user: HUserDocument,
    @Args('messageId', { type: () => ID }) messageId: string,
    @Args('message') message: string,
  ) {
    return this.chat.editMessage(user._id.toString(), messageId, message);
  }

  @Mutation(() => GraphQLJSON)
  deleteChatMessage(
    @User() user: HUserDocument,
    @Args('messageId', { type: () => ID }) messageId: string,
  ) {
    return this.chat.deleteMessage(user._id.toString(), messageId);
  }
}
