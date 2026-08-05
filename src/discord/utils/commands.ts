import { APIApplicationCommandAutocompleteInteraction, APIApplicationCommandInteraction, APIInteraction, ApplicationCommandType, InteractionType, RESTPostAPIApplicationCommandsJSONBody, ToEventProps } from "@discordjs/core";
import { Awaitable } from "@discordjs/util";
import { EventHandler, isInteractionType } from "./interactions.js";

export interface Command<Interaction extends APIApplicationCommandInteraction = APIApplicationCommandInteraction> extends EventHandler<Interaction> {
    data: RESTPostAPIApplicationCommandsJSONBody;
    autocomplete?(payload: ToEventProps<APIApplicationCommandAutocompleteInteraction>): Awaitable<void>;
}

export function isCommandInteraction<Type extends ApplicationCommandType>(payload: ToEventProps<APIInteraction>, type: Type): payload is ToEventProps<Extract<APIApplicationCommandInteraction, { data: { type: Type } }>> {
    return isInteractionType(payload, InteractionType.ApplicationCommand) && payload.data.data.type === type;
}

export function isCommandBasedInteraction(payload: ToEventProps<APIInteraction>): payload is ToEventProps<APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction> {
    return isInteractionType(payload, InteractionType.ApplicationCommand) || isInteractionType(payload, InteractionType.ApplicationCommandAutocomplete);
}
