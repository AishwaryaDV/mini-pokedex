import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, retry, throwError, timer } from 'rxjs';
import { API_RETRY_DELAY_MS } from '../../common/constants';
import { LoggerService } from '../logger.service';

/** Shape of a GraphQL HTTP response envelope. */
interface GraphqlResponse<T> {
  data?: T | null;
  errors?: { message: string }[];
}

/** Per-request tuning for {@link GraphqlClientService.request}. */
export interface GraphqlRequestOptions {
  /** Number of automatic retries on transient failure. Default 0 (no retry). */
  readonly retryCount?: number;
  /** Base delay between retries, in milliseconds. Grows linearly per attempt. */
  readonly retryDelayMs?: number;
}

/**
 * Transport-agnostic GraphQL client over HttpClient. Feature services call it
 * with their own endpoint, query and variables. Handles response-envelope
 * errors, optional retry-with-backoff, and maps every failure to a
 * user-friendly {@link Error} so stores can surface it to the UI.
 */
@Injectable({ providedIn: 'root' })
export class GraphqlClientService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  /**
   * Execute a GraphQL operation and return its typed `data` payload.
   *
   * @param endpoint Absolute GraphQL endpoint URL.
   * @param query GraphQL query or mutation document.
   * @param variables Operation variables.
   * @param options Retry tuning (retries are disabled by default; enable only
   *   for idempotent reads to avoid duplicating mutations).
   * @returns Observable emitting the `data` object, or erroring with a
   *   user-friendly message.
   */
  request<T>(
    endpoint: string,
    query: string,
    variables: Record<string, unknown> = {},
    options: GraphqlRequestOptions = {},
  ): Observable<T> {
    const { retryCount = 0, retryDelayMs = API_RETRY_DELAY_MS } = options;

    return this.http.post<GraphqlResponse<T>>(endpoint, { query, variables }).pipe(
      map((response) => this.extractData(response)),
      retry({
        count: retryCount,
        delay: (_error, attempt) => timer(retryDelayMs * attempt),
      }),
      catchError((error: unknown) => {
        this.logger.error('GraphQL request failed', { endpoint, error });
        return throwError(() => this.toFriendlyError(error));
      }),
    );
  }

  /** Unwrap `data`, converting GraphQL/empty-payload errors into thrown errors. */
  private extractData<T>(response: GraphqlResponse<T>): T {
    if (response.errors?.length) {
      throw new Error(response.errors[0].message);
    }
    if (response.data == null) {
      throw new Error('The server returned no data.');
    }
    return response.data;
  }

  /** Translate transport/GraphQL errors into a concise message for the user. */
  private toFriendlyError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new Error('Network error. Check your connection and try again.');
      }
      return new Error(`Request failed (${error.status}). Please try again.`);
    }
    if (error instanceof Error) {
      return error;
    }
    return new Error('Something went wrong. Please try again.');
  }
}
