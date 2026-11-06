/**
 * Lifecycle of an async data source. Drives the four UI states enforced across
 * every view: loading, error, empty (a success carrying no data) and success.
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  readonly status: AsyncStatus;
  readonly data: T | null;
  readonly error: string | null;
}

/** Initial state before any request has been made. */
export const idleState = <T>(): AsyncState<T> => ({ status: 'idle', data: null, error: null });

/** In-flight state. Pass existing `data` to keep showing it while refreshing. */
export const loadingState = <T>(data: T | null = null): AsyncState<T> => ({
  status: 'loading',
  data,
  error: null,
});

/** Resolved state carrying the loaded data. */
export const successState = <T>(data: T): AsyncState<T> => ({
  status: 'success',
  data,
  error: null,
});

/** Failed state carrying a user-friendly message. */
export const errorState = <T>(error: string): AsyncState<T> => ({
  status: 'error',
  data: null,
  error,
});
