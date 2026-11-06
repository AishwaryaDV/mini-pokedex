import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A single shimmering placeholder block. Compose several to build skeleton
 * rows/cards that match the shape of the content being loaded (no layout jump).
 */
@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  /** CSS width of the block (e.g. "100%", "80px"). */
  readonly width = input<string>('100%');

  /** CSS height of the block (e.g. "16px"). */
  readonly height = input<string>('16px');

  /** CSS border-radius of the block. */
  readonly radius = input<string>('var(--radius-sm)');
}
