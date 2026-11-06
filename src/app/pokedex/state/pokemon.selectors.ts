import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { AsyncState, successState } from '../../common/models/async-state.model';
import { Pokemon, PokemonSort, SortKey } from '../models/pokemon.model';
import { PokemonStore } from './pokemon.store';

/** Resolve the comparable value for a given sort column. */
function sortValue(pokemon: Pokemon, key: SortKey): string | number {
  switch (key) {
    case 'name':
      return pokemon.name;
    case 'id':
      return pokemon.id;
    case 'total':
      return pokemon.total;
    default:
      return pokemon.stats[key];
  }
}

/** Return a new array sorted by the given instruction (pure; never mutates). */
function sortPokemon(list: Pokemon[], sort: PokemonSort): Pokemon[] {
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const left = sortValue(a, sort.key);
    const right = sortValue(b, sort.key);
    if (typeof left === 'string' && typeof right === 'string') {
      return left.localeCompare(right) * factor;
    }
    return ((left as number) - (right as number)) * factor;
  });
}

/**
 * Derived, read-only views over {@link PokemonStore}: the type-filter options,
 * the filtered → sorted → paged list, the filtered count for pagination, and a
 * combined {@link AsyncState} that drives the table's four UI states. Every
 * multi-subscriber stream is shared with `shareReplay(1)`.
 */
@Injectable({ providedIn: 'root' })
export class PokemonSelectors {
  private readonly store = inject(PokemonStore);

  /** Successfully loaded Pokémon (empty until the first load resolves). */
  private readonly entities$: Observable<Pokemon[]> = this.store.pokemonState$.pipe(
    map((state) => state.data ?? []),
    distinctUntilChanged(),
    shareReplay(1),
  );

  /** Distinct, sorted type names for the filter dropdown. */
  readonly availableTypes$: Observable<string[]> = this.entities$.pipe(
    map((list) => [...new Set(list.flatMap((pokemon) => pokemon.types))].sort()),
    shareReplay(1),
  );

  /** Entities narrowed by the debounced search term and the active type filter. */
  private readonly filtered$: Observable<Pokemon[]> = combineLatest([
    this.entities$,
    this.store.debouncedSearch$,
    this.store.typeFilter$,
  ]).pipe(
    map(([list, search, type]) =>
      list.filter(
        (pokemon) =>
          (!search || pokemon.name.includes(search)) && (!type || pokemon.types.includes(type)),
      ),
    ),
    shareReplay(1),
  );

  /** Filtered list with the active sort applied. */
  private readonly sorted$: Observable<Pokemon[]> = combineLatest([
    this.filtered$,
    this.store.sort$,
  ]).pipe(
    map(([list, sort]) => (sort ? sortPokemon(list, sort) : list)),
    shareReplay(1),
  );

  /** Number of rows after filtering — the denominator for pagination. */
  readonly filteredCount$: Observable<number> = this.sorted$.pipe(
    map((list) => list.length),
    distinctUntilChanged(),
    shareReplay(1),
  );

  /** The current page slice of the sorted list. */
  private readonly pagedPokemon$: Observable<Pokemon[]> = combineLatest([
    this.sorted$,
    this.store.page$,
    this.store.pageSize$,
  ]).pipe(
    map(([list, page, size]) => list.slice((page - 1) * size, (page - 1) * size + size)),
    shareReplay(1),
  );

  /**
   * Async state for the table: passes through loading/error from the underlying
   * load, and on success carries the current page slice (an empty slice renders
   * the empty state).
   */
  readonly tableState$: Observable<AsyncState<Pokemon[]>> = combineLatest([
    this.store.pokemonState$,
    this.pagedPokemon$,
  ]).pipe(
    map(([loadState, paged]) => (loadState.status === 'success' ? successState(paged) : loadState)),
    shareReplay(1),
  );
}
