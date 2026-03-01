import { formatMCM, formatPercentage } from '../lib/format';

describe('formatMCM', () => {
  it('formats values < 1 with 3 decimal places', () => {
    expect(formatMCM(0.717)).toBe('0.717 MCM');
  });
  it('formats large values with 1 decimal place', () => {
    expect(formatMCM(21.09)).toBe('21.1 MCM');
    expect(formatMCM(115)).toBe('115.0 MCM');
  });
});

describe('formatPercentage', () => {
  it('formats as percentage string', () => {
    expect(formatPercentage(0.203)).toBe('20.3%');
    expect(formatPercentage(1.0)).toBe('100.0%');
  });
});
