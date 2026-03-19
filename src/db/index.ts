import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL is missing from environment variables!");
    throw new Error("DATABASE_URL is not defined. Please check your .env.local file.");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

export type DB = typeof db;
