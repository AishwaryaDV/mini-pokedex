import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_RETRY_COUNT, API_RETRY_DELAY_MS, POKEAPI_GRAPHQL_URL } from '../../common/constants';
import { GraphqlClientService } from '../../core/graphql/graphql-client.service';
import { Pokemon, PokemonAbility, PokemonStats } from '../models/pokemon.model';

// --- Raw PokéAPI GraphQL response shapes (flattened by the mappers below) ---

interface RawType {
  pokemon_v2_type: { name: string } | null;
}

interface RawStat {
  base_stat: number;
  pokemon_v2_stat: { name: string } | null;
}

interface RawSprite {
  sprites: string | Record<string, unknown> | null;
}

interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemon_v2_pokemontypes: RawType[];
  pokemon_v2_pokemonstats: RawStat[];
  pokemon_v2_pokemonsprites: RawSprite[];
}

interface GetPokemonResponse {
  pokemon_v2_pokemon: RawPokemon[];
}

interface RawAbility {
  is_hidden: boolean;
  pokemon_v2_ability: {
    name: string;
    pokemon_v2_abilityeffecttexts: { short_effect: string | null }[];
  } | null;
}

interface GetAbilitiesResponse {
  pokemon_v2_pokemonability: RawAbility[];
}

const GET_POKEMON = `
  query GetPokemon($limit: Int, $offset: Int) {
    pokemon_v2_pokemon(limit: $limit, offset: $offset) {
      id
      name
      height
      weight
      pokemon_v2_pokemontypes { pokemon_v2_type { name } }
      pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
      pokemon_v2_pokemonsprites { sprites }
    }
  }
`;

const GET_ABILITIES = `
  query GetAbilities($pokemonId: Int) {
    pokemon_v2_pokemonability(where: { pokemon_id: { _eq: $pokemonId } }) {
      is_hidden
      pokemon_v2_ability {
        name
        pokemon_v2_abilityeffecttexts(where: { language_id: { _eq: 9 } }) {
          short_effect
        }
      }
    }
  }
`;

/** Narrow an unknown value to a plain object for safe property access. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Reads Pokémon data from the public PokéAPI GraphQL endpoint and maps the
 * deeply-nested response into the flat {@link Pokemon} model the UI consumes.
 * All reads retry with a delay, as PokéAPI occasionally returns transient 5xx.
 */
@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly graphql = inject(GraphqlClientService);
  private readonly retryOptions = {
    retryCount: API_RETRY_COUNT,
    retryDelayMs: API_RETRY_DELAY_MS,
  };

  /**
   * Fetch a page of Pokémon with their types, base stats and sprite.
   * @param limit Maximum number of Pokémon to return.
   * @param offset Number of Pokémon to skip (for pagination).
   */
  getPokemon(limit: number, offset = 0): Observable<Pokemon[]> {
    return this.graphql
      .request<GetPokemonResponse>(
        POKEAPI_GRAPHQL_URL,
        GET_POKEMON,
        { limit, offset },
        this.retryOptions,
      )
      .pipe(map((response) => response.pokemon_v2_pokemon.map((raw) => this.toPokemon(raw))));
  }

  /**
   * Fetch the abilities (with English effect text) for a single Pokémon.
   * @param pokemonId The Pokémon's national dex id.
   */
  getAbilities(pokemonId: number): Observable<PokemonAbility[]> {
    return this.graphql
      .request<GetAbilitiesResponse>(
        POKEAPI_GRAPHQL_URL,
        GET_ABILITIES,
        { pokemonId },
        this.retryOptions,
      )
      .pipe(
        map((response) => response.pokemon_v2_pokemonability.map((raw) => this.toAbility(raw))),
      );
  }

  private toPokemon(raw: RawPokemon): Pokemon {
    const stats = this.toStats(raw.pokemon_v2_pokemonstats);
    const types = raw.pokemon_v2_pokemontypes
      .map((entry) => entry.pokemon_v2_type?.name)
      .filter((name): name is string => !!name);

    return {
      id: raw.id,
      name: raw.name,
      height: raw.height,
      weight: raw.weight,
      types,
      sprite: this.toSprite(raw.pokemon_v2_pokemonsprites),
      stats,
      total:
        stats.hp +
        stats.attack +
        stats.defense +
        stats.specialAttack +
        stats.specialDefense +
        stats.speed,
    };
  }

  private toStats(raw: RawStat[]): PokemonStats {
    const byName: Record<string, number> = {};
    for (const entry of raw) {
      if (entry.pokemon_v2_stat?.name) {
        byName[entry.pokemon_v2_stat.name] = entry.base_stat;
      }
    }
    return {
      hp: byName['hp'] ?? 0,
      attack: byName['attack'] ?? 0,
      defense: byName['defense'] ?? 0,
      specialAttack: byName['special-attack'] ?? 0,
      specialDefense: byName['special-defense'] ?? 0,
      speed: byName['speed'] ?? 0,
    };
  }

  /** The `sprites` field arrives as a JSON scalar (string or object); read a usable URL from it. */
  private toSprite(raw: RawSprite[]): string | null {
    const field = raw[0]?.sprites;
    if (field == null) {
      return null;
    }
    let parsed: unknown = field;
    if (typeof field === 'string') {
      try {
        parsed = JSON.parse(field);
      } catch {
        return null;
      }
    }
    if (!isRecord(parsed)) {
      return null;
    }
    const front = parsed['front_default'];
    if (typeof front === 'string' && front) {
      return front;
    }
    const other = parsed['other'];
    if (isRecord(other)) {
      const artwork = other['official-artwork'];
      if (isRecord(artwork) && typeof artwork['front_default'] === 'string') {
        return artwork['front_default'];
      }
    }
    return null;
  }

  private toAbility(raw: RawAbility): PokemonAbility {
    return {
      name: raw.pokemon_v2_ability?.name ?? 'unknown',
      isHidden: raw.is_hidden,
      shortEffect: raw.pokemon_v2_ability?.pokemon_v2_abilityeffecttexts?.[0]?.short_effect ?? null,
    };
  }
}
