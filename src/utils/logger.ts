import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Clean up any existing .log files
fs.readdirSync(logsDir).forEach(file => {
    if (file.endsWith('.log')) {
        fs.unlinkSync(path.join(logsDir, file));
    }
});

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Format for file logging
const fileFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} ${message}`;

    // Add metadata if it exists
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
});

const fileFormatCombined = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    fileFormat
);

const transports = [
    // Error log file
    new winston.transports.File({
        filename: path.join(logsDir, 'error_logs.log'),
        level: 'error',
        format: fileFormatCombined
    }),
    // All logs file (excluding errors)
    new winston.transports.File({
        filename: path.join(logsDir, 'server_logs.log'),
        level: 'info', // This will include warn, info, http, and debug, but exclude error
        format: fileFormatCombined
    })
];

export const logger = winston.createLogger({
    level: 'debug',
    levels,
    transports,
});

// Stream object for Morgan integration
export const stream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};