import {
    APIApplicationCommandAutocompleteInteraction,
    APIApplicationCommandInteraction,
    APIInteraction,
    APIInteractionResponseCallbackData,
    APIMessageComponentInteraction,
    APIModalSubmitInteraction,
    APIUser,
    InteractionType,
    ToEventProps
} from "@discordjs/core";
import { RawFile } from "@discordjs/rest";

export type WithFiles<T extends {}> = T & { files?: RawFile[] };
export type InteractionResponseCallbackData = WithFiles<APIInteractionResponseCallbackData>;

export function isCommandBasedInteraction(payload: ToEventProps<APIInteraction>): payload is ToEventProps<APIApplicationCommandInteraction> | ToEventProps<APIApplicationCommandAutocompleteInteraction> {
    return payload.data.type === InteractionType.ApplicationCommand || payload.data.type === InteractionType.ApplicationCommandAutocomplete;
}

export function isApplicationCommandInteraction(payload: ToEventProps<APIInteraction>): payload is ToEventProps<APIApplicationCommandInteraction> {
    return payload.data.type === InteractionType.ApplicationCommand;
}

export function isAutocompleteInteraction(payload: ToEventProps<APIInteraction>): payload is ToEventProps<APIApplicationCommandAutocompleteInteraction> {
    return payload.data.type === InteractionType.ApplicationCommandAutocomplete;
}

export function isMessageComponentInteraction(payload: ToEventProps<APIInteraction>): payload is ToEventProps<APIMessageComponentInteraction> {
    return payload.data.type === InteractionType.MessageComponent;
}

export function isModalSubmitInteraction(payload: ToEventProps<APIInteraction>): payload is ToEventProps<APIModalSubmitInteraction> {
    return payload.data.type === InteractionType.ModalSubmit;
}

export function interactionUser(interaction: APIInteraction): APIUser {
    return interaction.user ?? interaction.member?.user!;
}
