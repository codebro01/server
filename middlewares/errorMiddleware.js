import { StatusCodes } from 'http-status-codes';

export const customErrorHandler = (err, req, res, next) => {
    let errObj = {
        message: err.message || `An error occured, please try again later`,
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    }

    if (err.code && err.code === 11000) {
        errObj.message = `${Object.values(err.keyValue)} already Exists, Please select another ${Object.keys(err.keyValue)}`;
        errObj.statusCode = 400
    }

    if(err.code === 'ETIMEOUT') {
        err.message = `Server Error please try again`;
        err.statusCode = 500;
    }

    if (err.name === 'CastError') {
        errObj.message = `Invalid value for field "${err.path}": ${err.value}. No item found.`;
        errObj.statusCode = 404;
    }


    return res.status(errObj.statusCode).json({message: errObj.message})
}