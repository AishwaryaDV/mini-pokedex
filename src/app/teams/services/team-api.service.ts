import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_RETRY_COUNT, API_RETRY_DELAY_MS, MOCK_GRAPHQL_URL } from '../../common/constants';
import { GraphqlClientService } from '../../core/graphql/graphql-client.service';
import { CreateTeamInput, Team } from '../models/team.model';

/** Raw team shape returned by json-graphql-server (string ids, snake_case). */
interface RawTeam {
  id: string;
  name: string;
  trainer_id: string;
  pokemon_ids: number[];
  created_at: string;
}

const GET_TEAMS = `
  query GetTeams {
    allTeams {
      id
      name
      trainer_id
      pokemon_ids
      created_at
    }
  }
`;

const CREATE_TEAM = `
  mutation CreateTeam($name: String!, $pokemonIds: [Int]!, $trainerId: ID, $createdAt: String) {
    createTeam(
      name: $name
      pokemon_ids: $pokemonIds
      trainer_id: $trainerId
      created_at: $createdAt
    ) {
      id
      name
      trainer_id
      pokemon_ids
      created_at
    }
  }
`;

const REMOVE_TEAM = `
  mutation RemoveTeam($id: ID!) {
    removeTeam(id: $id) {
      id
    }
  }
`;

/** Map a raw mock team into the camelCase {@link Team} model. */
function toTeam(raw: RawTeam): Team {
  return {
    id: raw.id,
    name: raw.name,
    trainerId: raw.trainer_id,
    pokemonIds: raw.pokemon_ids,
    createdAt: raw.created_at,
  };
}

/**
 * Reads and mutates teams against the local json-graphql-server mock.
 * Reads retry transient failures; mutations never retry, to avoid duplicating
 * a create or delete.
 */
@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly graphql = inject(GraphqlClientService);

  /** Fetch all teams. */
  getTeams(): Observable<Team[]> {
    return this.graphql
      .request<{ allTeams: RawTeam[] }>(
        MOCK_GRAPHQL_URL,
        GET_TEAMS,
        {},
        { retryCount: API_RETRY_COUNT, retryDelayMs: API_RETRY_DELAY_MS },
      )
      .pipe(map((response) => response.allTeams.map(toTeam)));
  }

  /**
   * Create a team. `created_at` is stamped client-side.
   * @param input Team name, member ids and owning trainer.
   */
  createTeam(input: CreateTeamInput): Observable<Team> {
    return this.graphql
      .request<{ createTeam: RawTeam }>(MOCK_GRAPHQL_URL, CREATE_TEAM, {
        name: input.name,
        pokemonIds: input.pokemonIds,
        trainerId: input.trainerId,
        createdAt: new Date().toISOString(),
      })
      .pipe(map((response) => toTeam(response.createTeam)));
  }

  /**
   * Delete a team by id.
   * @returns The deleted id, for reconciling optimistic state.
   */
  deleteTeam(id: string): Observable<string> {
    return this.graphql
      .request<{ removeTeam: { id: string } | null }>(MOCK_GRAPHQL_URL, REMOVE_TEAM, { id })
      .pipe(map(() => id));
  }
}
