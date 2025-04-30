import {
    APIMessageApplicationCommandInteraction,
    ApplicationCommandType,
    ApplicationIntegrationType,
    InteractionContextType,
    MessageFlags,
    RESTPostAPIApplicationCommandsJSONBody,
    ToEventProps
} from "@discordjs/core";
import { RawFile } from "@discordjs/rest";
import { ocrFromURLs } from "../utils/ocr.js";

export const data: RESTPostAPIApplicationCommandsJSONBody = {
    type: ApplicationCommandType.Message,
    name: "Recognize text",
    integration_types: [
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall
    ],
    contexts: [
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel
    ]
};

export async function callback({ api, data: interaction }: ToEventProps<APIMessageApplicationCommandInteraction>): Promise<void> {
    await api.interactions.defer(interaction.id, interaction.token, { flags: MessageFlags.Ephemeral });
    const urls: string[] = [];
    for (const attachment of interaction.data.resolved.messages[interaction.data.target_id].attachments) {
        if (attachment.content_type?.startsWith("image")) {
            urls.push(attachment.url);
        }
    }
    for (const embed of interaction.data.resolved.messages[interaction.data.target_id].embeds) {
        if (embed.image) {
            urls.push(embed.image.url);
        }
        if (embed.thumbnail) {
            urls.push(embed.thumbnail.url);
        }
    }
    if (!urls.length) {
        await api.interactions.editReply(process.env.DISCORD_CLIENT_ID!, interaction.token, { content: "No images detected" });
        return;
    }
    const results = await ocrFromURLs(urls);
    const outputFiles: RawFile[] = results.map((text, name) => ({
        name,
        data: Buffer.from(text)
    }));
    await api.interactions.editReply(process.env.DISCORD_CLIENT_ID!, interaction.token, { files: outputFiles });
}
