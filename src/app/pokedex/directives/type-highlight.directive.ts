import { Directive, computed, input } from '@angular/core';
import { typeEffectiveness } from '../utils/type-effectiveness.util';

/**
 * Marks the host row as strong or weak against a selected attacking type, based
 * on the type-effectiveness chart. Applied to Pokédex rows: when a comparison
 * type is chosen, rows whose Pokémon resist it are flagged strong, and rows weak
 * to it are flagged weak (host classes drive the styling).
 *
 * @example
 * ```html
 * <tr [appTypeHighlight]="highlightType()" [appTypeHighlightTypes]="pokemon.types">
 * ```
 */
@Directive({
  selector: '[appTypeHighlight]',
  host: {
    '[class.type-highlight--weak]': 'isWeak()',
    '[class.type-highlight--strong]': 'isStrong()',
  },
})
export class TypeHighlightDirective {
  /** The selected attacking type to compare against (or `null` for no highlight). */
  readonly appTypeHighlight = input<string | null>(null);

  /** The host Pokémon's own type(s). */
  readonly appTypeHighlightTypes = input.required<string[]>();

  private readonly multiplier = computed(() => {
    const attacking = this.appTypeHighlight();
    return attacking ? typeEffectiveness(attacking, this.appTypeHighlightTypes()) : 1;
  });

  /** Weak: the selected type hits this Pokémon super-effectively (×>1). */
  protected readonly isWeak = computed(() => this.multiplier() > 1);

  /** Strong: this Pokémon resists or is immune to the selected type (×<1). */
  protected readonly isStrong = computed(() => this.multiplier() < 1);
}
