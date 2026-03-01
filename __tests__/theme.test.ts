import { getFillColor } from '../theme/colors';

describe('getFillColor', () => {
  it('returns danger for < 20%', () => {
    expect(getFillColor(0.1)).toBe('#EF4444');
    expect(getFillColor(0.199)).toBe('#EF4444');
  });
  it('returns warning for 20–50%', () => {
    expect(getFillColor(0.2)).toBe('#F59E0B');
    expect(getFillColor(0.499)).toBe('#F59E0B');
  });
  it('returns success for >= 50%', () => {
    expect(getFillColor(0.5)).toBe('#10B981');
    expect(getFillColor(1.0)).toBe('#10B981');
  });
});
