const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
    // A) API
    // Error for development
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    //  B) RENDERED WEBSITE
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong.',
        msg: err.message // we are doing this because we are in development.and it doesnt matter leaking the msg
    });

};

const sendErrorProd = (err, req, res) => {
    // A) THE FIRST: RENDERS API errors
    if (req.originalUrl.startsWith('/api')) {
        // Error for productions
        //  A) Operational, trusted error: send message to client. this is for the errors that we know
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        // B) Programming or other unknown error: don't leak error details. this is for the errors we dont know
        // 1) Log error
        console.error('ERROR 💥', err);

        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });

    }
    //  B) THE SECOND: RENDERS WEBSITE error
    //  A) Operational, trusted error: send message to client. this is for the errors that we know
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong.',
            msg: err.message // we are doing this because it doesnt matter leaking the msg. we know the error
        });
    }

    // B) Programming or other unknown error: don't leak error details. this is for the errors we dont know
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong.',
        msg: 'Please try again late.' //for the errors we dont know
    });



};

module.exports = (err, req, res, next) => {
    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = {
            ...err
        };
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};