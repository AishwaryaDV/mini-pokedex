import { Injectable, signal } from '@angular/core';
import { Toast, ToastKind } from '../models/toast.model';

const DEFAULT_DURATION_MS = 3500;

/**
 * Lightweight, signal-based toast queue. Components render {@link toasts};
 * features call {@link success}/{@link error}/{@link info} to notify the user
 * (e.g. after a mutation succeeds or an optimistic update rolls back).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);

  /** Current toasts, oldest first. Consumed by the toast container. */
  readonly toasts = this._toasts.asReadonly();

  /**
   * Show a success toast.
   * @param message Text to display.
   * @param durationMs Auto-dismiss delay; pass 0 to keep until dismissed.
   */
  success(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.show('success', message, durationMs);
  }

  /**
   * Show an error toast.
   * @param message Text to display.
   * @param durationMs Auto-dismiss delay; pass 0 to keep until dismissed.
   */
  error(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.show('error', message, durationMs);
  }

  /**
   * Show an informational toast.
   * @param message Text to display.
   * @param durationMs Auto-dismiss delay; pass 0 to keep until dismissed.
   */
  info(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.show('info', message, durationMs);
  }

  /** Remove a toast by id (also invoked by its auto-dismiss timer). */
  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  private show(kind: ToastKind, message: string, durationMs: number): void {
    const id = ++this.nextId;
    this._toasts.update((list) => [...list, { id, kind, message }]);
    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
