import { readdirSync } from "fs";
import { basename } from "path";
import { fileURLToPath } from "url";
import { Modal } from "../utils/interactions.js";

const indexBasename = basename(import.meta.url);
const modals = await Promise.all(
    readdirSync(fileURLToPath(new URL(".", import.meta.url)))
        .filter(file =>
            (file.indexOf(".") !== 0) &&
            (file !== indexBasename) &&
            (file.slice(-3) === ".js")
        )
        .map(async (file): Promise<Modal> => {
            const url = new URL(file, import.meta.url);
            const modal: Modal = await import(url.toString());
            return modal;
        })
);
export default modals;
