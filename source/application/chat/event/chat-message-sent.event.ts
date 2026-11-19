export const CHAT_MESSAGE_SENT_EVENT = 'chat.message-sent';

export class ChatMessageSentEvent {
  constructor(
    public readonly conversationId: string,
    public readonly messageId: string,
    public readonly senderId: string,
    public readonly senderName: string,
    public readonly recipientId: string,
    public readonly preview: string | null,
  ) {}
}
