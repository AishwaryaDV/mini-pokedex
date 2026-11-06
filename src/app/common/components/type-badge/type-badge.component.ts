import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { POKEMON_TYPE_COLORS } from '../../constants';

/** A colored pill rendering a single Pokémon type (e.g. "fire", "water"). */
@Component({
  selector: 'app-type-badge',
  templateUrl: './type-badge.component.html',
  styleUrl: './type-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeBadgeComponent {
  /** Pokémon type name, case-insensitive. */
  readonly type = input.required<string>();

  protected readonly color = computed(
    () => POKEMON_TYPE_COLORS[this.type().toLowerCase()] ?? 'var(--color-secondary)',
  );
}
