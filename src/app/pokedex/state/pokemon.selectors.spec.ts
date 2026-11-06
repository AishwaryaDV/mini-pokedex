import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { Pokemon, PokemonStats } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { PokemonSelectors } from './pokemon.selectors';
import { PokemonStore } from './pokemon.store';

function stats(
  hp: number,
  attack: number,
  defense: number,
  specialAttack: number,
  specialDefense: number,
  speed: number,
): PokemonStats {
  return { hp, attack, defense, specialAttack, specialDefense, speed };
}

function makePokemon(id: number, name: string, types: string[], base: PokemonStats): Pokemon {
  const total =
    base.hp + base.attack + base.defense + base.specialAttack + base.specialDefense + base.speed;
  return { id, name, height: 1, weight: 1, types, sprite: null, stats: base, total };
}

// Totals: alpha 300, bravo 400, charlie 200, delta 350.
const ALPHA = makePokemon(1, 'alpha', ['grass'], stats(50, 50, 50, 50, 50, 50));
const BRAVO = makePokemon(2, 'bravo', ['fire'], stats(100, 100, 50, 50, 50, 50));
const CHARLIE = makePokemon(3, 'charlie', ['water'], stats(30, 30, 30, 30, 30, 50));
const DELTA = makePokemon(4, 'delta', ['fire'], stats(60, 60, 60, 60, 60, 50));
const LIST = [ALPHA, BRAVO, CHARLIE, DELTA];

/** Read the current value of a (replayed) observable synchronously. */
function latest<T>(source: Observable<T>): T {
  let value!: T;
  source.subscribe((next) => (value = next)).unsubscribe();
  return value;
}

describe('PokemonSelectors', () => {
  let store: PokemonStore;
  let selectors: PokemonSelectors;

  beforeEach(() => {
    const api = { getPokemon: vi.fn().mockReturnValue(of(LIST)), getAbilities: vi.fn() };
    TestBed.configureTestingModule({
      providers: [PokemonStore, PokemonSelectors, { provide: PokemonApiService, useValue: api }],
    });
    store = TestBed.inject(PokemonStore);
    selectors = TestBed.inject(PokemonSelectors);
    store.load();
  });

  it('exposes the loaded Pokémon as a successful table state', () => {
    const state = latest(selectors.tableState$);
    expect(state.status).toBe('success');
    expect(state.data).toHaveLength(4);
  });

  it('lists the distinct types for the filter dropdown, sorted', () => {
    expect(latest(selectors.availableTypes$)).toEqual(['fire', 'grass', 'water']);
  });

  it('sorts by total descending', () => {
    store.setSort({ key: 'total', direction: 'desc' });
    const ids = latest(selectors.tableState$).data?.map((p) => p.id);
    expect(ids).toEqual([2, 4, 1, 3]);
  });

  it('filters by type and reports the filtered count', () => {
    store.setTypeFilter('fire');
    expect(latest(selectors.filteredCount$)).toBe(2);
    const ids = latest(selectors.tableState$).data?.map((p) => p.id);
    expect(ids).toEqual([2, 4]);
  });

  it('paginates using the chosen page size', () => {
    store.setPageSize(2);
    expect(latest(selectors.tableState$).data?.map((p) => p.id)).toEqual([1, 2]);

    store.setPage(2);
    expect(latest(selectors.tableState$).data?.map((p) => p.id)).toEqual([3, 4]);
  });
});
