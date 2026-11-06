import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SELECTED_TEAM_KEY } from '../../../common/constants';
import { loadingState } from '../../../common/models/async-state.model';
import { CacheService } from '../../../common/services/cache.service';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';
import { Team } from '../../models/team.model';
import { TeamStore } from '../../state/team.store';
import { TeamBuilderFormComponent } from '../team-builder-form/team-builder-form.component';
import { TeamListComponent } from '../team-list/team-list.component';

/**
 * Teams page: loads teams (and the shared Pokémon lookup used for card
 * derivations) and renders the team list. The builder form is added next.
 */
@Component({
  selector: 'app-teams-page',
  imports: [TeamBuilderFormComponent, TeamListComponent],
  templateUrl: './teams-page.component.html',
  styleUrl: './teams-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPageComponent implements OnInit {
  private readonly teamStore = inject(TeamStore);
  private readonly pokemonStore = inject(PokemonStore);
  private readonly cache = inject(CacheService);

  protected readonly teamsState = toSignal(this.teamStore.teamsState$, {
    initialValue: loadingState<Team[]>(),
  });
  protected readonly pokemonById = toSignal(this.pokemonStore.entitiesById$, {
    initialValue: new Map<number, Pokemon>(),
  });
  protected readonly pokemonOptions = computed(() => [...this.pokemonById().values()]);

  /** Selected team id, restored from localStorage on load. */
  protected readonly selectedTeamId = signal<string | null>(
    this.cache.get<string>(SELECTED_TEAM_KEY),
  );

  constructor() {
    // Persist the selected team whenever it changes.
    effect(() => this.cache.set(SELECTED_TEAM_KEY, this.selectedTeamId()));
  }

  ngOnInit(): void {
    this.teamStore.load();
    this.pokemonStore.load();
  }

  protected selectTeam(id: string): void {
    // Toggle selection off if the same team is clicked again.
    this.selectedTeamId.update((current) => (current === id ? null : id));
  }

  protected reloadTeams(): void {
    this.teamStore.load();
  }

  protected deleteTeam(id: string): void {
    if (this.selectedTeamId() === id) {
      this.selectedTeamId.set(null);
    }
    this.teamStore.deleteTeam(id);
  }
}
