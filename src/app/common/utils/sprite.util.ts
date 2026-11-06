/** Base URL for PokéAPI front sprites, addressable by national dex id. */
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/**
 * Build the front-sprite URL for a Pokémon id. Lets us render team members by
 * id without needing their full record loaded.
 */
export function pokemonSpriteUrl(id: number): string {
  return `${SPRITE_BASE}/${id}.png`;
}
