import { Collection } from "@discordjs/collection";
import { Command } from "../utils/commands.js";
import { collateHandlers } from "../utils/interactions.js";

const commandHandlers = await collateHandlers<Command>(import.meta.url);
const commands = new Collection<string, Command>(commandHandlers.map(handler => [handler.data.name, handler]));
export default commands;
