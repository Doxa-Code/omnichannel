"use server";
import { sseEmitter } from "@/lib/sse";
import { ChangeStatusMessage } from "@omnichannel/core/application/command/change-status-message";
import { MarkLastMessagesContactAsViewed } from "@omnichannel/core/application/command/mark-last-messages-contact-as-viewed";
import { MessageReceived } from "@omnichannel/core/application/command/message-received";
import { SendAudio } from "@omnichannel/core/application/command/send-audio";
import { SendMessage } from "@omnichannel/core/application/command/send-message";
import { NotFound } from "@omnichannel/core/domain/errors/not-found";
import { ProxyMessageDriver } from "@omnichannel/core/infra/drivers/message-driver";
import { ChannelsDatabaseRepository } from "@omnichannel/core/infra/repositories/channels-repository";
import { MessagesDatabaseRepository } from "@omnichannel/core/infra/repositories/messages-repository";
import z from "zod";
import { securityProcedure } from "../procedure";

const messagesRepository = MessagesDatabaseRepository.instance();
const channelsRepository = ChannelsDatabaseRepository.instance();
const messageDriver = ProxyMessageDriver.instance();

export const sendTyping = securityProcedure([
  "view:conversation",
  "view:conversations",
])
  .input(
    z.object({
      channelId: z.string(),
      messageId: z.string(),
    })
  )
  .handler(async ({ input, ctx }) => {
    const message = await messagesRepository.retrieveConversationId(
      input.messageId
    );
    const messageDriver = ProxyMessageDriver.instance();
    const channel = await channelsRepository.retrieve(input.channelId);

    if (!channel) throw NotFound.throw("Channel");

    sseEmitter.emit("typing", message);

    await messageDriver.sendTyping({
      workspaceId: ctx.membership.workspaceId,
      channel,
      lastMessageId: input.messageId,
    });
  });

export const changeStatusMessage = securityProcedure([
  "view:conversation",
  "view:conversations",
])
  .input(
    z.object({
      messageId: z.string(),
      status: z.string(),
    })
  )
  .onError(async (err) => {
    console.log(err);
  })
  .handler(async ({ input, ctx }) => {
    const changeStatusMessage = ChangeStatusMessage.instance();
    await changeStatusMessage.execute({
      messageId: input.messageId,
      status: input.status,
      workspaceId: ctx.membership.workspaceId,
    });
  });

export const messageReceived = securityProcedure([
  "view:conversation",
  "view:conversations",
])
  .input(
    z.object({
      channelId: z.string(),
      contactName: z.string(),
      contactPhone: z.string(),
      messagePayload: z.object({
        content: z.string(),
        id: z.string(),
        timestamp: z.number(),
        type: z.enum(["text", "audio", "image"]),
      }),
    })
  )
  .handler(async ({ input, ctx }) => {
    const messageReceived = MessageReceived.instance();
    const channel = await channelsRepository.retrieve(input.channelId);

    if (!channel) throw NotFound.throw("Channel");
    const response = await messageReceived.execute({
      channel,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      messagePayload: {
        content: input.messagePayload.content,
        id: input.messagePayload.id,
        timestamp: input.messagePayload.timestamp,
        type: input.messagePayload.type,
      },
      workspaceId: ctx.membership.workspaceId,
    });
    sseEmitter.emit("conversation", response?.conversation?.raw());

    return {
      ...response,
      conversation: response?.conversation?.raw(),
    };
  });

export const listenAudio = securityProcedure([
  "view:conversation",
  "view:conversations",
])
  .input(
    z.object({
      channelId: z.string(),
      messageId: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const message = await messagesRepository.retrieve(input.messageId);
    const channel = await channelsRepository.retrieve(input.channelId);

    if (!channel) throw NotFound.throw("Channel");

    if (!message || message?.type !== "audio") return;

    const { success, content: arrayBuffer } = await messageDriver.downloadMedia(
      channel,
      message.content
    );
    if (!success) return;

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "audio/ogg",
      },
    });
  });

export const retrieveImage = securityProcedure([
  "view:conversation",
  "view:conversations",
])
  .input(
    z.object({
      channelId: z.string(),
      messageId: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const message = await messagesRepository.retrieve(input.messageId);
    const channel = await channelsRepository.retrieve(input.channelId);

    if (!channel) throw NotFound.throw("Channel");

    if (!message || message?.type !== "image") return;

    const { success, content: arrayBuffer } = await messageDriver.downloadMedia(
      channel,
      message.content
    );
    if (!success) return;

    return new Response(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
      },
    });
  });

export const sendAudio = securityProcedure(["send:message"])
  .input(
    z.object({
      file: z.instanceof(File),
      conversationId: z.string(),
      channelId: z.string(),
    })
  )
  .handler(async ({ input, ctx }) => {
    const sendAudio = SendAudio.instance();

    const conversation = await sendAudio.execute({
      conversationId: input.conversationId,
      channelId: input.channelId,
      userId: ctx.user.id,
      userName: ctx.user.name,
      workspaceId: ctx.membership.workspaceId,
      file: input.file,
    });

    sseEmitter.emit("conversation", conversation.raw());
    sseEmitter.emit("untyping", { conversationId: conversation.id });
  });

export const sendMessage = securityProcedure(["send:message"])
  .input(
    z.object({
      conversationId: z.string(),
      channelId: z.string(),
      content: z.string(),
    })
  )
  .handler(async ({ input, ctx }) => {
    const sendMessage = SendMessage.instance();

    const conversation = await sendMessage.execute({
      content: input.content,
      conversationId: input.conversationId,
      channelId: input.channelId,
      userId: ctx.user.id,
      userName: ctx.user.name,
      workspaceId: ctx.membership.workspaceId,
    });

    if (conversation) {
      sseEmitter.emit("conversation", conversation.raw());
    }

    sseEmitter.emit("untyping", { conversationId: input.conversationId });
  });

export const markLastMessagesContactAsViewed = securityProcedure([
  "view:conversation",
  "view:conversations",
])
  .input(z.object({ channelId: z.string(), contactPhone: z.string() }))
  .handler(async ({ input, ctx: { membership } }) => {
    const markLastMessagesContactAsViewed =
      MarkLastMessagesContactAsViewed.instance();

    const conversation = await markLastMessagesContactAsViewed.execute({
      channel: input.channelId,
      workspaceId: membership.workspaceId,
      contactPhone: input.contactPhone,
    });

    sseEmitter.emit("conversation", conversation.raw());

    return conversation.raw();
  });
