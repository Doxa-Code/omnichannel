import { Channel } from "@omnichannel/core/domain/entities/channel";
import { loadFacebookSDK } from "../lib/facebook-sdk";

type Action = (data: {
  id: string;
  type: Channel.Type;
  inputPayload: any;
}) => void;

interface ConnectHandler {
  name: string;
  connect(channel: Channel.Raw, action: Action): Promise<void>;
}

const facebookLogin = async <T = any>(params: any) =>
  await new Promise<T>((r) => FB.login((response) => r(response as T), params));

class WhatsAppConnectHandler implements ConnectHandler {
  name = "whatsapp";
  async connect(channel: Channel.Raw, action: Action): Promise<void> {
    const response = await facebookLogin<{ authResponse: { code: string } }>({
      config_id: "1315527863561114",
      response_type: "code",
      override_default_response_type: true,
      extras: {
        version: "v3",
        featureType: "whatsapp_business_app_onboarding",
        features: [
          { name: "app_only_install" },
          { name: "marketing_messages_lite" },
        ],
      },
    });

    action({
      id: channel.id,
      type: channel.type,
      inputPayload: {
        code: response?.authResponse?.code ?? "",
      },
    });
  }
}

class InstagramConnectHandler implements ConnectHandler {
  name = "instagram";
  async connect(channel: Channel, action: Action): Promise<void> {
    const response = await facebookLogin<{
      authResponse: { accessToken: string };
    }>({
      scope: "instagram_basic,pages_show_list",
    });

    action({
      id: channel.id,
      type: channel.type,
      inputPayload: {
        accessToken: response?.authResponse?.accessToken ?? "",
      },
    });
  }
}

export class ProxyConnectHandler implements ConnectHandler {
  name = "proxy";
  connectHandlers: Map<string, ConnectHandler> = new Map();
  register(connectHandler: ConnectHandler) {
    this.connectHandlers.set(connectHandler.name, connectHandler);
  }

  async connect(channel: Channel.Raw, action: Action): Promise<void> {
    await loadFacebookSDK();
    const handler = this.connectHandlers.get(channel.type);
    if (!handler) return;
    return await handler.connect(channel, action);
  }

  static instance() {
    const instance = new ProxyConnectHandler();

    instance.register(new WhatsAppConnectHandler());
    instance.register(new InstagramConnectHandler());

    return instance;
  }
}
