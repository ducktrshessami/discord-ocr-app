import { Awaitable } from "@discordjs/util";

export function randomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

export function randomArrayItem<T>(array: T[]): T {
    return array[randomInt(array.length)]!;
}

export async function findAsync<T>(
    arr: T[],
    predicate: (value: T, index: number, obj: T[]) => Awaitable<unknown>,
    thisArg?: any
): Promise<T | undefined> {
    if (thisArg != null) {
        predicate = predicate.bind(thisArg);
    }
    for (let i = 0; i < arr.length; i++) {
        if (await predicate(arr[i]!, i, arr)) {
            return arr[i];
        }
    }
}
