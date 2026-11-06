import { typeEffectiveness } from './type-effectiveness.util';

describe('typeEffectiveness', () => {
  it('is super-effective (×2) against a weak single type', () => {
    expect(typeEffectiveness('water', ['fire'])).toBe(2);
  });

  it('stacks to ×4 against a doubly-weak dual type', () => {
    // Rock is super-effective against both fire and flying (e.g. Charizard).
    expect(typeEffectiveness('rock', ['fire', 'flying'])).toBe(4);
  });

  it('is not-very-effective (×0.5)', () => {
    expect(typeEffectiveness('fire', ['water'])).toBe(0.5);
  });

  it('has no effect (×0) against an immune type', () => {
    expect(typeEffectiveness('electric', ['ground'])).toBe(0);
  });

  it('is neutral (×1) for an even matchup or an unknown type', () => {
    expect(typeEffectiveness('normal', ['fighting'])).toBe(1);
    expect(typeEffectiveness('unknown', ['fire'])).toBe(1);
  });
});
