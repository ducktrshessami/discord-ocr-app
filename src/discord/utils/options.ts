import { Collection } from "@discordjs/collection";
import {
    APIApplicationCommandInteractionDataOption,
    APIInteractionDataOptionBase,
    ApplicationCommandOptionType,
    InteractionType
} from "@discordjs/core";
import { CommandOptionResolutionError } from "../../error.js";

type ApplicationCommandInteractionTypes = InteractionType.ApplicationCommand | InteractionType.ApplicationCommandAutocomplete;
type ExtractedOption<CommandInteractionType extends ApplicationCommandInteractionTypes, OptionType extends ApplicationCommandOptionType> = Extract<APIApplicationCommandInteractionDataOption<CommandInteractionType>, { type: OptionType; }>;
export type SubcommandOptionType = ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup;
export type FocusableOptionType = ApplicationCommandOptionType.String |
    ApplicationCommandOptionType.Integer |
    ApplicationCommandOptionType.Number;
export interface AutocompleteFocusedOption extends APIInteractionDataOptionBase<FocusableOptionType, string> {
    focused: true;
}
interface BaseGetOptionQuery<OptionType extends ApplicationCommandOptionType> {
    name: string;
    type: OptionType;
}
interface RequiredOption<Required extends boolean = boolean> {
    required: Required;
}

export class ApplicationCommandOptions<CommandInteractionType extends ApplicationCommandInteractionTypes> {
    private readonly _options: Collection<string, APIApplicationCommandInteractionDataOption<CommandInteractionType>>;
    private _subcommand: string | null;
    private _group: string | null;
    private _focused: string | null;

    private mapOptions(options: APIApplicationCommandInteractionDataOption<CommandInteractionType>[] | undefined): void {
        options?.forEach(option => {
            switch (true) {
                case option.type === ApplicationCommandOptionType.Subcommand: this._subcommand = option.name; break;
                case option.type === ApplicationCommandOptionType.SubcommandGroup: this._group = option.name; break;
                default:
                    if ("focused" in option && option.focused) {
                        this._focused = option.name;
                    }
                    this._options.set(option.name, option);
                    break;
            }
            if ("options" in option) {
                this.mapOptions(option.options);
            }
        });
    }

    constructor(options?: APIApplicationCommandInteractionDataOption<CommandInteractionType>[]) {
        this._options = new Collection<string, APIApplicationCommandInteractionDataOption<CommandInteractionType>>();
        this._subcommand = null;
        this._group = null;
        this._focused = null;
        this.mapOptions(options);
    }

    get<OptionType extends Exclude<ApplicationCommandOptionType, SubcommandOptionType>>(query: BaseGetOptionQuery<OptionType> & RequiredOption<true>): ExtractedOption<CommandInteractionType, OptionType>;
    get<OptionType extends Exclude<ApplicationCommandOptionType, SubcommandOptionType>>(query: BaseGetOptionQuery<OptionType> & Partial<RequiredOption>): ExtractedOption<CommandInteractionType, OptionType> | null;
    get<OptionType extends Exclude<ApplicationCommandOptionType, SubcommandOptionType>>(query: BaseGetOptionQuery<OptionType> & Partial<RequiredOption>): ExtractedOption<CommandInteractionType, OptionType> | null {
        const option = this._options.get(query.name) ?? null;
        if (query.required && !option) {
            throw new CommandOptionResolutionError(`Unable to find required option: ${query.name}`);
        }
        if (option && option.type !== query.type) {
            throw new CommandOptionResolutionError(`Expected option type ${ApplicationCommandOptionType[query.type]}. Received: ${ApplicationCommandOptionType[option.type]}`);
        }
        return <ExtractedOption<CommandInteractionType, OptionType> | null>option;
    }

    get subcommand(): string | null {
        return this._subcommand;
    }

    get group(): string | null {
        return this._group;
    }

    getFocused(): AutocompleteFocusedOption {
        if (!this._focused) {
            throw new CommandOptionResolutionError("Unabled to find focused option");
        }
        return <AutocompleteFocusedOption>this._options.get(this._focused)!;
    }
}
