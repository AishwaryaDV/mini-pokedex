import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { AsyncState, AsyncStatus } from '../../common/models/async-state.model';
import { ToastService } from '../../common/services/toast.service';
import { CreateTeamInput, Team } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';

interface TeamState {
  readonly teams: Team[];
  readonly status: AsyncStatus;
  readonly error: string | null;
}

const INITIAL_STATE: TeamState = { teams: [], status: 'idle', error: null };

/**
 * Holds the list of teams in a BehaviorSubject and performs create/delete with
 * optimistic updates: the UI changes immediately, then reconciles with the
 * mutation result or rolls back and shows an error toast on failure. Internal
 * subscriptions are to finite HTTP calls, so they complete without leaking.
 */
@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(TeamApiService);
  private readonly toast = inject(ToastService);

  private readonly state = new BehaviorSubject<TeamState>(INITIAL_STATE);

  /** Async state of the team list, driving the list view's four UI states. */
  readonly teamsState$: Observable<AsyncState<Team[]>> = this.state.pipe(
    map((state) => ({ status: state.status, data: state.teams, error: state.error })),
    shareReplay(1),
  );

  /** The current teams only. */
  readonly teams$: Observable<Team[]> = this.state.pipe(
    map((state) => state.teams),
    distinctUntilChanged(),
    shareReplay(1),
  );

  /** Existing team names, lower-cased — used by the async uniqueness validator. */
  readonly teamNames$: Observable<string[]> = this.teams$.pipe(
    map((teams) => teams.map((team) => team.name.trim().toLowerCase())),
    shareReplay(1),
  );

  /** Load all teams from the mock. Also used by the error-state Retry. */
  load(): void {
    this.patch({ status: 'loading', error: null });
    this.api.getTeams().subscribe({
      next: (teams) => this.patch({ teams, status: 'success', error: null }),
      error: (error: Error) => this.patch({ status: 'error', error: error.message }),
    });
  }

  /**
   * Create a team optimistically: a temporary row appears immediately, is
   * swapped for the server row on success, or removed with an error toast on
   * failure.
   * @param input The new team's name, members and trainer.
   */
  createTeam(input: CreateTeamInput): void {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Team = {
      id: tempId,
      name: input.name,
      trainerId: String(input.trainerId),
      pokemonIds: input.pokemonIds,
      createdAt: new Date().toISOString(),
    };
    this.patch({ teams: [...this.state.value.teams, optimistic] });

    this.api.createTeam(input).subscribe({
      next: (created) => {
        this.patch({
          teams: this.state.value.teams.map((team) => (team.id === tempId ? created : team)),
        });
        this.toast.success(`Team "${created.name}" created.`);
      },
      error: (error: Error) => {
        this.patch({ teams: this.state.value.teams.filter((team) => team.id !== tempId) });
        this.toast.error(`Could not create team. ${error.message}`);
      },
    });
  }

  /**
   * Delete a team optimistically: it disappears immediately and is restored
   * with an error toast if the mutation fails.
   * @param id The team to delete.
   */
  deleteTeam(id: string): void {
    const previous = this.state.value.teams;
    const target = previous.find((team) => team.id === id);
    this.patch({ teams: previous.filter((team) => team.id !== id) });

    this.api.deleteTeam(id).subscribe({
      next: () => this.toast.success(`Team "${target?.name ?? ''}" deleted.`),
      error: (error: Error) => {
        this.patch({ teams: previous });
        this.toast.error(`Could not delete team. ${error.message}`);
      },
    });
  }

  private patch(partial: Partial<TeamState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }
}
