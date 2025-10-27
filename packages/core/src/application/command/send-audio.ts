import { Channel } from "./../../domain/entities/channel";
import { Conversation } from "../../domain/entities/conversation";
import { Message } from "../../domain/entities/message";
import { NotFound } from "../../domain/errors/not-found";
import { Attendant } from "../../domain/value-objects/attendant";
import { ProxyMessageDriver } from "../../infra/drivers/message-driver";
import { ConversationsDatabaseRepository } from "../../infra/repositories/conversations-repository";
import { ChannelsDatabaseRepository } from "../../infra/repositories/channels-repository";

interface ConversationsRepository {
  retrieve(id: string): Promise<Conversation | null>;
  upsert(conversation: Conversation, workspaceId: string): Promise<void>;
}

interface ChannelsRepository {
  retrieve(id: string, workspaceId: string): Promise<Channel | null>;
}

type SendMessageAudioProps = {
  workspaceId: string;
  channel: Channel;
  to: string;
  file: File;
};

type TypingProps = {
  workspaceId: string;
  lastMessageId: string;
  channel: Channel;
};

interface MessageDriver {
  sendMessageAudio(data: SendMessageAudioProps): Promise<{
    id: string;
    mediaId: string;
  }>;
  sendTyping(data: TypingProps): Promise<void>;
  downloadMedia(
    channel: Channel,
    mediaId: string
  ): Promise<
    { success: true; content: ArrayBuffer } | { success: false; content: Error }
  >;
}

export class SendAudio {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
    private readonly channelsRepository: ChannelsRepository,
    private readonly messageDriver: MessageDriver
  ) {}
  async execute(input: InputDTO): Promise<Conversation> {
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

    const { id: messageId, mediaId } =
      await this.messageDriver.sendMessageAudio({
        workspaceId: input.workspaceId,
        channel,
        to: conversation.contact.phone,
        file: input.file,
      });

    conversation.addMessage(
      Message.create({
        content: mediaId,
        createdAt: new Date(),
        id: messageId,
        sender: attendant,
        type: "audio",
      })
    );

    await this.conversationsRepository.upsert(conversation, input.workspaceId);

    return conversation;
  }

  static instance() {
    return new SendAudio(
      ConversationsDatabaseRepository.instance(),
      ChannelsDatabaseRepository.instance(),
      ProxyMessageDriver.instance()
    );
  }
}

type InputDTO = {
  conversationId: string;
  channelId: string;
  userId: string;
  userName: string;
  file: File;
  workspaceId: string;
};
