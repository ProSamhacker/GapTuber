import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique().notNull(),
    name: text("name"),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channels = pgTable("channels", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role").$type<"new_tuber" | "existing_tuber">().notNull(),
    category: text("category"),
    topic: text("topic"),
    brandingData: jsonb("branding_data"),
    youtubeChannelId: text("youtube_channel_id"),
    videoIdeas: jsonb("video_ideas").$type<VideoIdeaDB[]>(),
    contentStrategy: text("content_strategy"),
    marketSnapshot: jsonb("market_snapshot").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scans = pgTable("scans", {
    id: uuid("id").defaultRandom().primaryKey(),
    channelId: uuid("channel_id")
        .notNull()
        .references(() => channels.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    competitors: jsonb("competitors").notNull().$type<string[]>(),
    rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
    result: jsonb("result").$type<ScanResult>(),
    analytics: jsonb("analytics").$type<ScanAnalytics>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface VideoIdeaDB {
    title: string;
    hook: string;
    format: string;
    whyItWorks: string;
    estimatedViewPotential: "high" | "medium" | "low";
    targetAudience: string;
}

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;

export interface ScanResult {
    gaps: GapItem[];
    overallOpportunity?: string;
    recommendedNiche?: string;
}

export interface GapItem {
    title: string;
    gapScore: number;
    reasoning: string;
    hook: string;
    format: string;
    monetizationAngle: string;
    targetAudience?: string;
    contentOutline?: string[];
    seoTips?: string[];
    competitorWeakness?: string;
}

export interface ScanAnalytics {
    velocity: { score: number; insight: string; weeklyGrowthRate: number };
    saturation: { score: number; insight: string; competitionLevel: string };
    frustration: { score: number; topKeywords: string[]; painPoints: string[] };
    engagement: { score: number; avgLikeRate: number; avgCommentRate: number };
    trend: { score: number; trend: string; insight: string };
    competition: { score: number; difficulty: string; insight: string };
    uploadSchedule: { bestDay: string; bestHour: number; insight: string };
    revenueEstimate: { low: number; mid: number; high: number };
    suggestedTags: string[];
}

// ─── AuraBot Schema ──────────────────────────────────────────────────────────

export const botChats = pgTable("bot_chats", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New Chat"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const botMessages = pgTable("bot_messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    chatId: uuid("chat_id")
        .notNull()
        .references(() => botChats.id, { onDelete: "cascade" }),
    sender: text("sender").$type<"user" | "ai">().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BotChat = typeof botChats.$inferSelect;
export type NewBotChat = typeof botChats.$inferInsert;
export type BotMessage = typeof botMessages.$inferSelect;
export type NewBotMessage = typeof botMessages.$inferInsert;
