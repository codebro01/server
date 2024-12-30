import { CustomError } from "./customApiError.js";
import { StatusCodes } from "http-status-codes";

export class NotFoundError extends CustomError {
    constructor(message) {
        super(message)
        this.statusCode = StatusCodes.NOT_FOUND;
    }
}