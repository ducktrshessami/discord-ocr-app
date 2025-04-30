import { setTimeout } from "timers/promises";
import { Dispatcher, request as rawRequest } from "undici";
import { FETCH_RETRY_DELAY, FETCH_RETRY_LIMIT } from "../../constants.js";
import { HTTPError } from "../../error.js";

function ok(res: Dispatcher.ResponseData): boolean {
    return res.statusCode >= 200 && res.statusCode < 300;
}

export async function request(url: string): Promise<Dispatcher.ResponseData> {
    let tries = 0;
    let res: Dispatcher.ResponseData;
    do {
        if (tries) {
            await setTimeout(FETCH_RETRY_DELAY);
        }
        res = await rawRequest(url);
        tries++;
    }
    while (tries < FETCH_RETRY_LIMIT && !ok(res));
    if (!ok(res)) {
        throw new HTTPError(res.statusCode);
    }
    return res;
}
