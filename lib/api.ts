const BASE = 'https://cyprus-water.appspot.com/api';

export interface Dam {
  nameEn: string;
  nameEl: string;
  yearOfConstruction: number;
  height: number;
  capacity: number;
  lat: number;
  lng: number;
  riverNameEl: string;
  typeEl: string;
  imageUrl: string;
  wikipediaUrl: string;
}

export interface Percentages {
  damNamesToPercentage: Record<string, number>;
  date: string;
  totalPercentage: number;
  totalCapacityInMCM: number;
}

export interface DateStatistics {
  timestamp: number;
  date: string;
  storageInMCM: Record<string, number>;
  inflowInMCM: Record<string, number>;
}

export interface MonthlyInflow {
  timestamp: number;
  year: number;
  period: string;
  periodOrder: number;
  inflowInMCM: number;
}

export interface Event {
  [key: string]: unknown;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchPercentages    = () => get<Percentages>('/percentages');
export const fetchDams           = () => get<Dam[]>('/dams');
export const fetchMonthlyInflows = () => get<MonthlyInflow[]>('/monthly-inflows');
export const fetchEvents         = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to', to);
  const q = params.toString();
  return get<Event[]>(q ? `/events?${q}` : '/events');
};
export const fetchDateStatistics = (date?: string) =>
  get<DateStatistics>(date ? `/date-statistics?date=${date}` : '/date-statistics');
