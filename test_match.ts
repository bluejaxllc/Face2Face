import "dotenv/config";
import { DatabaseStorage } from "./server/storage.js";

async function run() {
    try {
        const storage = new DatabaseStorage();
        // Use testuser_alpha evaluating against nearby
        const nearby = await storage.getNearbyUsers(
            32.8735,
            -96.5305,
            25000,
            2,
            {
                category: "both",
                datingPreference: "all",
                userGender: "other"
            }
        );
        console.log("SUCCESS! Found users:", nearby.length);
        console.log(nearby.map(u => u.username).join(', '));
    } catch (err) {
        console.error("FAILED! Error:", err);
    } finally {
        process.exit(0);
    }
}
run();
