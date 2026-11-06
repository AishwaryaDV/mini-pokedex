/** App-wide constants shared across features. */

/** Public PokéAPI GraphQL endpoint (queries only, no auth). */
export const POKEAPI_GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';

/** Local json-graphql-server endpoint (queries + mutations). */
export const MOCK_GRAPHQL_URL = 'http://localhost:4000/';

/** Debounce applied to all text-search inputs, in milliseconds. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Page-size options offered by the Pokédex table. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/** Number of Pokémon loaded into the cached store (covers all seed teams). */
export const POKEDEX_LIMIT = 251;

/** Team size constraints enforced by the team builder. */
export const TEAM_MIN_SIZE = 1;
export const TEAM_MAX_SIZE = 6;

/** Trainer that owns teams created in-app (the mock has no trainer switcher). */
export const DEFAULT_TRAINER_ID = 1;

/** Team name length bounds. */
export const TEAM_NAME_MIN_LENGTH = 3;
export const TEAM_NAME_MAX_LENGTH = 30;

/** Resilience settings for PokéAPI calls. */
export const API_RETRY_COUNT = 2;
export const API_RETRY_DELAY_MS = 800;

/** Canonical colour per Pokémon type, used by the type badge. */
export const POKEMON_TYPE_COLORS: Record<string, string> = {
  normal: '#9099a1',
  fire: '#ff9d55',
  water: '#4d90d5',
  electric: '#f4d23c',
  grass: '#63bc5a',
  ice: '#73cec0',
  fighting: '#ce4069',
  poison: '#ab6ac8',
  ground: '#d97845',
  flying: '#8fa8dd',
  psychic: '#fa7179',
  bug: '#90c12c',
  rock: '#c7b78b',
  ghost: '#5269ad',
  dragon: '#0b6dc3',
  dark: '#5a5366',
  steel: '#5a8ea1',
  fairy: '#ec8fe6',
};
