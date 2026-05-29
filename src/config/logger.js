const pino = require('pino');
const rfs = require('rotating-file-stream');
const path = require('path');
const { Transform } = require('stream');

// Determine log directory based on whether running as pkg or normal node
const isPkg = typeof process.pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : path.join(__dirname, '../..');
const logDir = path.join(baseDir, 'log', 'service');

// Generate filename with current date
const filenameGenerator = (time, index) => {
  const date = time ? new Date(time) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const indexStr = index ? `.${index}` : '';
  return `service-${year}-${month}-${day}${indexStr}.log`;
};

// Create rotating file stream
const fileStream = rfs.createStream(filenameGenerator, {
  size: '10M',
  interval: '1d',
  path: logDir,
  compress: 'gzip',
  maxFiles: 30
});

// Create formatter for standard log format
const createLogFormatter = (destination) => {
  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        const log = JSON.parse(chunk.toString());
        const time = new Date(log.time).toLocaleString('zh-CN', { hour12: false });
        const level = log.level.toUpperCase();
        const msg = log.msg;
        let output = `[${time}] ${level}: ${msg}`;
        
        // Add extra fields if present
        if (log.err) {
          output += `\n${log.err.stack || log.err}`;
        }
        if (log.req) {
          output += ` ${JSON.stringify(log.req)}`;
        }
        
        destination.write(output + '\n');
        callback();
      } catch (e) {
        callback();
      }
    }
  });
};

// Create base logger options
const loggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  }
};

// Add file transport with formatter
const fileFormatter = createLogFormatter(fileStream);

const streams = [
  {
    level: 'info',
    stream: fileFormatter
  }
];

// Add console transport in development or when not in pkg
if (process.env.NODE_ENV !== 'production' || !isPkg) {
  const consoleFormatter = createLogFormatter(process.stdout);
  streams.push({
    level: 'info',
    stream: consoleFormatter
  });
}

// Create logger
const logger = pino(loggerOptions, pino.multistream(streams));

module.exports = logger;
