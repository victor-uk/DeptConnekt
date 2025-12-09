import timeout from 'connect-timeout';
import { StatusCodes } from 'http-status-codes';

const TIMEOUT_DURATION = '30s'; // 30 seconds

/**
 * Middleware to halt requests that take too long.
 */
export const haltOnTimedout = (req, res, next) => {
    if (!req.timedout) {
        next();
    } else {
        res.status(StatusCodes.REQUEST_TIMEOUT).json({
            success: false,
            message: `Request timed out after ${TIMEOUT_DURATION}. Please try again.`
        });
    }
};

export const timeoutMiddleware = timeout(TIMEOUT_DURATION);