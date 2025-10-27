import { Channel } from "../../domain/entities/channel";
import { ChannelsDatabaseRepository } from "../../infra/repositories/channels-repository";
import { ConnectionStrategy } from "./connections-strategies/connection-strategy";
import { WhatsappConnectionStrategy } from "./connections-strategies/whatsapp-connection-strategy";

interface ChannelsRepository {
  retrieve(id: string, workspaceId: string): Promise<Channel | null>;
  upsert(channel: Channel, workspaceId: string): Promise<void>;
}

export class DisconnectChannel {
  constructor(private readonly channelsRepository: ChannelsRepository) {}

  async execute(input: InputDTO) {
    const channel = await this.channelsRepository.retrieve(
      input.id,
      input.workspaceId
    );

    if (!channel) {
      throw new Error("Canal não encontrado");
    }

    channel.disconnect();

    await this.channelsRepository.upsert(channel, input.workspaceId);
  }
  static instance() {
    return new DisconnectChannel(ChannelsDatabaseRepository.instance());
  }
}
type InputDTO = {
  workspaceId: string;
  id: string;
};
