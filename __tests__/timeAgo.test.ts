import { timeAgo } from '../lib/timeAgo';

describe('timeAgo', () => {
  it('returns "just now" for < 1 minute', () => {
    expect(timeAgo(Date.now() - 30_000)).toBe('just now');
  });

  it('returns minutes for < 1 hour', () => {
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe('5m ago');
  });

  it('returns hours for < 1 day', () => {
    expect(timeAgo(Date.now() - 3 * 3_600_000)).toBe('3h ago');
  });

  it('returns days for >= 1 day', () => {
    expect(timeAgo(Date.now() - 2 * 86_400_000)).toBe('2d ago');
  });
});
