import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { ChipComponent } from '../../../common/components/chip/chip.component';
import { SEARCH_DEBOUNCE_MS, TEAM_MAX_SIZE } from '../../../common/constants';
import { pokemonSpriteUrl } from '../../../common/utils/sprite.util';
import { Pokemon } from '../../../pokedex/models/pokemon.model';

/** Maximum autocomplete suggestions shown at once. */
const MAX_SUGGESTIONS = 8;

/**
 * Debounced typeahead for choosing team members. Suggestions are drawn from the
 * cached Pokémon list and exclude already-selected members; the current
 * selection is shown as removable chips. Purely presentational — the parent form
 * owns the selection state.
 */
@Component({
  selector: 'app-pokemon-picker',
  imports: [ReactiveFormsModule, ChipComponent],
  templateUrl: './pokemon-picker.component.html',
  styleUrl: './pokemon-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonPickerComponent {
  /** Pokémon available to pick from (the cached list). */
  readonly options = input.required<Pokemon[]>();

  /** Currently selected member ids. */
  readonly selectedIds = input.required<number[]>();

  /** Whether to render selected members as chips (off when slots own the display). */
  readonly showChips = input<boolean>(true);

  /** Emits a Pokémon id to add. */
  readonly add = output<number>();

  /** Emits a Pokémon id to remove. */
  readonly remove = output<number>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly query = toSignal(
    this.searchControl.valueChanges.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      startWith(''),
    ),
    { initialValue: '' },
  );

  private readonly lookup = computed(() => new Map(this.options().map((p) => [p.id, p])));

  protected readonly atCapacity = computed(() => this.selectedIds().length >= TEAM_MAX_SIZE);

  /** Selected Pokémon, resolved from ids for chip display. */
  protected readonly selected = computed<Pokemon[]>(() => {
    const lookup = this.lookup();
    return this.selectedIds()
      .map((id) => lookup.get(id))
      .filter((pokemon): pokemon is Pokemon => !!pokemon);
  });

  /** Suggestions matching the query, excluding selected members. */
  protected readonly matches = computed<Pokemon[]>(() => {
    const query = this.query().trim().toLowerCase();
    if (!query || this.atCapacity()) {
      return [];
    }
    const selected = new Set(this.selectedIds());
    return this.options()
      .filter((pokemon) => !selected.has(pokemon.id) && pokemon.name.includes(query))
      .slice(0, MAX_SUGGESTIONS);
  });

  protected spriteFor(id: number): string {
    return pokemonSpriteUrl(id);
  }

  protected onAdd(pokemon: Pokemon): void {
    this.add.emit(pokemon.id);
    this.searchControl.setValue('');
  }

  protected onRemove(id: number): void {
    this.remove.emit(id);
  }
}
