/** A trainer's team of Pokémon, as returned by the mock server. */
export interface Team {
  readonly id: string;
  readonly name: string;
  readonly trainerId: string;
  readonly pokemonIds: number[];
  readonly createdAt: string;
}

/** Fields required to create a team via the mock `createTeam` mutation. */
export interface CreateTeamInput {
  readonly name: string;
  readonly pokemonIds: number[];
  readonly trainerId: number;
}
