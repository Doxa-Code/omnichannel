import { Channel } from "../../domain/entities/channel";
import { ChannelsDatabaseRepository } from "../../infra/repositories/channels-repository";
import { ConnectionStrategy } from "./connections-strategies/connection-strategy";
import { WhatsappConnectionStrategy } from "./connections-strategies/whatsapp-connection-strategy";

interface ChannelsRepository {
  retrieve(id: string, workspaceId: string): Promise<Channel | null>;
  upsert(channel: Channel, workspaceId: string): Promise<void>;
}

export class ConnectChannel {
  constructor(private readonly channelsRepository: ChannelsRepository) {}
  private readonly connectionStrategies = new Map<string, ConnectionStrategy>();

  register(strategy: ConnectionStrategy) {
    this.connectionStrategies.set(strategy.name, strategy);
  }

  async execute(input: InputDTO) {
    const channel = await this.channelsRepository.retrieve(
      input.id,
      input.workspaceId
    );

    if (!channel) {
      throw new Error("Canal não encontrado");
    }

    const strategy = this.connectionStrategies.get(input.type);

    if (!strategy) {
      throw new Error("Estratégia de conexão não encontrada");
    }

    const outputPayload = await strategy.connect(input.inputPayload);

    channel.connected(outputPayload);

    await this.channelsRepository.upsert(channel, input.workspaceId);
  }
  static instance() {
    const instance = new ConnectChannel(ChannelsDatabaseRepository.instance());
    instance.register(WhatsappConnectionStrategy.instance());
    return instance;
  }
}

type InputDTO = {
  workspaceId: string;
  id: string;
  type: Channel.Type;
  inputPayload: any;
};
