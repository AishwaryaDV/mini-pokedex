import { Injectable, isDevMode } from '@angular/core';

/**
 * Thin logging facade used by services. Centralizing logging keeps a single
 * place to later swap the console for a remote sink, and silences info/warn
 * noise in production builds.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  /** Log an informational message (dev only). */
  info(message: string, context?: unknown): void {
    if (isDevMode()) {
      console.info(`[info] ${message}`, context ?? '');
    }
  }

  /** Log a warning (dev only). */
  warn(message: string, context?: unknown): void {
    if (isDevMode()) {
      console.warn(`[warn] ${message}`, context ?? '');
    }
  }

  /** Log an error. Always emitted so failures remain visible in production. */
  error(message: string, context?: unknown): void {
    console.error(`[error] ${message}`, context ?? '');
  }
}
