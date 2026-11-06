import { FormControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { TeamStore } from '../state/team.store';
import { maxTeamSize, minTeamSize, uniqueTeamNameValidator } from './team.validators';

describe('uniqueTeamNameValidator', () => {
  const store = { teamNames$: of(['kanto starters']) } as unknown as TeamStore;
  const validate = uniqueTeamNameValidator(store);

  function run(value: string): { result: ValidationErrors | null | 'unset' } {
    const box: { result: ValidationErrors | null | 'unset' } = { result: 'unset' };
    (validate(new FormControl(value)) as Observable<ValidationErrors | null>).subscribe(
      (errors) => (box.result = errors),
    );
    return box;
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('flags a name that already exists, case-insensitively', async () => {
    const box = run('Kanto Starters');
    await vi.advanceTimersByTimeAsync(300); // debounce timer
    expect(box.result).toEqual({ nameTaken: true });
  });

  it('accepts an unused name', async () => {
    const box = run('Johto Legends');
    await vi.advanceTimersByTimeAsync(300);
    expect(box.result).toBeNull();
  });

  it('passes empty input without consulting the store', () => {
    // Resolves synchronously (of(null)); no timer involved.
    expect(run('').result).toBeNull();
  });
});

describe('team size validators', () => {
  it('minTeamSize fails below the minimum and passes at or above it', () => {
    expect(minTeamSize(1)(new FormControl([]))).toEqual({
      minTeamSize: { required: 1, actual: 0 },
    });
    expect(minTeamSize(1)(new FormControl([5]))).toBeNull();
  });

  it('maxTeamSize fails above the maximum and passes at or below it', () => {
    expect(maxTeamSize(2)(new FormControl([1, 2, 3]))).toEqual({
      maxTeamSize: { max: 2, actual: 3 },
    });
    expect(maxTeamSize(2)(new FormControl([1, 2]))).toBeNull();
  });
});
