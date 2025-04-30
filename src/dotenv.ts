export default async function dotenv() {
    try {
        await import("dotenv/config");
    }
    catch {
        console.warn("Not using dotenv. Ensure environment variables are set");
    }
}
