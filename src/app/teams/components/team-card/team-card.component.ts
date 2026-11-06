import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { pokemonSpriteUrl } from '../../../common/utils/sprite.util';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { Team } from '../../models/team.model';

interface TypeCount {
  readonly type: string;
  readonly count: number;
}

/**
 * A single team card. Derives the team's type distribution and total base stats
 * via `computed()` from the shared Pokémon lookup. Members are rendered by id so
 * sprites show even for Pokémon outside the loaded set.
 */
@Component({
  selector: 'app-team-card',
  imports: [DatePipe, TypeBadgeComponent],
  templateUrl: './team-card.component.html',
  styleUrl: './team-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCardComponent {
  /** The team to render. */
  readonly team = input.required<Team>();

  /** Shared id→Pokémon lookup, for stat/type derivations. */
  readonly pokemonById = input.required<Map<number, Pokemon>>();

  /** Whether this card is the currently selected team. */
  readonly active = input<boolean>(false);

  /** Position in the list, used to stagger the entry animation. */
  readonly index = input<number>(0);

  /** Emits the team id when the card is selected. */
  readonly selected = output<string>();

  /** Emits the team id when the user requests deletion. */
  readonly deleteRequested = output<string>();

  /** Members whose full records are available in the shared lookup. */
  private readonly members = computed<Pokemon[]>(() => {
    const lookup = this.pokemonById();
    return this.team()
      .pokemonIds.map((id) => lookup.get(id))
      .filter((pokemon): pokemon is Pokemon => !!pokemon);
  });

  /** Type counts across the team, most common first. */
  protected readonly typeDistribution = computed<TypeCount[]>(() => {
    const counts = new Map<string, number>();
    for (const member of this.members()) {
      for (const type of member.types) {
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  });

  /** Sum of the members' base-stat totals. */
  protected readonly totalBaseStats = computed(() =>
    this.members().reduce((sum, member) => sum + member.total, 0),
  );

  protected spriteFor(id: number): string {
    return pokemonSpriteUrl(id);
  }

  protected onSelect(): void {
    this.selected.emit(this.team().id);
  }

  protected onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteRequested.emit(this.team().id);
  }
}
