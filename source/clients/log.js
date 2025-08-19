
const util = require('util');
const winston = require('winston')
const LOG_LEVEL = process.env.LOG_LEVEL || "info"

function transform(info, opts) {
  const args = info[Symbol.for('splat')];
  if (args) { info.message = util.format(info.message, ...args); }
  return info;
}

function utilFormatter() { return {transform}; }

module.exports = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
        utilFormatter(),     // <-- this is what changed
        winston.format.colorize(),
        winston.format.printf(({level, message, label, timestamp}) => `${timestamp} ${label || '-'} ${level}: ${message}`),
    ),
    transports: [
      new winston.transports.Stream({
        stream: process.stderr,
        level: LOG_LEVEL,
      })
    ],
  });