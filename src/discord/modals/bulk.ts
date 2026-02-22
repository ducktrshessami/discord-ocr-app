import { APIModalSubmitInteraction, ComponentType, MessageFlags, ToEventProps } from "@discordjs/core";
import { RawFile } from "@discordjs/rest";
import { ModalSubmitFields } from "discord-data-resolvers";
import { createDefaultModalSubmitTest } from "../utils/interactions.js";
import { ocrFromURLs } from "../utils/ocr.js";

const ModalCustomIDPattern = /^bulk-image\|(?<show>\d+)$/;
export const test = createDefaultModalSubmitTest({ pattern: ModalCustomIDPattern });

export async function callback({ api, data: interaction }: ToEventProps<APIModalSubmitInteraction>): Promise<void> {
    const match = interaction.data.custom_id.match(ModalCustomIDPattern);
    const ephemeral = !parseInt(match!.groups!.show);
    await api.interactions.defer(interaction.id, interaction.token, { flags: ephemeral ? MessageFlags.Ephemeral : undefined });
    const fields = new ModalSubmitFields(interaction.data.components);
    const inputFiles = fields.get({
        type: ComponentType.FileUpload,
        customId: "bulk-image-input"
    });
    const inputUrls = fields.get({
        type: ComponentType.TextInput,
        customId: "bulk-url-input"
    });
    const imageUrls: string[] = [];
    if (inputFiles) {
        for (const attachmentId of inputFiles.values) {
            imageUrls.push(interaction.data.resolved!.attachments![attachmentId].url);
        }
    }
    inputUrls?.value
        .split("\n")
        .forEach(url => imageUrls.push(url.trim()));
    const results = await ocrFromURLs(imageUrls);
    const outputFiles: RawFile[] = results.map((text, name) => ({
        name,
        data: Buffer.from(text)
    }));
    await api.interactions.editReply(interaction.application_id, interaction.token, { files: outputFiles.slice(0, 10) });
    if (outputFiles.length > 10) {
        for (let i = 10; i < outputFiles.length; i += 10) {
            await api.interactions.followUp(interaction.application_id, interaction.token, {
                flags: ephemeral ? MessageFlags.Ephemeral : undefined,
                files: outputFiles.slice(i, i + 10)
            });
        }
    }
}
