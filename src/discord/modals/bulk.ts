import { APIModalSubmitInteraction, ComponentType, MessageFlags, ToEventProps } from "@discordjs/core";
import { RawFile } from "@discordjs/rest";
import { ModalSubmitFields } from "discord-data-resolvers";
import { createDefaultModalSubmitTest } from "../utils/interactions.js";
import { ocrFromURLs } from "../utils/ocr.js";

const ModalCustomIDPattern = /^bulk-image\|(?<show>\d+)$/;
export const test = createDefaultModalSubmitTest({ pattern: ModalCustomIDPattern });

export async function callback({ api, data: interaction }: ToEventProps<APIModalSubmitInteraction>): Promise<void> {
    const match = interaction.data.custom_id.match(ModalCustomIDPattern);
    await api.interactions.defer(interaction.id, interaction.token, { flags: !parseInt(match!.groups!.show) ? MessageFlags.Ephemeral : undefined });
    const fields = new ModalSubmitFields(interaction.data.components);
    const input = fields.get({
        type: ComponentType.FileUpload,
        customId: "bulk-image-input",
        required: true
    });
    const results = await ocrFromURLs(input.values.map(id => interaction.data.resolved!.attachments![id].url));
    const outputFiles: RawFile[] = results.map((text, name) => ({
        name,
        data: Buffer.from(text)
    }));
    await api.interactions.editReply(process.env.DISCORD_CLIENT_ID!, interaction.token, { files: outputFiles });
}
