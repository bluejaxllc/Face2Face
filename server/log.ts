/**
 * Simple logging utility — extracted from vite.ts to avoid
 * importing the Vite library in serverless/production environments.
 */
export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    console.log(`${formattedTime} [${source}] ${message}`);
}
