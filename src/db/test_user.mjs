import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT email FROM users LIMIT 1');
  console.log("TEST_EMAIL=" + (res.rows[0]?.email || 'none'));
  await client.end();
}

main().catch(console.error);
