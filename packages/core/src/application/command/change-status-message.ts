import { Conversation } from "../../domain/entities/conversation";
import { Message } from "../../domain/entities/message";
import { ConversationsDatabaseRepository } from "../../infra/repositories/conversations-repository";
import { MessagesDatabaseRepository } from "../../infra/repositories/messages-repository";

interface MessagesRepository {
  retrieve(id: string): Promise<Message | null>;
  upsert(message: Message): Promise<string | null>;
  retrieveConversationId(messageId: string): Promise<{
    conversationId: string | null;
  } | null>;
}

interface ConversationsRepository {
  retrieve(id: string): Promise<Conversation | null>;
  upsert(conversation: Conversation, workspaceId: string): Promise<void>;
}

export class ChangeStatusMessage {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly conversationsRepository: ConversationsRepository
  ) {}
  async execute(input: InputDTO) {
    const message = await this.messagesRepository.retrieve(input.messageId);

    if (!message) return null;

    if (input.status === "sent") {
      message.markAsSent();
    }

    if (input.status === "delivered") {
      message.markAsDelivered();
    }

    if (input.status === "read") {
      message.markAsViewed();
    }

    await this.messagesRepository.upsert(message);

    const response = await this.messagesRepository.retrieveConversationId(
      message.id
    );

    if (response?.conversationId) {
      const conversation = await this.conversationsRepository.retrieve(
        response.conversationId
      );

      if (!conversation) return null;

      if (input.status === "read") {
        conversation.markAllMessageAsViewed();
        await this.conversationsRepository.upsert(
          conversation,
          input.workspaceId
        );
      }

      return conversation;
    }

    return null;
  }

  static instance() {
    return new ChangeStatusMessage(
      MessagesDatabaseRepository.instance(),
      ConversationsDatabaseRepository.instance()
    );
  }
}

type InputDTO = {
  messageId: string;
  status: string;
  workspaceId: string;
};
