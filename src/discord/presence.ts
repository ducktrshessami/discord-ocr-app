import {
    ActivityType,
    GatewayActivityUpdateData,
    GatewayPresenceUpdateData,
    PresenceUpdateStatus
} from "@discordjs/core";

const activities: GatewayActivityUpdateData[] = [
    {
        type: ActivityType.Custom,
        name: "_",
        state: "Having a bad time"
    }
];

export function getPresence(): GatewayPresenceUpdateData {
    return {
        status: PresenceUpdateStatus.Online,
        activities: activities.length ? [activities[Math.floor(Math.random() * activities.length)]] : [],
        afk: false,
        since: null
    };
}
