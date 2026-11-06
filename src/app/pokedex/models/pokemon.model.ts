/** The six base stats, normalized to friendly camelCase keys. */
export interface PokemonStats {
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly specialAttack: number;
  readonly specialDefense: number;
  readonly speed: number;
}

/** A Pokémon in the shape the UI consumes (flattened from the PokéAPI graph). */
export interface Pokemon {
  readonly id: number;
  readonly name: string;
  readonly height: number;
  readonly weight: number;
  readonly types: string[];
  readonly sprite: string | null;
  readonly stats: PokemonStats;
  /** Sum of the six base stats, precomputed for sorting. */
  readonly total: number;
}

/** A single ability with its in-game effect text. */
export interface PokemonAbility {
  readonly name: string;
  readonly isHidden: boolean;
  readonly shortEffect: string | null;
}

/** Keys of {@link PokemonStats}, handy for building sortable stat columns. */
export type StatKey = keyof PokemonStats;

/** Every column the table can sort by. */
export type SortKey = StatKey | 'id' | 'name' | 'total';

export type SortDirection = 'asc' | 'desc';

/** A sort instruction: which column and in which direction. */
export interface PokemonSort {
  readonly key: SortKey;
  readonly direction: SortDirection;
}
