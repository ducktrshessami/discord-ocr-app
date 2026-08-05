import { APIModalSubmitInteraction } from "@discordjs/core";
import { BaseCustomIdInteractionHandler, BaseCustomIdTestOptions, CustomIdTestFunction } from "./interactions.js";

export type DefaultModalSubmitTestOptions = BaseCustomIdTestOptions;
export interface Modal extends BaseCustomIdInteractionHandler<APIModalSubmitInteraction> { }

function createDefaultModalSubmitCustomIdTest(customId: string): CustomIdTestFunction<APIModalSubmitInteraction> {
    return payload => payload.data.data.custom_id === customId;
}

function createDefaultModalSubmitPatternTest(pattern: RegExp): CustomIdTestFunction<APIModalSubmitInteraction> {
    return payload => pattern.test(payload.data.data.custom_id);
}

export function createDefaultModalSubmitTest(options: DefaultModalSubmitTestOptions): CustomIdTestFunction<APIModalSubmitInteraction> {
    return "customId" in options ? createDefaultModalSubmitCustomIdTest(options.customId) : createDefaultModalSubmitPatternTest(options.pattern);
}
