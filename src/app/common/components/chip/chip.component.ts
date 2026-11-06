import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * A compact, optionally-removable chip with an optional leading image.
 * Used to display selected Pokémon in the team builder.
 */
@Component({
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  /** Text shown in the chip. */
  readonly label = input.required<string>();

  /** Optional leading image URL (e.g. a Pokémon sprite). */
  readonly imageUrl = input<string | null>(null);

  /** Whether the remove (×) button is shown. */
  readonly removable = input<boolean>(true);

  /** Emitted when the remove button is clicked. */
  readonly remove = output<void>();
}
