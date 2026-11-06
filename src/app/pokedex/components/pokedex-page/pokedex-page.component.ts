import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PAGE_SIZE_OPTIONS } from '../../../common/constants';
import { AsyncStateComponent } from '../../../common/components/async-state/async-state.component';
import { SkeletonComponent } from '../../../common/components/skeleton/skeleton.component';
import { TypeBadgeComponent } from '../../../common/components/type-badge/type-badge.component';
import { loadingState } from '../../../common/models/async-state.model';
import { Pokemon, SortDirection, SortKey, StatKey } from '../../models/pokemon.model';
import { PokemonSelectors } from '../../state/pokemon.selectors';
import { PokemonStore } from '../../state/pokemon.store';
import { PokemonDetailPanelComponent } from '../pokemon-detail-panel/pokemon-detail-panel.component';

interface StatColumn {
  readonly key: SortKey;
  readonly label: string;
}

/**
 * Pokédex page: a sortable, filterable, paginated table of Pokémon. Reads
 * derived views from {@link PokemonSelectors} (bridged to signals) and pushes
 * all criteria changes back through {@link PokemonStore}. Row selection feeds
 * the detail panel.
 */
@Component({
  selector: 'app-pokedex-page',
  imports: [
    AsyncStateComponent,
    SkeletonComponent,
    TypeBadgeComponent,
    PokemonDetailPanelComponent,
  ],
  templateUrl: './pokedex-page.component.html',
  styleUrl: './pokedex-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPageComponent implements OnInit {
  private readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly statColumns: StatColumn[] = [
    { key: 'hp', label: 'HP' },
    { key: 'attack', label: 'Atk' },
    { key: 'defense', label: 'Def' },
    { key: 'specialAttack', label: 'Sp. Atk' },
    { key: 'specialDefense', label: 'Sp. Def' },
    { key: 'speed', label: 'Speed' },
    { key: 'total', label: 'Total' },
  ];

  // Store/selector streams bridged into the template as signals.
  protected readonly tableState = toSignal(this.selectors.tableState$, {
    initialValue: loadingState<Pokemon[]>(),
  });
  protected readonly availableTypes = toSignal(this.selectors.availableTypes$, {
    initialValue: [] as string[],
  });
  protected readonly filteredCount = toSignal(this.selectors.filteredCount$, { initialValue: 0 });
  protected readonly search = toSignal(this.store.search$, { initialValue: '' });
  protected readonly typeFilter = toSignal(this.store.typeFilter$, {
    initialValue: null as string | null,
  });
  protected readonly sort = toSignal(this.store.sort$, { initialValue: null });
  protected readonly page = toSignal(this.store.page$, { initialValue: 1 });
  protected readonly pageSize = toSignal(this.store.pageSize$, {
    initialValue: PAGE_SIZE_OPTIONS[0],
  });

  // Local UI state.
  protected readonly selectedPokemon = signal<Pokemon | null>(null);

  protected readonly rows = computed(() => this.tableState().data ?? []);
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredCount() / this.pageSize())),
  );

  ngOnInit(): void {
    this.store.load();
  }

  protected onSearch(value: string): void {
    this.store.setSearch(value);
  }

  protected onTypeChange(value: string): void {
    this.store.setTypeFilter(value || null);
  }

  protected onPageSizeChange(value: string): void {
    this.store.setPageSize(Number(value));
  }

  /** Toggle sort on a column: first click ascending, second descending. */
  protected toggleSort(key: SortKey): void {
    const current = this.sort();
    const direction: SortDirection =
      current?.key === key && current.direction === 'asc' ? 'desc' : 'asc';
    this.store.setSort({ key, direction });
  }

  protected sortIcon(key: SortKey): string {
    const current = this.sort();
    if (current?.key !== key) {
      return '';
    }
    return current.direction === 'asc' ? '▲' : '▼';
  }

  /** Numeric value rendered in a stat cell (base stat or precomputed total). */
  protected statValue(pokemon: Pokemon, key: SortKey): number {
    return key === 'total' ? pokemon.total : pokemon.stats[key as StatKey];
  }

  protected selectPokemon(pokemon: Pokemon): void {
    this.selectedPokemon.set(pokemon);
  }

  protected closePanel(): void {
    this.selectedPokemon.set(null);
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.store.setPage(this.page() - 1);
    }
  }

  protected nextPage(): void {
    if (this.page() < this.pageCount()) {
      this.store.setPage(this.page() + 1);
    }
  }

  protected reload(): void {
    this.store.reload();
  }
}
