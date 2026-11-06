import { Injectable } from '@angular/core';

/**
 * Thin, typed wrapper over localStorage with JSON (de)serialization and
 * safe failure (private mode, quota, SSR). Keeps storage access in one place.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly available = this.hasLocalStorage();

  /**
   * Read and parse a value.
   * @param key Storage key.
   * @returns The parsed value, or `null` if absent/unreadable.
   */
  get<T>(key: string): T | null {
    if (!this.available) {
      return null;
    }
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Serialize and store a value. Passing `null`/`undefined` removes the key.
   * @param key Storage key.
   * @param value Value to persist.
   */
  set<T>(key: string, value: T): void {
    if (!this.available) {
      return;
    }
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write failures (quota exceeded, private mode, etc.).
    }
  }

  /** Remove a key. */
  remove(key: string): void {
    if (this.available) {
      localStorage.removeItem(key);
    }
  }

  private hasLocalStorage(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }
}
