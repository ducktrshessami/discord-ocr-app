export const PRESENCE_INTERVAL = envInt("PRESENCE_INTERVAL", 1800000);
export const FETCH_RETRY_LIMIT = envInt("FETCH_RETRY_LIMIT", 5);
export const FETCH_RETRY_DELAY = envInt("FETCH_RETRY_DELAY", 1000);

function envInt(env: string, defaultValue: number): number {
    return process.env[env] ? parseInt(process.env[env]!) : defaultValue;
}
