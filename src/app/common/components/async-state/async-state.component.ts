import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AsyncState } from '../../models/async-state.model';
import { SpinnerComponent } from '../spinner/spinner.component';

/**
 * Wraps any async view and guarantees all four required states are handled:
 * loading, error (with Retry), empty, and success. Success content is projected
 * as the default slot; custom loading/empty visuals can be projected via the
 * `asyncLoading` / `asyncEmpty` attributes, otherwise sensible defaults render.
 *
 * @example
 * ```html
 * <app-async-state [state]="pokemonState()" (retry)="reload()"
 *   emptyMessage="No Pokémon match your filters.">
 *   <table>…success content…</table>
 * </app-async-state>
 * ```
 */
@Component({
  selector: 'app-async-state',
  imports: [SpinnerComponent],
  templateUrl: './async-state.component.html',
  styleUrl: './async-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncStateComponent {
  /** Current state of the data source driving this view. */
  readonly state = input.required<AsyncState<unknown>>();

  /** Message shown when the request succeeds but carries no data. */
  readonly emptyMessage = input<string>('Nothing to show here yet.');

  /** Caption passed to the default loading spinner. */
  readonly loadingLabel = input<string | null>(null);

  /** Emitted when the user clicks Retry from the error state. */
  readonly retry = output<void>();

  protected readonly isLoading = computed(() => this.state().status === 'loading');
  protected readonly isError = computed(() => this.state().status === 'error');
  protected readonly isEmpty = computed(() => {
    const s = this.state();
    if (s.status !== 'success') {
      return false;
    }
    return s.data == null || (Array.isArray(s.data) && s.data.length === 0);
  });
}
