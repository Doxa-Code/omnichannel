import { Channel } from "@omnichannel/core/domain/entities/channel";

export type ConnectHandler = (channel: Channel) => void;

export const createConnectHandlers = (
  connectMutate: (data: {
    id: string;
    type: Channel.Type;
    inputPayload: any;
  }) => void
): Record<Channel.Type, ConnectHandler> => ({
  whatsapp: (channel) => {
    FB.login(
      (response) => {
        connectMutate({
          id: channel.id,
          type: channel.type,
          inputPayload: {
            code: response.authResponse?.code ?? "",
          },
        });
      },
      {
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
      }
    );
  },

  instagram: (channel) => {
    FB.login(
      (response) => {
        connectMutate({
          id: channel.id,
          type: channel.type,
          inputPayload: {
            accessToken: response.authResponse?.accessToken ?? "",
          },
        });
      },
      {
        scope: "instagram_basic,pages_show_list",
      }
    );
  },
});
