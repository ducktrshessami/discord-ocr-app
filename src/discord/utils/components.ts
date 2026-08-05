import { APIInteraction, APIMessageComponentInteraction, ComponentType, InteractionType, ToEventProps } from "@discordjs/core";
import { BaseCustomIdInteractionHandler, BaseCustomIdTestOptions, CustomIdTestFunction, isInteractionType } from "./interactions.js";

type BaseComponentTestOptions = { type: ComponentType; };
export type DefaultComponentTestOptions = BaseComponentTestOptions & BaseCustomIdTestOptions;
export interface Component<Interaction extends APIMessageComponentInteraction = APIMessageComponentInteraction> extends BaseCustomIdInteractionHandler<Interaction> { }

export function isMessageComponentInteraction<Type extends ComponentType>(payload: ToEventProps<APIInteraction>, type: Type): payload is ToEventProps<Extract<APIMessageComponentInteraction, { data: { component_type: Type } }>> {
    return isInteractionType(payload, InteractionType.MessageComponent) && payload.data.data.component_type === type;
}

function createDefaultComponentCustomIdTest(type: ComponentType, customId: string): CustomIdTestFunction<APIMessageComponentInteraction> {
    return payload => isMessageComponentInteraction(payload, type) && payload.data.data.custom_id === customId;
}

function createDefaultComponentPatternTest(type: ComponentType, pattern: RegExp): CustomIdTestFunction<APIMessageComponentInteraction> {
    return payload => isMessageComponentInteraction(payload, type) && pattern.test(payload.data.data.custom_id);
}

export function createDefaultComponentTest(options: DefaultComponentTestOptions): CustomIdTestFunction<APIMessageComponentInteraction> {
    return "customId" in options ? createDefaultComponentCustomIdTest(options.type, options.customId) : createDefaultComponentPatternTest(options.type, options.pattern);
}
