import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Minimal, accessible loading spinner used as the default loading indicator
 * for {@link AsyncStateComponent} and anywhere a lightweight spinner fits.
 */
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  /** Diameter of the spinner ring, in pixels. */
  readonly size = input<number>(28);

  /** Optional caption rendered beneath the ring (e.g. "Loading Pokémon…"). */
  readonly label = input<string | null>(null);
}
