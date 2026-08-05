import {
    APIInteraction,
    APIUser,
    Client,
    InteractionType,
    PermissionFlagsBits,
    ToEventProps
} from "@discordjs/core";
import { Awaitable } from "@discordjs/util";
import { readdirSync } from "fs";
import { basename } from "path";
import { fileURLToPath } from "url";

type CustomIdInteraction = Extract<APIInteraction, { data: { custom_id: string } }>;
export type TestFunction<T> = (arg: T) => Awaitable<boolean>;
export type CustomIdTestFunction<Interaction extends CustomIdInteraction> = TestFunction<ToEventProps<Interaction>>;
export type BaseCustomIdTestOptions = { customId: string; } | { pattern: RegExp; };
export interface EventHandler<Data = unknown> {
    callback(payload: ToEventProps<Data>, client: Client): Awaitable<void>;
}
export interface BaseCustomIdInteractionHandler<Interaction extends CustomIdInteraction> extends EventHandler<Interaction> {
    test: CustomIdTestFunction<Interaction>;
}

export async function collateHandlers<Handler extends EventHandler>(indexUrl: string): Promise<Handler[]> {
    const indexBasename = basename(indexUrl);
    return await Promise.all(
        readdirSync(fileURLToPath(new URL(".", indexUrl)))
            .filter(file =>
                (file.indexOf(".") !== 0) &&
                (file !== indexBasename) &&
                (file.slice(-3) === ".js")
            )
            .map(async (file): Promise<Handler> => {
                const url = new URL(file, indexUrl);
                return await import(url.toString());
            })
    );
}

export function isInteractionType<Type extends InteractionType>(payload: ToEventProps<APIInteraction>, type: Type): payload is ToEventProps<Extract<APIInteraction, { type: Type }>> {
    return payload.data.type === type;
}

export function interactionUser(interaction: APIInteraction): APIUser {
    return interaction.user ?? interaction.member?.user!;
}

export function interactionMemberHasPermissions(interaction: APIInteraction, permissions: bigint): boolean {
    if (!interaction.member) {
        return false;
    }
    const memberPermissions = BigInt(interaction.member.permissions);
    return Boolean(memberPermissions & (permissions | PermissionFlagsBits.Administrator));
}
