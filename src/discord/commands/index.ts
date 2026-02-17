import { Collection } from "@discordjs/collection";
import { readdirSync } from "fs";
import { basename } from "path";
import { fileURLToPath } from "url";
import { Command } from "../utils/interactions.js";

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
