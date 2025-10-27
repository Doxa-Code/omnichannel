import { Conversation } from "../../domain/entities/conversation";
import { NotFound } from "../../domain/errors/not-found";
import { Attendant } from "../../domain/value-objects/attendant";
import { ProxyMessageDriver } from "../../infra/drivers/message-driver";
import { ChannelsDatabaseRepository } from "../../infra/repositories/channels-repository";
import { ConversationsDatabaseRepository } from "../../infra/repositories/conversations-repository";
import { Channel } from "./../../domain/entities/channel";
import { SQSMessagingDriver } from "./../../infra/drivers/messaging-driver";

interface ConversationsRepository {
  retrieve(id: string): Promise<Conversation | null>;
  upsert(conversation: Conversation, workspaceId: string): Promise<void>;
}

interface ChannelsRepository {
  retrieve(id: string, workspaceId: string): Promise<Channel | null>;
}

type SendMessageToQueueProps = {
  queueUrl: string;
  body: string;
  groupId: string;
  messageId: string;
};

interface MessagingDriver {
  sendMessageToQueue(data: SendMessageToQueueProps): Promise<boolean>;
}

type SendMessageTextProps = {
  workspaceId: string;
  channel: Channel;
  to: string;
  content: string;
};

type TypingProps = {
  workspaceId: string;
  lastMessageId: string;
  channel: Channel;
};

interface MessageDriver {
  sendMessageText(props: SendMessageTextProps): Promise<string | null>;
  sendTyping(data: TypingProps): Promise<void>;
}

export class SendMessage {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
    private readonly channelsRepository: ChannelsRepository,
    private readonly messageDriver: MessageDriver,
    private readonly messagingDriver: MessagingDriver
  ) {}
  async execute(input: InputDTO): Promise<Conversation | null> {
    const conversation = await this.conversationsRepository.retrieve(
      input.conversationId
    );

    if (!conversation) throw NotFound.throw("Conversation");

    const channel = await this.channelsRepository.retrieve(
      input.channelId,
      input.workspaceId
    );

    if (!channel) throw NotFound.throw("Channel");

    await this.messageDriver.sendTyping({
      workspaceId: input.workspaceId,
      lastMessageId: conversation.lastContactMessages?.[-1]?.id!,
      channel,
    });

    const attendant = Attendant.create(input.userId, input.userName);

    if (!conversation.attendant) {
      conversation.attributeAttendant(attendant);
    }

    await this.conversationsRepository.upsert(conversation, input.workspaceId);

    await this.messagingDriver.sendMessageToQueue({
      queueUrl: process.env.MESSAGES_QUEUE_URL!,
      body: JSON.stringify({
        content: input.content,
        conversationId: conversation.id,
        channelId: input.channelId,
        workspaceId: input.workspaceId,
        createdAt: new Date(),
        sender: attendant,
        type: "text",
      }),
      groupId: input.workspaceId,
      messageId: crypto.randomUUID(),
    });

    return conversation;
  }

  static instance() {
    return new SendMessage(
      ConversationsDatabaseRepository.instance(),
      ChannelsDatabaseRepository.instance(),
      ProxyMessageDriver.instance(),
      SQSMessagingDriver.instance()
    );
  }
}

type InputDTO = {
  conversationId: string;
  channelId: string;
  userId: string;
  userName: string;
  content: string;
  workspaceId: string;
};
