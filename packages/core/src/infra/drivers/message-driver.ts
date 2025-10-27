import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import { Channel } from "./../../domain/entities/channel";

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

type ViewProps = {
  workspaceId: string;
  lastMessageId: string;
  channel: Channel;
};

type SendMessageAudioProps = {
  workspaceId: string;
  channel: Channel;
  to: string;
  file: File;
};

interface MessageDriver {
  name: string;
  sendMessageText(data: SendMessageTextProps): Promise<string | null>;
  sendMessageAudio(data: SendMessageAudioProps): Promise<{
    id: string;
    mediaId: string;
  }>;
  sendTyping(data: TypingProps): Promise<void>;
  viewMessage(data: ViewProps): Promise<void>;
  downloadMedia(
    channel: Channel,
    mediaId: string
  ): Promise<
    { success: true; content: ArrayBuffer } | { success: false; content: Error }
  >;
}

export class WhatsappMessageDriver implements MessageDriver {
  name = "whatsapp";
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "https://graph.facebook.com/v23.0",
    });
  }

  private async getAuthHeaders(channel: Channel) {
    if (!channel.payload.accessToken) {
      return {
        Authorization: `Bearer ${process.env.META_TOKEN}`,
      };
    }
    const token = channel.payload.accessToken;
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async downloadMedia(
    channel: Channel,
    mediaId: string
  ): Promise<
    { success: true; content: ArrayBuffer } | { success: false; content: Error }
  > {
    try {
      const headers = await this.getAuthHeaders(channel);
      const phoneId = channel.payload.phoneId;

      const mediaRetrieved = await this.client.get<{ url: string }>(
        `/${mediaId}?phone_number_id=${phoneId}`,
        { headers }
      );
      const result = await axios.get(mediaRetrieved.data.url, {
        responseType: "arraybuffer",
        headers,
      });

      return { success: true, content: result.data };
    } catch (err) {
      return { success: false, content: err as Error };
    }
  }

  async sendTyping(data: TypingProps): Promise<void> {
    const headers = await this.getAuthHeaders(data.channel);
    const phoneId = data.channel.payload.phoneId;

    await this.client
      .post(
        `/${phoneId}/messages`,
        {
          messaging_product: "whatsapp",
          status: "read",
          message_id: data.lastMessageId,
          typing_indicator: {
            type: "text",
          },
        },
        { headers }
      )
      .catch((err) => console.log(JSON.stringify(err, null, 2)));
  }

  async viewMessage(data: ViewProps): Promise<void> {
    const headers = await this.getAuthHeaders(data.channel);
    const phoneId = data.channel.payload.phoneId;

    await this.client
      .post(
        `/${phoneId}/messages`,
        {
          messaging_product: "whatsapp",
          status: "read",
          message_id: data.lastMessageId,
        },
        { headers }
      )
      .catch((err) => console.log(JSON.stringify(err, null, 2)));
  }

  async sendMessageText(data: SendMessageTextProps): Promise<string | null> {
    const headers = await this.getAuthHeaders(data.channel);
    const phoneId = data.channel.payload.phoneId;

    if (!data.content) return null;
    const response = await this.client
      .post<{
        messages: {
          id: string;
        }[];
      }>(
        `/${phoneId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: data.to,
          type: "text",
          text: {
            preview_url: false,
            body: data.content,
          },
        },
        { headers }
      )
      .catch((err) => console.log(err.response.data));

    return response?.data?.messages?.[0]?.id ?? "";
  }

  async sendMessageAudio(data: SendMessageAudioProps): Promise<{
    id: string;
    mediaId: string;
  }> {
    const headers = await this.getAuthHeaders(data.channel);
    const phoneId = data.channel.payload.phoneId;
    const arrayBuffer = await data.file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const form = new FormData();

    form.append("file", buffer, {
      filename: data.file.name,
      contentType: data.file?.type || "audio/ogg",
    });

    form.append("messaging_product", "whatsapp");

    const uploadResponse = await this.client.post<{ id: string }>(
      `/${data.channel}/media`,
      form,
      {
        headers: { ...form.getHeaders(), ...headers },
      }
    );

    const mediaId = uploadResponse.data.id;

    const sendResponse = await this.client.post<{
      messages: {
        id: string;
      }[];
    }>(
      `/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: data.to,
        type: "audio",
        audio: { id: mediaId },
      },
      { headers }
    );

    return {
      id: sendResponse?.data?.messages?.[0]?.id ?? "",
      mediaId,
    };
  }

  static instance() {
    return new WhatsappMessageDriver();
  }
}

export class ProxyMessageDriver implements MessageDriver {
  name = "proxy";
  private drivers = new Map<string, MessageDriver>();

  register(messageDriver: MessageDriver) {
    this.drivers.set(messageDriver.name, messageDriver);
  }

  private resolve(channel: Channel): MessageDriver {
    const driver = this.drivers.get(channel.type);
    if (!driver) throw new Error(`Canal não suportado: ${channel}`);
    return driver;
  }

  async sendMessageText(data: SendMessageTextProps): Promise<string | null> {
    return this.resolve(data.channel).sendMessageText(data);
  }

  async sendMessageAudio(
    data: SendMessageAudioProps
  ): Promise<{ id: string; mediaId: string }> {
    return this.resolve(data.channel).sendMessageAudio(data);
  }

  async sendTyping(data: TypingProps): Promise<void> {
    return this.resolve(data.channel).sendTyping(data);
  }

  async viewMessage(data: ViewProps): Promise<void> {
    return this.resolve(data.channel).viewMessage(data);
  }

  async downloadMedia(
    channel: Channel,
    mediaId: string
  ): Promise<
    { success: true; content: ArrayBuffer } | { success: false; content: Error }
  > {
    return this.resolve(channel).downloadMedia(channel, mediaId);
  }

  static instance() {
    const instance = new ProxyMessageDriver();
    instance.register(WhatsappMessageDriver.instance());
    return instance;
  }
}
