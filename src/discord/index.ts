import {
    ApplicationCommandType,
    Client,
    GatewayDispatchEvents,
    InteractionContextType
} from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager, WebSocketShardEvents } from "@discordjs/ws";
import { isGuildInteraction } from "discord-api-types/utils";
import { PRESENCE_INTERVAL } from "../constants.js";
import commands from "./commands/index.js";
import { getPresence } from "./presence.js";
import {
    isApplicationCommandInteraction,
    isAutocompleteInteraction,
    isCommandBasedInteraction
} from "./utils/interactions.js";

const rest = new REST()
    .setToken(process.env.DISCORD_TOKEN!);
const gateway = new WebSocketManager({
    rest,
    intents: 0,
    token: process.env.DISCORD_TOKEN!,
    initialPresence: getPresence()
})
    .on(WebSocketShardEvents.Debug, logDebug)
    .on(WebSocketShardEvents.Error, console.error);
const client = new Client({ rest, gateway })
    .once(GatewayDispatchEvents.Ready, async ({ shardId, data }) => {
        try {
            gateway.off(WebSocketShardEvents.Debug, logDebug);
            console.log(`[discord] Logged in as ${data.user.username}#${data.user.discriminator}`);
            setInterval(() => client.updatePresence(shardId, getPresence()), PRESENCE_INTERVAL);
        }
        catch (err) {
            console.error(err);
        }
    })
    .on(GatewayDispatchEvents.InteractionCreate, async payload => {
        try {
            const userId = payload.data.member?.user.id ?? payload.data.user?.id;
            if (isCommandBasedInteraction(payload)) {
                const command = commands.get(payload.data.data.name);
                if (
                    command &&
                    payload.data.data.type === (command.data.type ?? ApplicationCommandType.ChatInput) && (
                        isGuildInteraction(payload.data) ||
                        command.data.contexts?.some(context => context !== InteractionContextType.Guild)
                    )
                ) {
                    if (isApplicationCommandInteraction(payload)) {
                        console.log(`[discord] ${userId} used ${ApplicationCommandType[payload.data.data.type]} command ${payload.data.data.name}`);
                        await command.callback(payload);
                    }
                    else if (isAutocompleteInteraction(payload) && command.autocomplete) {
                        await command.autocomplete(payload);
                    }
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    });

export async function login(): Promise<void> {
    console.log("[discord] Logging in");
    await gateway.connect();
}

function logDebug(message: string): void {
    console.debug(`[discord] ${message}`);
}
