import { StatusCodes } from 'http-status-codes';

export const customErrorHandler = (err, req, res, next) => {
    // Check if headers are already sent
    if (res.headersSent) {
        console.error("Headers already sent. Skipping error handling.");
        return next(err); // Pass to default error handler
    }

    // Initialize error response object
    const errObj = {
        message: err.message || `An error occurred, please try again later`,
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    };

    // Handle MongoDB duplicate key error
    if (err.code && err.code === 11000) {
        errObj.message = `${Object.values(err.keyValue)} already exists. Please select another ${Object.keys(err.keyValue)}.`;  
        errObj.statusCode = StatusCodes.BAD_REQUEST;
    }

    // Handle timeout error
    if (err.code === 'ETIMEOUT') {
        errObj.message = `Server error, please try again.`;
        errObj.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }

    // Handle Mongoose CastError
    if (err.name === 'CastError') {
        errObj.message = `Invalid value for field "${err.path}": ${err.value}. No item found.`;
        errObj.statusCode = StatusCodes.NOT_FOUND;
    }

    // Log the error for debugging
    console.error("Error encountered:", err);

    // Send the error response
    return res.status(errObj.statusCode).json({ message: errObj.message });
};
