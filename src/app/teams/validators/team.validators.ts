import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, first, map, of, switchMap, timer } from 'rxjs';
import { SEARCH_DEBOUNCE_MS } from '../../common/constants';
import { TeamStore } from '../state/team.store';

/**
 * Async validator asserting a team name is not already taken. Debounced via a
 * timer so it only hits the store after the user pauses typing.
 * @param store Source of the current team names.
 */
export function uniqueTeamNameValidator(store: TeamStore): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = String(control.value ?? '')
      .trim()
      .toLowerCase();
    if (!value) {
      return of(null);
    }
    return timer(SEARCH_DEBOUNCE_MS).pipe(
      switchMap(() => store.teamNames$.pipe(first())),
      map((names) => (names.includes(value) ? { nameTaken: true } : null)),
    );
  };
}

/** Require at least `min` selected members. */
export function minTeamSize(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as unknown[];
    const length = Array.isArray(value) ? value.length : 0;
    return length >= min ? null : { minTeamSize: { required: min, actual: length } };
  };
}

/** Allow at most `max` selected members. */
export function maxTeamSize(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as unknown[];
    const length = Array.isArray(value) ? value.length : 0;
    return length <= max ? null : { maxTeamSize: { max, actual: length } };
  };
}
