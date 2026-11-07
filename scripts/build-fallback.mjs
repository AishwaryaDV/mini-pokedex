// Generates a static Pokémon snapshot from PokéAPI's REST API, used as an
// offline fallback when the live GraphQL endpoint is unavailable.
// Run with: npm run snapshot
import { writeFileSync } from 'node:fs';

const LIMIT = 251;
const BASE = 'https://pokeapi.co/api/v2/pokemon';
const OUT = 'public/pokemon-fallback.json';
const BATCH = 20;

const STAT_KEY = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'specialAttack',
  'special-defense': 'specialDefense',
  speed: 'speed',
};

async function fetchOne(id, attempt = 1) {
  try {
    const res = await fetch(`${BASE}/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const p = await res.json();
    const stats = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
    for (const s of p.stats) {
      const key = STAT_KEY[s.stat.name];
      if (key) stats[key] = s.base_stat;
    }
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    return {
      pokemon: {
        id: p.id,
        name: p.name,
        height: p.height,
        weight: p.weight,
        types: p.types.map((t) => t.type.name),
        sprite: p.sprites.front_default ?? null,
        stats,
        total,
      },
      abilities: p.abilities.map((a) => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
        shortEffect: null,
      })),
    };
  } catch (error) {
    if (attempt < 3) return fetchOne(id, attempt + 1);
    throw new Error(`id ${id} failed: ${error.message}`);
  }
}

async function run() {
  const ids = Array.from({ length: LIMIT }, (_, i) => i + 1);
  const results = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    results.push(...(await Promise.all(batch.map((id) => fetchOne(id)))));
    process.stdout.write(`\r  ${results.length}/${LIMIT}`);
  }
  results.sort((a, b) => a.pokemon.id - b.pokemon.id);
  const abilitiesById = {};
  for (const r of results) abilitiesById[r.pokemon.id] = r.abilities;
  const snapshot = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: 'https://pokeapi.co/api/v2',
    pokemon: results.map((r) => r.pokemon),
    abilitiesById,
  };
  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(`\n  wrote ${OUT} (${snapshot.pokemon.length} pokémon)`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
