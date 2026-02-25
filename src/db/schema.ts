import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique().notNull(),
    name: text("name"),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scans = pgTable("scans", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    competitors: jsonb("competitors").notNull().$type<string[]>(),
    rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
    result: jsonb("result").$type<ScanResult>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;

export interface ScanResult {
    gaps: GapItem[];
}

export interface GapItem {
    title: string;
    gapScore: number;
    reasoning: string;
    hook: string;
    format: string;
    monetizationAngle: string;
}
