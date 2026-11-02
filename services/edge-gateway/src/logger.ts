import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

type LogLevel = 'info' | 'warn' | 'error';

export class Logger {
  constructor(private readonly filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('error', message, context);
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? { context } : {}),
    });

    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.info(line);
    }

    appendFileSync(this.filePath, `${line}\n`, 'utf8');
  }
}
