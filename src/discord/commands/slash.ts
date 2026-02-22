import {
    API,
    APIChatInputApplicationCommandInteraction,
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ApplicationIntegrationType,
    ComponentType,
    InteractionContextType,
    InteractionType,
    MessageFlags,
    RESTPostAPIApplicationCommandsJSONBody,
    TextInputStyle,
    ToEventProps
} from "@discordjs/core";
import { ApplicationCommandOptions } from "discord-data-resolvers";
import { ocrFromURLs } from "../utils/ocr.js";

export const data: RESTPostAPIApplicationCommandsJSONBody = {
    type: ApplicationCommandType.ChatInput,
    name: "recognize",
    description: "Recognize text from an image",
    integration_types: [
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall
    ],
    contexts: [
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel
    ],
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "url",
            description: "Recognize text from a URL",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "url",
                    description: "URL to recognize text from",
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "show",
                    description: "Show the results. Defaults to false"
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "image",
            description: "Recognize text from an image",
            options: [
                {
                    type: ApplicationCommandOptionType.Attachment,
                    name: "image",
                    description: "Image to recognize text from",
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.Boolean,
                    name: "show",
                    description: "Show the results. Defaults to false"
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "bulk-image",
            description: "Recognize text from multiple images",
            options: [{
                type: ApplicationCommandOptionType.Boolean,
                name: "show",
                description: "Show the results. Defaults to false"
            }]
        }
    ]
};

async function bulkCallback(
    api: API,
    interaction: APIChatInputApplicationCommandInteraction,
    options: ApplicationCommandOptions<InteractionType.ApplicationCommand>
): Promise<void> {
    const show = options.get({
        type: ApplicationCommandOptionType.Boolean,
        name: "show"
    });
    await api.interactions.createModal(interaction.id, interaction.token, {
        custom_id: `bulk-image|${Number(show?.value ?? false)}`,
        title: "Upload images",
        components: [
            {
                type: ComponentType.Label,
                label: "Images",
                component: {
                    type: ComponentType.FileUpload,
                    custom_id: "bulk-image-input",
                    required: false,
                    max_values: 10
                }
            },
            {
                type: ComponentType.Label,
                label: "URLs",
                component: {
                    type: ComponentType.TextInput,
                    custom_id: "bulk-url-input",
                    style: TextInputStyle.Paragraph,
                    required: false,
                    placeholder: "One URL per line"
                }
            }
        ]
    });
}

async function defaultCallback(
    api: API,
    interaction: APIChatInputApplicationCommandInteraction,
    options: ApplicationCommandOptions<InteractionType.ApplicationCommand>
): Promise<void> {
    let url: string;
    if (options.subcommand === "image") {
        const image = options.get({
            type: ApplicationCommandOptionType.Attachment,
            name: "image",
            required: true
        });
        url = interaction.data.resolved!.attachments![image.value].url;
    }
    else {
        const urlOption = options.get({
            type: ApplicationCommandOptionType.String,
            name: "url",
            required: true
        });
        url = urlOption.value;
    }
    const show = options.get({
        type: ApplicationCommandOptionType.Boolean,
        name: "show"
    });
    await api.interactions.defer(interaction.id, interaction.token, { flags: show?.value ? undefined : MessageFlags.Ephemeral });
    const results = await ocrFromURLs([url]);
    const name = results.firstKey()!;
    const data = Buffer.from(results.get(name)!);
    await api.interactions.editReply(process.env.DISCORD_CLIENT_ID!, interaction.token, {
        files: [{ name, data }]
    });
}

export async function callback({ api, data: interaction }: ToEventProps<APIChatInputApplicationCommandInteraction>): Promise<void> {
    const options = new ApplicationCommandOptions(interaction.data.options);
    switch (options.subcommand) {
        case "bulk-image": return bulkCallback(api, interaction, options);
        default: return defaultCallback(api, interaction, options);
    }
}
