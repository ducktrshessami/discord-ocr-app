import { API } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import commands from "./discord/commands/index.js";

try {
    const rest = new REST()
        .setToken(process.env.DISCORD_TOKEN!);
    const api = new API(rest);
    const commandData = commands.map(command => command.data);
    await api.applicationCommands.bulkOverwriteGlobalCommands(process.env.DISCORD_CLIENT_ID!, commandData);
}
catch (err) {
    console.error(err);
}
