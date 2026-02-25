import { eq } from "drizzle-orm";
import { db } from "./index";
import { scans, users, type NewScan, type ScanResult } from "./schema";

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

export async function createScan(data: NewScan) {
    const [scan] = await db.insert(scans).values(data).returning();
    return scan;
}

export async function getUserScans(userId: string) {
    return db
        .select()
        .from(scans)
        .where(eq(scans.userId, userId))
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
