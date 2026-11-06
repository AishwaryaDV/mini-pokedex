import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  Observable,
  Subject,
  catchError,
  combineLatest,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { AsyncStateComponent } from '../../../common/components/async-state/async-state.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import {
  AsyncState,
  errorState,
  idleState,
  loadingState,
  successState,
} from '../../../common/models/async-state.model';
import { Pokemon, PokemonAbility } from '../../models/pokemon.model';
import { PokemonApiService } from '../../services/pokemon-api.service';
import { StatRadarChartComponent } from '../stat-radar-chart/stat-radar-chart.component';

interface StatRow {
  readonly label: string;
  readonly value: number;
}

/** Highest possible base stat, used to scale the stat bars. */
const MAX_STAT = 255;

/**
 * Slide-in panel showing full details for the selected Pokémon: sprite, types,
 * a radar chart of base stats, and its abilities (lazy-loaded on selection).
 * The panel stays mounted and toggles an open class so it animates in and out.
 */
@Component({
  selector: 'app-pokemon-detail-panel',
  imports: [AsyncStateComponent, TypeBadgeComponent, StatRadarChartComponent],
  templateUrl: './pokemon-detail-panel.component.html',
  styleUrl: './pokemon-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailPanelComponent {
  private readonly api = inject(PokemonApiService);

  /** The Pokémon to display, or `null` when the panel is closed. */
  readonly pokemon = input<Pokemon | null>(null);

  /** Emitted when the user dismisses the panel. */
  readonly closed = output<void>();

  private readonly retrySignal$ = new Subject<void>();

  protected readonly open = computed(() => this.pokemon() !== null);

  protected readonly maxStat = MAX_STAT;

  /** Abilities for the selected Pokémon, re-fetched on selection or Retry. */
  private readonly abilities$: Observable<AsyncState<PokemonAbility[]>> = combineLatest([
    toObservable(this.pokemon),
    this.retrySignal$.pipe(startWith(undefined)),
  ]).pipe(
    map(([pokemon]) => pokemon),
    switchMap((pokemon) =>
      pokemon
        ? this.api.getAbilities(pokemon.id).pipe(
            map((abilities) => successState(abilities)),
            startWith(loadingState<PokemonAbility[]>()),
            catchError((error: Error) => of(errorState<PokemonAbility[]>(error.message))),
          )
        : of(idleState<PokemonAbility[]>()),
    ),
  );

  protected readonly abilitiesState = toSignal(this.abilities$, {
    initialValue: idleState<PokemonAbility[]>(),
  });

  protected readonly statRows = computed<StatRow[]>(() => {
    const pokemon = this.pokemon();
    if (!pokemon) {
      return [];
    }
    return [
      { label: 'HP', value: pokemon.stats.hp },
      { label: 'Attack', value: pokemon.stats.attack },
      { label: 'Defense', value: pokemon.stats.defense },
      { label: 'Sp. Atk', value: pokemon.stats.specialAttack },
      { label: 'Sp. Def', value: pokemon.stats.specialDefense },
      { label: 'Speed', value: pokemon.stats.speed },
    ];
  });

  protected onClose(): void {
    this.closed.emit();
  }

  protected retryAbilities(): void {
    this.retrySignal$.next();
  }
}
