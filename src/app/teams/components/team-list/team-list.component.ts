import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AsyncStateComponent } from '../../../common/components/async-state/async-state.component';
import { AsyncState } from '../../../common/models/async-state.model';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { Team } from '../../models/team.model';
import { TeamCardComponent } from '../team-card/team-card.component';

/** Presents the team collection as a responsive grid of cards, with the four UI states. */
@Component({
  selector: 'app-team-list',
  imports: [AsyncStateComponent, TeamCardComponent],
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent {
  /** Async state of the teams list. */
  readonly state = input.required<AsyncState<Team[]>>();

  /** Shared id→Pokémon lookup, forwarded to each card. */
  readonly pokemonById = input.required<Map<number, Pokemon>>();

  /** Id of the currently selected team, for highlighting. */
  readonly selectedId = input<string | null>(null);

  /** Emitted when the error state's Retry is clicked. */
  readonly retry = output<void>();

  /** Emitted with a team id when a card is selected. */
  readonly selectTeam = output<string>();

  /** Emitted with a team id when a card requests deletion. */
  readonly deleteTeam = output<string>();
}
