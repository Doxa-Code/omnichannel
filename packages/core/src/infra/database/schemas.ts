import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").default("").notNull(),
  payload: jsonb("payload").notNull().default({}),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status", { enum: ["connected", "disconnected"] })
    .default("disconnected")
    .notNull(),
  type: text("type", { enum: ["whatsapp"] })
    .notNull()
    .default("whatsapp"),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").default("").notNull(),
  email: text("email").unique().notNull(),
  thumbnail: text("thumbnail").default(""),
  password: text("password").default("").notNull(),
  sectorId: uuid("sector_id").references(() => sectors.id),
  type: varchar("type", { enum: ["system", "user", "superuser"] })
    .notNull()
    .default("user"),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  permissions: text("permissions").array().notNull().default([]),
});

export const sectors = pgTable("sectors", {
  id: uuid("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
});

export const contacts = pgTable("contacts", {
  phone: varchar("phone", { length: 15 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  thumbnail: text("thumbnail"),
});

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").notNull().unique(),
    channel: uuid("channel")
      .notNull()
      .references(() => channels.id),
    sectorId: uuid("sector_id").references(() => sectors.id),
    contactPhone: varchar("contact_phone", { length: 15 }).references(
      () => contacts.phone
    ),
    attendantId: uuid("attendant_id").references(() => users.id),
    status: varchar("status", {
      length: 10,
      enum: ["open", "closed", "expired", "waiting"],
    }).notNull(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id)
      .notNull(),
    openedAt: integer("opened_at"),
    closedAt: integer("closed_at"),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.contactPhone, table.channel] }),
  ]
);

export const messages = pgTable("messages", {
  id: text("id").primaryKey().notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
  viewedAt: integer("viewed_at"),
  type: varchar("type", { enum: ["text", "audio", "image"], length: 10 }),
  status: text("status", { enum: ["sent", "senting", "viewed", "delivered"] })
    .default("senting")
    .notNull(),
  senderType: varchar("sender_type", {
    length: 10,
    enum: ["attendant", "contact"],
  }),
  senderName: text("sender_name").notNull().default(""),
  senderId: text("sender_id").notNull(),
  internal: boolean("internal").notNull().default(false),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});
