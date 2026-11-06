import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  DEFAULT_TRAINER_ID,
  TEAM_MAX_SIZE,
  TEAM_MIN_SIZE,
  TEAM_NAME_MAX_LENGTH,
  TEAM_NAME_MIN_LENGTH,
} from '../../../common/constants';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { TeamStore } from '../../state/team.store';
import {
  maxTeamSize,
  minTeamSize,
  uniqueTeamNameValidator,
} from '../../validators/team.validators';
import { PokemonPickerComponent } from '../pokemon-picker/pokemon-picker.component';

/**
 * Reactive form for building a team: a name (required, 3–30 chars, async-unique)
 * and 1–6 Pokémon chosen via the autocomplete picker. On submit it creates the
 * team through the store's optimistic flow and resets.
 */
@Component({
  selector: 'app-team-builder-form',
  imports: [ReactiveFormsModule, PokemonPickerComponent],
  templateUrl: './team-builder-form.component.html',
  styleUrl: './team-builder-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teamStore = inject(TeamStore);

  /** Pokémon available to pick from (the cached list). */
  readonly options = input.required<Pokemon[]>();

  protected readonly nameMinLength = TEAM_NAME_MIN_LENGTH;
  protected readonly nameMaxLength = TEAM_NAME_MAX_LENGTH;
  protected readonly maxSize = TEAM_MAX_SIZE;

  protected readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', {
      validators: [
        Validators.required,
        Validators.minLength(TEAM_NAME_MIN_LENGTH),
        Validators.maxLength(TEAM_NAME_MAX_LENGTH),
      ],
      asyncValidators: [uniqueTeamNameValidator(this.teamStore)],
    }),
    members: this.fb.nonNullable.control<number[]>([], {
      validators: [minTeamSize(TEAM_MIN_SIZE), maxTeamSize(TEAM_MAX_SIZE)],
    }),
  });

  protected get nameControl() {
    return this.form.controls.name;
  }

  protected get membersControl() {
    return this.form.controls.members;
  }

  // Bridged so the OnPush view re-renders on value/status changes (incl. the
  // async validator resolving without a DOM event).
  protected readonly members = toSignal(this.membersControl.valueChanges, {
    initialValue: this.membersControl.value,
  });
  protected readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected addMember(id: number): void {
    const current = this.membersControl.value;
    if (current.length >= TEAM_MAX_SIZE || current.includes(id)) {
      return;
    }
    this.membersControl.setValue([...current, id]);
    this.membersControl.markAsDirty();
    this.membersControl.markAsTouched();
  }

  protected removeMember(id: number): void {
    this.membersControl.setValue(this.membersControl.value.filter((memberId) => memberId !== id));
    this.membersControl.markAsTouched();
  }

  protected submit(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, members } = this.form.getRawValue();
    this.teamStore.createTeam({
      name: name.trim(),
      pokemonIds: members,
      trainerId: DEFAULT_TRAINER_ID,
    });
    this.form.reset({ name: '', members: [] });
  }
}
