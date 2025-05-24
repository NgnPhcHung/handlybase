import rateLimit from "express-rate-limit";
import { HttpStatus } from "./statusCode";

export enum RateTime {
  "15_MIN" = 15 * 60 * 1000,
  "1_MIN" = 60 * 1000,
  "30_MIN" = 30 * 60 * 1000,
}

interface RateLimit {
  rateTime?: RateTime;
  message?: string;
  maxRequest?: number;
  statusCode?: (typeof HttpStatus)[keyof typeof HttpStatus];
}

/**
 * @param rateTime - {RateTime} If not given default is 1 minute
 * example
 * `numbers_of_mins * 60 * 1000`
 * @param message  - Default is "Too many requests, please try again later."
 * @param maxRequest - How many requests to allow per {rateTime} per IP
 * @param statusCode - The HTTP status code to send back when a client is rate limited.
 */
export const limiter = ({
  rateTime,
  message,
  maxRequest,
  statusCode,
}: RateLimit = {}) =>
  rateLimit({
    windowMs: rateTime ?? RateTime["1_MIN"],
    max: maxRequest,
    message: message ?? "Too many requests, please try again later.",
    statusCode: statusCode || HttpStatus.TOO_MANY_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
  });
