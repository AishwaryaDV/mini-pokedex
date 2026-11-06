import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Teams page — view teams and build new ones.
 * Team list and builder form are added in Phase 4.
 */
@Component({
  selector: 'app-teams-page',
  templateUrl: './teams-page.component.html',
  styleUrl: './teams-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamsPageComponent {}
