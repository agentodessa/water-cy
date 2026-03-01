import { fetchDams, fetchPercentages } from '../lib/api';

global.fetch = jest.fn();

const mockFetch = (data: unknown) => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
};

beforeEach(() => jest.clearAllMocks());

describe('fetchPercentages', () => {
  it('returns percentages from correct URL', async () => {
    mockFetch({ damNamesToPercentage: { Kouris: 0.183 }, totalPercentage: 0.203, date: 'Feb 27, 2026', totalCapacityInMCM: 290.5 });
    const result = await fetchPercentages();
    expect(result.totalPercentage).toBe(0.203);
    expect(result.damNamesToPercentage['Kouris']).toBe(0.183);
    expect(fetch).toHaveBeenCalledWith('https://cyprus-water.appspot.com/api/percentages');
  });
});

describe('fetchDams', () => {
  it('returns array of dams', async () => {
    mockFetch([{ nameEn: 'Kouris', capacity: 115000000 }]);
    const result = await fetchDams();
    expect(result).toHaveLength(1);
    expect(result[0].nameEn).toBe('Kouris');
  });
});
