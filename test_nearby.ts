import "dotenv/config";
import { DatabaseStorage } from "./server/storage";

async function test() {
    try {
        const storage = new DatabaseStorage();

        // 1. Get a random user to act as the seeker
        const users = await storage.getNearbyUsers(0, 0, 1000000, 0);
        // Wait, radius 1000000 miles from 0,0 will get almost everyone

        console.log(`Total users in DB (active, with location): ${users.length}`);

        if (users.length < 2) {
            console.log("Not enough users to test matching.");
            process.exit(0);
        }

        const testUser = users[0];
        console.log(`\nTesting from perspective of User ID ${testUser.id} (${testUser.gender}, seeking ${testUser.datingPreference})`);

        // 2. Fetch nearby for this user with their actual layout
        const nearby = await storage.getNearbyUsers(
            Number(testUser.latitude),
            Number(testUser.longitude),
            25000,
            testUser.id,
            {
                datingPreference: testUser.datingPreference,
                userGender: testUser.gender
            }
        );

        console.log(`Found ${nearby.length} matches!`);
        nearby.forEach(u => {
            console.log(` - Match: User ID ${u.id} (${u.gender}, seeking ${u.datingPreference})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
