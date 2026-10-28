// import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
// import { Auth } from '../../common/decorator/auth.decorator.js';
// import { User } from '../../common/decorator/user.decorator.js';
// import { UserRoleEnum } from '../../common/enum/security.enum.js';
// import type { HUserDocument } from '../../core/database/model/user.model.js';
// import { GraphQL_JSON } from '../../common/gql/json.scalar.js';
// import { validateGraphqlInput } from '../../common/gql/validate-graphql-input.js';
// import { ChatService } from './chat.service.js';
// import { CreateMessageDto } from '../message/dto/create-message.dto.js';

// @Resolver()
// @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
// export class ChatResolver {
//   constructor(private readonly chat: ChatService) {}

//   @Query(() => GraphQL_JSON, { name: 'myConversations' })
//   findConversations(@User() user: HUserDocument) {
//     return this.chat.findConversations(user._id.toString());
//   }

//   @Query(() => GraphQL_JSON, { name: 'conversationMessages' })
//   findMessages(
//     @User() user: HUserDocument,
//     @Args('conversationId', { type: () => ID }) conversationId: string,
//     @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 })
//     limit: number,
//     @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 })
//     skip: number,
//   ) {
//     return this.chat.findMessages(
//       user._id.toString(),
//       conversationId,
//       limit,
//       skip,
//     );
//   }

//   @Mutation(() => GraphQL_JSON)
//   startChat(
//     @User() user: HUserDocument,
//     @Args('participantId', { type: () => ID }) participantId: string,
//   ) {
//     return this.chat.startConversation(user._id.toString(), participantId);
//   }

//   @Mutation(() => GraphQL_JSON)
//   async sendChatMessage(
//     @User() user: HUserDocument,
//     @Args('conversationId', { type: () => ID }) conversationId: string,
//     @Args('input', { type: () => GraphQL_JSON })
//     input: { message?: string; attachments?: string[] },
//   ) {
//     return this.chat.sendMessage(
//       user._id.toString(),
//       conversationId,
//       await validateGraphqlInput(input, CreateMessageDto),
//     );
//   }

//   @Mutation(() => GraphQL_JSON)
//   markChatDelivered(
//     @User() user: HUserDocument,
//     @Args('conversationId', { type: () => ID }) conversationId: string,
//   ) {
//     return this.chat.markDelivered(user._id.toString(), conversationId);
//   }

//   @Mutation(() => GraphQL_JSON)
//   markChatRead(
//     @User() user: HUserDocument,
//     @Args('conversationId', { type: () => ID }) conversationId: string,
//   ) {
//     return this.chat.markRead(user._id.toString(), conversationId);
//   }

//   @Mutation(() => GraphQL_JSON)
//   editChatMessage(
//     @User() user: HUserDocument,
//     @Args('messageId', { type: () => ID }) messageId: string,
//     @Args('message') message: string,
//   ) {
//     return this.chat.editMessage(user._id.toString(), messageId, message);
//   }

//   @Mutation(() => GraphQL_JSON)
//   deleteChatMessage(
//     @User() user: HUserDocument,
//     @Args('messageId', { type: () => ID }) messageId: string,
//   ) {
//     return this.chat.deleteMessage(user._id.toString(), messageId);
//   }
// }
