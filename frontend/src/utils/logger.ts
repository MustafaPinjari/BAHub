/**
 * Logger utility for frontend application
 * Replaces console.log/error/warn with structured logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private format(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  private output(entry: LogEntry) {
    if (!this.isDevelopment) return;

    const { level, message, context, timestamp } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'info':
        console.info(prefix, message, context || '');
        break;
      case 'warn':
        console.warn(prefix, message, context || '');
        break;
      case 'error':
        console.error(prefix, message, context || '');
        break;
      case 'debug':
        console.debug(prefix, message, context || '');
        break;
    }
  }

  info(message: string, context?: any) {
    this.output(this.format('info', message, context));
  }

  warn(message: string, context?: any) {
    this.output(this.format('warn', message, context));
  }

  error(message: string, context?: any) {
    this.output(this.format('error', message, context));
  }

  debug(message: string, context?: any) {
    this.output(this.format('debug', message, context));
  }
}

export const logger = new Logger();
