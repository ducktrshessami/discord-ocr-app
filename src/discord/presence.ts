import {
    ActivityType,
    GatewayActivityUpdateData,
    GatewayPresenceUpdateData,
    PresenceUpdateStatus
} from "@discordjs/core";
import { randomArrayItem } from "./utils/misc.js";

const activities: GatewayActivityUpdateData[] = [
    {
        type: ActivityType.Custom,
        name: "_",
        state: "Reading the tea leaves"
    }
];

export function getPresence(): GatewayPresenceUpdateData {
    return {
        status: PresenceUpdateStatus.Online,
        activities: activities.length ? [randomArrayItem(activities)] : [],
        afk: false,
        since: null
    };
}
