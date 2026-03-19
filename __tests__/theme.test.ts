import { getFillBgClass, getFillClass } from '../lib/utils';

describe('getFillClass', () => {
  it('returns danger class for < 20%', () => {
    expect(getFillClass(0.1)).toBe('text-red-500');
    expect(getFillClass(0.199)).toBe('text-red-500');
  });
  it('returns warning class for 20–50%', () => {
    expect(getFillClass(0.2)).toBe('text-amber-500');
    expect(getFillClass(0.499)).toBe('text-amber-500');
  });
  it('returns success class for >= 50%', () => {
    expect(getFillClass(0.5)).toBe('text-emerald-500');
    expect(getFillClass(1.0)).toBe('text-emerald-500');
  });
});

describe('getFillBgClass', () => {
  it('returns danger bg class for < 20%', () => {
    expect(getFillBgClass(0.1)).toBe('bg-red-500');
  });
  it('returns warning bg class for 20–50%', () => {
    expect(getFillBgClass(0.2)).toBe('bg-amber-500');
  });
  it('returns success bg class for >= 50%', () => {
    expect(getFillBgClass(0.5)).toBe('bg-emerald-500');
  });
});
