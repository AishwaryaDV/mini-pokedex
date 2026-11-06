import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ToastService } from '../../common/services/toast.service';
import { CreateTeamInput, Team } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';
import { TeamStore } from './team.store';

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: '1',
    name: 'Existing',
    trainerId: '1',
    pokemonIds: [1, 2, 3],
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('TeamStore', () => {
  let store: TeamStore;
  let api: {
    getTeams: ReturnType<typeof vi.fn>;
    createTeam: ReturnType<typeof vi.fn>;
    deleteTeam: ReturnType<typeof vi.fn>;
  };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  /** Synchronously read the store's current teams (shareReplay replays latest). */
  function currentTeams(): Team[] {
    let teams: Team[] = [];
    store.teams$.subscribe((value) => (teams = value)).unsubscribe();
    return teams;
  }

  beforeEach(() => {
    api = { getTeams: vi.fn(), createTeam: vi.fn(), deleteTeam: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        TeamStore,
        { provide: TeamApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });
    store = TestBed.inject(TeamStore);
  });

  it('shows an optimistic team immediately, then rolls it back if the create fails', () => {
    const response = new Subject<Team>();
    api.createTeam.mockReturnValue(response);
    const input: CreateTeamInput = { name: 'Dragons', pokemonIds: [1, 2], trainerId: 1 };

    store.createTeam(input);

    // Optimistic: the team appears before the server responds.
    const optimistic = currentTeams();
    expect(optimistic).toHaveLength(1);
    expect(optimistic[0].name).toBe('Dragons');
    expect(optimistic[0].id).toContain('temp-');

    // The mutation fails → rollback + error toast.
    response.error(new Error('network down'));

    expect(currentTeams()).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('replaces the optimistic team with the server team on success', () => {
    const response = new Subject<Team>();
    api.createTeam.mockReturnValue(response);

    store.createTeam({ name: 'Dragons', pokemonIds: [1], trainerId: 1 });
    expect(currentTeams()[0].id).toContain('temp-');

    const saved = makeTeam({ id: '99', name: 'Dragons', pokemonIds: [1] });
    response.next(saved);

    const teams = currentTeams();
    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('99');
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('restores the removed team if an optimistic delete fails', () => {
    api.getTeams.mockReturnValue(of([makeTeam({ id: '1', name: 'Kanto' })]));
    store.load();
    expect(currentTeams()).toHaveLength(1);

    const response = new Subject<string>();
    api.deleteTeam.mockReturnValue(response);

    store.deleteTeam('1');
    expect(currentTeams()).toHaveLength(0); // optimistic removal

    response.error(new Error('server error'));
    expect(currentTeams()).toHaveLength(1); // restored
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
