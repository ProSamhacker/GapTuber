import { eq, desc, and } from "drizzle-orm";
import { db } from "./index";
import { scans, users, channels, botChats, botMessages, type NewScan, type NewChannel, type NewBotMessage } from "./schema";

export async function upsertUser(email: string, name?: string, image?: string) {
    const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (existing.length > 0) return existing[0];

    const [user] = await db
        .insert(users)
        .values({ email, name, image })
        .returning();

    return user;
}

export async function createChannel(data: NewChannel) {
    const [channel] = await db.insert(channels).values(data).returning();
    return channel;
}

export async function getChannelsByUserId(userId: string) {
    return db
        .select()
        .from(channels)
        .where(eq(channels.userId, userId))
        .orderBy(channels.createdAt);
}

export async function getChannelById(id: string) {
    const [channel] = await db
        .select()
        .from(channels)
        .where(eq(channels.id, id))
        .limit(1);
    return channel ?? null;
}

export async function deleteChannel(id: string, userId: string) {
    return db
        .delete(channels)
        .where(and(eq(channels.id, id), eq(channels.userId, userId)));
}

export async function createScan(data: NewScan) {
    const [scan] = await db.insert(scans).values(data).returning();
    return scan;
}

export async function getChannelScans(channelId: string) {
    return db
        .select()
        .from(scans)
        .where(eq(scans.channelId, channelId))
        .orderBy(scans.createdAt);
}

export async function getScanById(id: string) {
    const [scan] = await db.select().from(scans).where(eq(scans.id, id)).limit(1);
    return scan ?? null;
}

export async function getUserByEmail(email: string) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    return user ?? null;
}

export async function updateChannelBlueprint(
    channelId: string,
    data: {
        videoIdeas?: any[];
        contentStrategy?: string;
        marketSnapshot?: Record<string, unknown>;
    }
) {
    const [updated] = await db
        .update(channels)
        .set({
            videoIdeas: data.videoIdeas,
            contentStrategy: data.contentStrategy,
            marketSnapshot: data.marketSnapshot,
        })
        .where(eq(channels.id, channelId))
        .returning();
    return updated;
}

// ─── AuraBot Queries ─────────────────────────────────────────────────────────

export async function createBotChat(userId: string, title?: string) {
    const [chat] = await db
        .insert(botChats)
        .values({ userId, title: title || "New Chat" })
        .returning();
    return chat;
}

export async function getBotChatsByUserId(userId: string) {
    return db
        .select()
        .from(botChats)
        .where(eq(botChats.userId, userId))
        .orderBy(desc(botChats.updatedAt));
}

export async function getBotChatById(id: string) {
    const [chat] = await db
        .select()
        .from(botChats)
        .where(eq(botChats.id, id))
        .limit(1);
    return chat ?? null;
}

export async function deleteBotChat(id: string) {
    const [chat] = await db
        .delete(botChats)
        .where(eq(botChats.id, id))
        .returning();
    return chat;
}

export async function createBotMessage(data: NewBotMessage) {
    // Update the chat's updatedAt timestamp
    await db
        .update(botChats)
        .set({ updatedAt: new Date() })
        .where(eq(botChats.id, data.chatId));

    const [message] = await db
        .insert(botMessages)
        .values(data)
        .returning();
    return message;
}

export async function getBotMessagesByChatId(chatId: string) {
    return db
        .select()
        .from(botMessages)
        .where(eq(botMessages.chatId, chatId))
        .orderBy(botMessages.createdAt);
}
