const winston = require("winston");
const {format} = require("winston");
const { combine, timestamp, printf } = format;

const simpleFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ],
    format: combine(
        timestamp(),
        simpleFormat
    )
});
module.exports = logger;
