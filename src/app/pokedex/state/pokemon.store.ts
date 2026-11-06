import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { PAGE_SIZE_OPTIONS, POKEDEX_LIMIT, SEARCH_DEBOUNCE_MS } from '../../common/constants';
import {
  AsyncState,
  errorState,
  loadingState,
  successState,
} from '../../common/models/async-state.model';
import { Pokemon, PokemonSort } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';

/**
 * Caches the fetched Pokédex and holds all list UI criteria (search, type
 * filter, sort, pagination) as BehaviorSubjects. Derived views live in
 * {@link PokemonSelectors}. The store never subscribes itself — consumers read
 * the exposed streams via the async pipe / toSignal, so there are no leaks.
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly api = inject(PokemonApiService);

  /** Fires an initial load and every retry. */
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  // Core state holders.
  private readonly searchSubject = new BehaviorSubject<string>('');
  private readonly typeFilterSubject = new BehaviorSubject<string | null>(null);
  private readonly sortSubject = new BehaviorSubject<PokemonSort | null>(null);
  private readonly pageSubject = new BehaviorSubject<number>(1);
  private readonly pageSizeSubject = new BehaviorSubject<number>(PAGE_SIZE_OPTIONS[0]);

  /**
   * Async state of the cached Pokémon list. A new load switches away from any
   * in-flight request, emits `loading` immediately, then `success`/`error`.
   */
  readonly pokemonState$: Observable<AsyncState<Pokemon[]>> = this.reload$.pipe(
    switchMap(() =>
      this.api.getPokemon(POKEDEX_LIMIT).pipe(
        map((list) => successState(list)),
        startWith(loadingState<Pokemon[]>()),
        catchError((error: Error) => of(errorState<Pokemon[]>(error.message))),
      ),
    ),
    shareReplay(1),
  );

  /** Normalized, debounced search term driving the filtered view. */
  readonly debouncedSearch$: Observable<string> = this.searchSubject.pipe(
    debounceTime(SEARCH_DEBOUNCE_MS),
    distinctUntilChanged(),
    // switchMap keeps only the latest term's result; ready to become an async
    // API search without changing the consumers of this stream.
    switchMap((term) => of(term.trim().toLowerCase())),
    startWith(''),
    shareReplay(1),
  );

  readonly typeFilter$ = this.typeFilterSubject.asObservable();
  readonly sort$ = this.sortSubject.asObservable();
  readonly page$ = this.pageSubject.asObservable();
  readonly pageSize$ = this.pageSizeSubject.asObservable();

  /** Raw (undebounced) search value, for binding the input's current text. */
  readonly search$ = this.searchSubject.asObservable();

  /** (Re)load the Pokédex from the API. Also used by the error-state Retry. */
  load(): void {
    this.reload$.next();
  }

  /** Update the search term and reset to the first page. */
  setSearch(term: string): void {
    this.searchSubject.next(term);
    this.pageSubject.next(1);
  }

  /** Filter by a Pokémon type (or `null` for all) and reset to the first page. */
  setTypeFilter(type: string | null): void {
    this.typeFilterSubject.next(type);
    this.pageSubject.next(1);
  }

  /** Set the active sort column/direction (or `null` for insertion order). */
  setSort(sort: PokemonSort | null): void {
    this.sortSubject.next(sort);
  }

  /** Navigate to a 1-based page. */
  setPage(page: number): void {
    this.pageSubject.next(page);
  }

  /** Change the page size and reset to the first page. */
  setPageSize(size: number): void {
    this.pageSizeSubject.next(size);
    this.pageSubject.next(1);
  }
}
