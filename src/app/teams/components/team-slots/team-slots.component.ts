import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { SEARCH_DEBOUNCE_MS, TEAM_MAX_SIZE } from '../../../common/constants';
import { pokemonSpriteUrl } from '../../../common/utils/sprite.util';
import { Pokemon } from '../../../pokedex/models/pokemon.model';

/** Max draggable suggestions shown in the palette. */
const MAX_PALETTE = 12;

/**
 * Drag-and-drop team builder: drag Pokémon from the searchable palette into the
 * team slots, reorder within the slots, or drag a member out (or use its ×) to
 * remove it. Presentational — the parent form owns the member list via the
 * add/remove/reorder outputs.
 */
@Component({
  selector: 'app-team-slots',
  imports: [ReactiveFormsModule, CdkDropListGroup, CdkDropList, CdkDrag],
  templateUrl: './team-slots.component.html',
  styleUrl: './team-slots.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSlotsComponent {
  /** Pokémon available to drag in (the cached list). */
  readonly options = input.required<Pokemon[]>();

  /** Currently selected member ids, in order. */
  readonly selectedIds = input.required<number[]>();

  /** Emits a Pokémon id to add. */
  readonly add = output<number>();

  /** Emits a Pokémon id to remove. */
  readonly remove = output<number>();

  /** Emits the full reordered id list. */
  readonly reorder = output<number[]>();

  protected readonly maxSize = TEAM_MAX_SIZE;
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

  protected readonly selected = computed<Pokemon[]>(() => {
    const lookup = this.lookup();
    return this.selectedIds()
      .map((id) => lookup.get(id))
      .filter((pokemon): pokemon is Pokemon => !!pokemon);
  });

  protected readonly palette = computed<Pokemon[]>(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return [];
    }
    const selected = new Set(this.selectedIds());
    return this.options()
      .filter((pokemon) => !selected.has(pokemon.id) && pokemon.name.includes(query))
      .slice(0, MAX_PALETTE);
  });

  protected spriteFor(id: number): string {
    return pokemonSpriteUrl(id);
  }

  /** Drop handler for the team slots: reorder within, or add from the palette. */
  protected onSlotsDrop(event: CdkDragDrop<Pokemon[]>): void {
    if (event.previousContainer === event.container) {
      const ids = [...this.selectedIds()];
      moveItemInArray(ids, event.previousIndex, event.currentIndex);
      this.reorder.emit(ids);
      return;
    }
    const pokemon = event.item.data as Pokemon;
    if (!this.atCapacity() && !this.selectedIds().includes(pokemon.id)) {
      this.add.emit(pokemon.id);
    }
  }

  /** Drop handler for the palette: dragging a member here removes it. */
  protected onPaletteDrop(event: CdkDragDrop<Pokemon[]>): void {
    if (event.previousContainer !== event.container) {
      const pokemon = event.item.data as Pokemon;
      this.remove.emit(pokemon.id);
    }
  }

  protected onRemoveClick(id: number): void {
    this.remove.emit(id);
  }
}
