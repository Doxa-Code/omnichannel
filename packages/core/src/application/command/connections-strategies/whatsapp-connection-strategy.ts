import axios from "axios";
import { ConnectionStrategy } from "./connection-strategy";

type InputDTO = {
  code: string;
};

export type OutputDTO = {
  accessToken: string;
  businessId: string;
  wabaId: string;
  phoneId: string;
  phoneNumber: string;
};

export class WhatsappConnectionStrategy
  implements ConnectionStrategy<InputDTO, OutputDTO>
{
  name: string = "whatsapp";
  async connect(input: InputDTO): Promise<any> {
    const metaClient = axios.create({
      baseURL: "https://graph.facebook.com/v23.0",
    });

    const {
      data: { access_token },
    } = await metaClient.get(
      `/oauth/access_token?client_id=${process.env.META_APP_CLIENT_ID}&client_secret=${process.env.META_APP_SECRET}&code=${input.code}`
    );

    const {
      data: { client_business_id: businessId },
    } = await metaClient.get(
      `/me?fields=client_business_id&access_token=${access_token}`
    );

    const {
      data: {
        data: [{ id: wabaId }],
      },
    } = await metaClient.get(
      `/${businessId}/owned_whatsapp_business_accounts?access_token=${access_token}`
    );

    await metaClient.post(
      `/${wabaId}/subscribed_apps?access_token=${access_token}`
    );

    const {
      data: {
        data: [{ id: phoneId, display_phone_number: phoneNumber }],
      },
    } = await metaClient.get(
      `/${wabaId}/phone_numbers?access_token=${access_token}`
    );

    return {
      accessToken: access_token,
      businessId,
      wabaId,
      phoneId,
      phoneNumber,
    };
  }

  static instance() {
    return new WhatsappConnectionStrategy();
  }
}
