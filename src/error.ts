import { STATUS_CODES } from "http";

class CustomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class CommandOptionResolutionError extends CustomError { }
export class HTTPError extends CustomError {
    constructor(statusCode: number) {
        super(`${statusCode} ${STATUS_CODES[statusCode]}`);
    }
}
export class OCRError extends CustomError {
    constructor(message: string) {
        const slicedMessage = message.match(/^\w*error:\s*(.+)/i);
        if (slicedMessage) {
            message = slicedMessage[1];
        }
        super(message);
    }
}
