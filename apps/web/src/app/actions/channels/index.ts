"use server";
import { securityProcedure } from "../procedure";
import z from "zod";
import { Channel } from "@omnichannel/core/domain/entities/channel";
import { ChannelsDatabaseRepository } from "@omnichannel/core/infra/repositories/channels-repository";
import { ConnectChannel } from "@omnichannel/core/application/command/connect-channel";

const channelsRepository = ChannelsDatabaseRepository.instance();

export const listChannels = securityProcedure(["manage:connections"]).handler(
  async ({ ctx }) => {
    return await channelsRepository.list(ctx.membership.workspaceId);
  }
);

export const upsertChannel = securityProcedure(["manage:carts"])
  .input(
    z.object({
      id: z.string().optional(),
      name: z.string(),
    })
  )
  .handler(async ({ input, ctx }) => {
    let channel = await channelsRepository.retrieve(
      input.id ?? ""
    );

    if (!channel) {
      channel = Channel.create(input.name);
    } else {
      channel.setName(input.name);
    }

    await channelsRepository.upsert(channel, ctx.membership.workspaceId);
  });

export const connectChannel = securityProcedure(["manage:connections"])
  .input(
    z.object({
      id: z.string(),
      type: z.enum(["whatsapp"]),
      inputPayload: z.any().optional(),
    })
  )
  .handler(async ({ ctx, input }) => {
    await ConnectChannel.instance().execute({
      workspaceId: ctx.membership.workspaceId,
      type: input.type,
      id: input.id,
      inputPayload: input.inputPayload,
    });
  });

export const disconnectChannel = securityProcedure(["manage:connections"])
  .input(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ ctx, input }) => {
    const channel = await channelsRepository.retrieve(
      input.id
    );

    if (!channel) {
      throw new Error("Canal não encontrado");
    }

    channel.disconnect();

    await channelsRepository.upsert(channel, ctx.membership.workspaceId);
  });

export const removeChannel = securityProcedure(["manage:connections"])
  .input(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ ctx, input }) => {
    await channelsRepository.remove(input.id, ctx.membership.workspaceId);
  });
