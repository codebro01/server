import { CustomError } from "./customApiError.js";
import { StatusCodes } from "http-status-codes";

export class NotAuthenticatedError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.UNAUTHORIZED;
    }
}