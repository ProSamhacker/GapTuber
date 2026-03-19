import { db } from "./index";
import { users } from "./schema";

async function main() {
    const allUsers = await db.select().from(users).limit(1);
    console.log(JSON.stringify(allUsers, null, 2));
    process.exit(0);
}

main();
