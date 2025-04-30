import { Collection } from "@discordjs/collection";
import {
    APIApplicationCommandAutocompleteInteraction,
    APIApplicationCommandInteraction,
    RESTPostAPIApplicationCommandsJSONBody,
    ToEventProps
} from "@discordjs/core";
import { Awaitable } from "@discordjs/util";
import { readdirSync } from "fs";
import { basename } from "path";
import { fileURLToPath } from "url";

const indexBasename = basename(import.meta.url);
const commands = new Collection<string, Command>(
    await Promise.all(
        readdirSync(fileURLToPath(new URL(".", import.meta.url)))
            .filter(file =>
                (file.indexOf(".") !== 0) &&
                (file !== indexBasename) &&
                (file.slice(-3) === ".js")
            )
            .map(async (file): Promise<[string, Command]> => {
                const url = new URL(file, import.meta.url);
                const cmd: Command = await import(url.toString());
                return [cmd.data.name, cmd];
            })
    )
);
export default commands;

interface Command<Interaction extends APIApplicationCommandInteraction = APIApplicationCommandInteraction> {
    data: RESTPostAPIApplicationCommandsJSONBody;
    autocomplete?(payload: ToEventProps<APIApplicationCommandAutocompleteInteraction>): Awaitable<void>;
    callback(payload: ToEventProps<Interaction>): Awaitable<void>;
}
