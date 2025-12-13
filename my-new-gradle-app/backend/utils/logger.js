const winston = require('winston');

// Define log levels and colors (optional, for console readability)
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'white',
};

winston.addColors(colors);

// Define the format for log messages
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }), // Colorize the whole message, including timestamp and level
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}` +
                  `${info.stack ? `\n${info.stack}` : ''}` // Include stack trace for errors
    )
);

// Define the transports (where logs go)
const transports = [
    new winston.transports.Console({
        level: 'debug', // Log 'debug' and above to console in development
    }),
    // In a real production environment, you might add:
    // new winston.transports.File({
    //     filename: 'logs/error.log',
    //     level: 'error', // Log only errors to error.log
    // }),
    // new winston.transports.File({
    //     filename: 'logs/combined.log',
    //     level: 'warn', // Log warnings and errors to combined.log
    // }),
    // Or use a transport for a cloud logging service (e.g., Google Cloud Logging, AWS CloudWatch)
];

// Create the logger instance
const logger = winston.createLogger({
    levels: levels,
    format: format,
    transports: transports,
});

module.exports = logger;
