import winston, { format } from 'winston';

//* Uppercasing must be done before colorizing - https://github.com/winstonjs/winston/issues/1345
const upperCaseLogLevel = format((info) => {
    info.level = info.level?.toUpperCase();
    return info;
});

winston.configure({
    level: 'info',
    format: format.combine(format.timestamp(), format.errors({ stack: true })),
    transports: [
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxFiles: 10,
            maxsize: 10_000_000, // 10MB
            format: format.prettyPrint(),
        }),
        new winston.transports.Console({
            format: format.combine(
                upperCaseLogLevel(),
                format.colorize(),
                format.align(),
                format.printf((info) => {
                    const message = `[${info.level}] ${info.message}`;

                    return info.stack
                        ? `${message}\n\t${(info.stack as string).replaceAll('\n', '\n\t')}`
                        : message;
                })
            ),
        }),
    ],
});
