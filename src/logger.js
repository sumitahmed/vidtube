import { createLogger, format, transports } from "winston";
const { combine, timestamp, json, colorize, printf } = format;

// Custom format for console logs with colors
const consoleLogFormat = format.combine(
    format.colorize(),
    format.printf(({ level, message }) => {
        return `${level}: ${message}`;
    })
);

// Create the Winston logger
const logger = createLogger({
    level: 'info', // Log only messages of level 'info' and above (info, warn, error)
    format: combine(
        timestamp(), // Add a timestamp to each log
        json()       // Log in JSON format
    ),
    transports: [
        // Transport 1: Log to the console
        new transports.Console({
            format: consoleLogFormat,
        }),
        // Transport 2: Log to a file
        new transports.File({ filename: 'app.log' }) // All logs will be saved in app.log
    ],
});

export default logger;