import { and, eq } from "drizzle-orm";
import { createDatabaseConnection } from "../database";
import { channels } from "../database/schemas";
import { Channel } from "../../domain/entities/channel";

export class ChannelsDatabaseRepository {
  async list(workspaceId: string): Promise<Channel.Raw[]> {
    const db = createDatabaseConnection();

    const result = await db
      .select({
        id: channels.id,
        name: channels.name,
        createdAt: channels.createdAt,
        status: channels.status,
        type: channels.type,
        payload: channels.payload,
      })
      .from(channels)
      .where(eq(channels.workspaceId, workspaceId));

    return result;
  }

  async upsert(channel: Channel, workspaceId: string) {
    const db = createDatabaseConnection();
    await db
      .insert(channels)
      .values({
        id: channel.id,
        name: channel.name,
        workspaceId,
        createdAt: channel.createdAt,
        status: channel.status,
        type: channel.type,
        payload: channel.payload,
      })
      .onConflictDoUpdate({
        set: {
          name: channel.name,
          workspaceId,
          createdAt: channel.createdAt,
          status: channel.status,
          type: channel.type,
          payload: channel.payload,
        },
        target: channels.id,
      });
  }

  async retrieve(id: string): Promise<Channel | null> {
    const db = createDatabaseConnection();

    const [result] = await db
      .select({
        id: channels.id,
        name: channels.name,
        createdAt: channels.createdAt,
        status: channels.status,
        type: channels.type,
        payload: channels.payload,
      })
      .from(channels)
      .where(eq(channels.id, id));

    if (!result) {
      return null;
    }

    return Channel.instance({
      id: result.id,
      name: result.name,
      createdAt: result.createdAt,
      status: result.status,
      type: result.type,
      payload: result.payload,
    });
  }

  async remove(id: string, workspaceId: string) {
    const db = createDatabaseConnection();
    await db
      .delete(channels)
      .where(and(eq(channels.id, id), eq(channels.workspaceId, workspaceId)));
  }

  static instance() {
    return new ChannelsDatabaseRepository();
  }
}
