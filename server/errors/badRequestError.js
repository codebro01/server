import { CustomError } from "./customApiError.js";
import { StatusCodes } from "http-status-codes";

export class BadRequestError extends CustomError {
    constructor(message) {
        super(message)
        this.statusCode = StatusCodes.BAD_REQUEST
    }
}