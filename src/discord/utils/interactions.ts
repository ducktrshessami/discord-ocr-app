import {
    APIApplicationCommandAutocompleteInteraction,
    APIApplicationCommandInteraction,
    APIInteraction,
    APIInteractionResponseCallbackData,
    APIMessageComponent,
    APIMessageComponentInteraction,
    APIModalSubmissionComponent,
    APIModalSubmitInteraction,
    APIUser,
    ApplicationCommandType,
    Client,
    ComponentType,
    InteractionType,
    ModalSubmitComponent,
    RESTPostAPIApplicationCommandsJSONBody,
    ToEventProps
} from "@discordjs/core";
import { RawFile } from "@discordjs/rest";
import { Awaitable } from "@discordjs/util";
import { readdirSync } from "fs";
import { basename } from "path";
import { fileURLToPath } from "url";
import { ComponentResolutionError, ModalFieldResolutionError } from "../../error.js";

export type WithFiles<T extends {}> = T & { files?: RawFile[] };
export type InteractionResponseCallbackData = WithFiles<APIInteractionResponseCallbackData>;

export function isInteractionType<Type extends InteractionType>(payload: ToEventProps<APIInteraction>, type: Type): payload is ToEventProps<Extract<APIInteraction, { type: Type }>> {
    return payload.data.type === type;
}

export function isCommandInteraction<Type extends ApplicationCommandType>(payload: ToEventProps<APIInteraction>, type: Type): payload is ToEventProps<Extract<APIApplicationCommandInteraction, { data: { type: Type } }>> {
    return isInteractionType(payload, InteractionType.ApplicationCommand) && payload.data.data.type === type;
}

export function isCommandBasedInteraction(payload: ToEventProps<APIInteraction>): payload is ToEventProps<APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction> {
    return isInteractionType(payload, InteractionType.ApplicationCommand) || isInteractionType(payload, InteractionType.ApplicationCommandAutocomplete);
}

export function isMessageComponentInteraction<Type extends ComponentType>(payload: ToEventProps<APIInteraction>, type: Type): payload is ToEventProps<Extract<APIMessageComponentInteraction, { data: { component_type: Type } }>> {
    return isInteractionType(payload, InteractionType.MessageComponent) && payload.data.data.component_type === type;
}

interface InteractionHandler<Interaction extends APIInteraction = APIInteraction> {
    callback(payload: ToEventProps<Interaction>, client: Client): Awaitable<void>;
}

export interface Command<Interaction extends APIApplicationCommandInteraction = APIApplicationCommandInteraction> extends InteractionHandler<Interaction> {
    data: RESTPostAPIApplicationCommandsJSONBody;
    autocomplete?(payload: ToEventProps<APIApplicationCommandAutocompleteInteraction>): Awaitable<void>;
}

type CustomIdInteraction = Extract<APIInteraction, { data: { custom_id: string } }>;
type CustomIdTestFunction<Interaction extends CustomIdInteraction> = (arg: ToEventProps<Interaction>) => Awaitable<boolean>;
type BaseCustomIdTestOptions = { customId: string; } | { pattern: RegExp; };
type BaseComponentTestOptions = { type: ComponentType; };
type DefaultComponentTestOptions = BaseComponentTestOptions & BaseCustomIdTestOptions;
type DefaultModalSubmitTestOptions = BaseCustomIdTestOptions;

function createDefaultComponentCustomIdTest(type: ComponentType, customId: string): CustomIdTestFunction<APIMessageComponentInteraction> {
    return payload => isMessageComponentInteraction(payload, type) && payload.data.data.custom_id === customId;
}

function createDefaultComponentPatternTest(type: ComponentType, pattern: RegExp): CustomIdTestFunction<APIMessageComponentInteraction> {
    return payload => isMessageComponentInteraction(payload, type) && pattern.test(payload.data.data.custom_id);
}

export function createDefaultComponentTest(options: DefaultComponentTestOptions): CustomIdTestFunction<APIMessageComponentInteraction> {
    return "customId" in options ? createDefaultComponentCustomIdTest(options.type, options.customId) : createDefaultComponentPatternTest(options.type, options.pattern);
}

function createDefaultModalSubmitCustomIdTest(customId: string): CustomIdTestFunction<APIModalSubmitInteraction> {
    return payload => payload.data.data.custom_id === customId;
}

function createDefaultModalSubmitPatternTest(pattern: RegExp): CustomIdTestFunction<APIModalSubmitInteraction> {
    return payload => pattern.test(payload.data.data.custom_id);
}

export function createDefaultModalSubmitTest(options: DefaultModalSubmitTestOptions): CustomIdTestFunction<APIModalSubmitInteraction> {
    return "customId" in options ? createDefaultModalSubmitCustomIdTest(options.customId) : createDefaultModalSubmitPatternTest(options.pattern);
}

interface BaseCustomIdInteractionHandler<Interaction extends CustomIdInteraction> extends InteractionHandler<Interaction> {
    test: CustomIdTestFunction<Interaction>;
}

export interface Component<Interaction extends APIMessageComponentInteraction = APIMessageComponentInteraction> extends BaseCustomIdInteractionHandler<Interaction> { }
export interface Modal extends BaseCustomIdInteractionHandler<APIModalSubmitInteraction> { }

export async function collateInteractionHandlers<Interaction extends InteractionHandler>(indexUrl: string): Promise<Interaction[]> {
    const indexBasename = basename(indexUrl);
    return await Promise.all(
        readdirSync(fileURLToPath(new URL(".", indexUrl)))
            .filter(file =>
                (file.indexOf(".") !== 0) &&
                (file !== indexBasename) &&
                (file.slice(-3) === ".js")
            )
            .map(async (file): Promise<Interaction> => {
                const url = new URL(file, indexUrl);
                return await import(url.toString());
            })
    );
}

interface BaseFindComponentByIDQuery<Type extends APIMessageComponent["type"]> {
    id: number;
    type: Type;
}
interface RequiredOption<Required extends boolean = boolean> {
    required: Required;
}

export function findComponentById<Type extends APIMessageComponent["type"]>(components: APIMessageComponent[] | undefined, query: BaseFindComponentByIDQuery<Type> & RequiredOption<false>): Extract<APIMessageComponent, { type: Type }> | null;
export function findComponentById<Type extends APIMessageComponent["type"]>(components: APIMessageComponent[] | undefined, query: BaseFindComponentByIDQuery<Type> & Partial<RequiredOption>): Extract<APIMessageComponent, { type: Type }>;
export function findComponentById<Type extends APIMessageComponent["type"]>(components: APIMessageComponent[] | undefined, { required, ...query }: BaseFindComponentByIDQuery<Type> & Partial<RequiredOption>): Extract<APIMessageComponent, { type: Type }> | null {
    for (const component of components ?? []) {
        if (component.id === query.id) {
            if (component.type !== query.type) {
                throw new ComponentResolutionError(`Expected component type ${ComponentType[query.type]}. Received: ${ComponentType[component.type]}`);
            }
            return <Extract<APIMessageComponent, { type: Type }>>component;
        }
        else if ("components" in component) {
            const result = findComponentById(component.components, { ...query, required: false });
            if (result) {
                return result;
            }
        }
    }
    if (required ?? true) {
        throw new ComponentResolutionError(`Unable to find required component with id: ${query.id}`);
    }
    return null;
}

interface FindModalFieldQuery<Type extends ModalSubmitComponent["type"]> {
    type: Type;
    customId: string;
}

export function findModalField<Type extends ModalSubmitComponent["type"]>(components: APIModalSubmissionComponent[], options: FindModalFieldQuery<Type>): Extract<ModalSubmitComponent, { type: Type }> {
    for (const field of components) {
        let component: ModalSubmitComponent | null = null;
        switch (field.type) {
            case ComponentType.ActionRow: component = field.components.find(component => component.custom_id === options.customId) ?? null; break;
            case ComponentType.Label: component = field.component; break;
        }
        if (component) {
            if (component.type !== ComponentType.TextInput) {
                throw new ModalFieldResolutionError(`Modal field is not of type ${options.type}: ${options.customId}`);
            }
            return component as Extract<ModalSubmitComponent, { type: Type }>;
        }
    }
    throw new ModalFieldResolutionError(`Unable to find modal field: ${options.customId}`);
}

export function interactionUser(interaction: APIInteraction): APIUser {
    return interaction.user ?? interaction.member?.user!;
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
        if (await predicate(arr[i], i, arr)) {
            return arr[i];
        }
    }
}
