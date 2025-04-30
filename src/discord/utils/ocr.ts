import { Collection } from "@discordjs/collection";
import { basename } from "path";
import { createWorker } from "tesseract.js";
import { fileURLToPath } from "url";
import { OCRError } from "../../error.js";
import { request } from "./http.js";

const TrainedDataPath = fileURLToPath(new URL("../../../tesseract", import.meta.url));
const Languages = [
    "eng",
    "chi_sim",
    "jpn",
    "kor"
];

function errorHandler(err: unknown): void {
    console.error(new OCRError(`${err}`));
}

async function ocr(jobs: Collection<string, Buffer>): Promise<Collection<string, string>> {
    const worker = await createWorker(Languages, undefined, {
        errorHandler,
        cachePath: TrainedDataPath
    });
    const results = new Collection<string, string>();
    for (const [name, file] of jobs) {
        const { data } = await worker.recognize(file);
        results.set(name, data.text);
    }
    await worker.terminate();
    return results;
}

function textFilenameFromURL(url: string, basenames: Collection<string, number>): string {
    const parsedUrl = new URL(url);
    const base = basename(parsedUrl.pathname);
    const i = basenames.get(base) ?? 0;
    basenames.set(base, i + 1);
    return `${i}_${base}.txt`;
}

export async function ocrFromURLs(urls: string[]): Promise<Collection<string, string>> {
    const jobs = new Collection<string, Buffer>();
    const basenames = new Collection<string, number>();
    await Promise.all(urls.map(async url => {
        const res = await request(url);
        const data = await res.body.arrayBuffer();
        const buffer = Buffer.from(data);
        const name = textFilenameFromURL(url, basenames);
        jobs.set(name, buffer);
    }));
    return await ocr(jobs);
}
