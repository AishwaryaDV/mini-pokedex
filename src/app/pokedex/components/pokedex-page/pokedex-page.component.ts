import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pokédex page — browse, filter and inspect Pokémon.
 * Table, filters and detail panel are added in Phase 3.
 */
@Component({
  selector: 'app-pokedex-page',
  templateUrl: './pokedex-page.component.html',
  styleUrl: './pokedex-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPageComponent {}
