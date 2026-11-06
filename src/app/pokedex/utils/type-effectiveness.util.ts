/**
 * Offensive type matchups: for each attacking type, which defending types it is
 * super-effective (×2), not-very-effective (×0.5) or has no effect (×0) against.
 * Based on the modern (Gen 6+) type chart.
 */
interface Matchup {
  readonly superEffective: string[];
  readonly notVeryEffective: string[];
  readonly noEffect: string[];
}

const TYPE_CHART: Record<string, Matchup> = {
  normal: { superEffective: [], notVeryEffective: ['rock', 'steel'], noEffect: ['ghost'] },
  fire: {
    superEffective: ['grass', 'ice', 'bug', 'steel'],
    notVeryEffective: ['fire', 'water', 'rock', 'dragon'],
    noEffect: [],
  },
  water: {
    superEffective: ['fire', 'ground', 'rock'],
    notVeryEffective: ['water', 'grass', 'dragon'],
    noEffect: [],
  },
  electric: {
    superEffective: ['water', 'flying'],
    notVeryEffective: ['electric', 'grass', 'dragon'],
    noEffect: ['ground'],
  },
  grass: {
    superEffective: ['water', 'ground', 'rock'],
    notVeryEffective: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
    noEffect: [],
  },
  ice: {
    superEffective: ['grass', 'ground', 'flying', 'dragon'],
    notVeryEffective: ['fire', 'water', 'ice', 'steel'],
    noEffect: [],
  },
  fighting: {
    superEffective: ['normal', 'ice', 'rock', 'dark', 'steel'],
    notVeryEffective: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    noEffect: ['ghost'],
  },
  poison: {
    superEffective: ['grass', 'fairy'],
    notVeryEffective: ['poison', 'ground', 'rock', 'ghost'],
    noEffect: ['steel'],
  },
  ground: {
    superEffective: ['fire', 'electric', 'poison', 'rock', 'steel'],
    notVeryEffective: ['grass', 'bug'],
    noEffect: ['flying'],
  },
  flying: {
    superEffective: ['grass', 'fighting', 'bug'],
    notVeryEffective: ['electric', 'rock', 'steel'],
    noEffect: [],
  },
  psychic: {
    superEffective: ['fighting', 'poison'],
    notVeryEffective: ['psychic', 'steel'],
    noEffect: ['dark'],
  },
  bug: {
    superEffective: ['grass', 'psychic', 'dark'],
    notVeryEffective: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    noEffect: [],
  },
  rock: {
    superEffective: ['fire', 'ice', 'flying', 'bug'],
    notVeryEffective: ['fighting', 'ground', 'steel'],
    noEffect: [],
  },
  ghost: {
    superEffective: ['psychic', 'ghost'],
    notVeryEffective: ['dark'],
    noEffect: ['normal'],
  },
  dragon: { superEffective: ['dragon'], notVeryEffective: ['steel'], noEffect: ['fairy'] },
  dark: {
    superEffective: ['psychic', 'ghost'],
    notVeryEffective: ['fighting', 'dark', 'fairy'],
    noEffect: [],
  },
  steel: {
    superEffective: ['ice', 'rock', 'fairy'],
    notVeryEffective: ['fire', 'water', 'electric', 'steel'],
    noEffect: [],
  },
  fairy: {
    superEffective: ['fighting', 'dragon', 'dark'],
    notVeryEffective: ['fire', 'poison', 'steel'],
    noEffect: [],
  },
};

/**
 * Damage multiplier of `attacking` against a Pokémon of the given `defending`
 * type(s) — the product of the per-type matchups (e.g. 0, 0.5, 1, 2 or 4).
 * @param attacking The attacking type.
 * @param defending The defending Pokémon's type(s).
 */
export function typeEffectiveness(attacking: string, defending: string[]): number {
  const matchup = TYPE_CHART[attacking.toLowerCase()];
  if (!matchup) {
    return 1;
  }
  return defending.reduce((multiplier, type) => {
    const defType = type.toLowerCase();
    if (matchup.noEffect.includes(defType)) {
      return 0;
    }
    if (matchup.superEffective.includes(defType)) {
      return multiplier * 2;
    }
    if (matchup.notVeryEffective.includes(defType)) {
      return multiplier * 0.5;
    }
    return multiplier;
  }, 1);
}
