import { useQuery } from '@tanstack/react-query';

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;        // ms epoch
  depth: number;       // km
  lat: number;
  lon: number;
  url: string;
  felt: number | null;
  tsunami: number;
}

async function fetchEarthquakes(): Promise<Earthquake[]> {
  // Bounding box covering the Mediterranean Sea and surroundings
  const url =
    'https://earthquake.usgs.gov/fdsnws/event/1/query' +
    '?format=geojson' +
    '&minlatitude=28&maxlatitude=48' +
    '&minlongitude=-8&maxlongitude=42' +
    '&minmagnitude=2' +
    '&orderby=time' +
    '&limit=200';

  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS error ${res.status}`);
  const json = await res.json();

  return (json.features as any[]).map(f => ({
    id:        f.id,
    magnitude: f.properties.mag ?? 0,
    place:     f.properties.place ?? 'Unknown location',
    time:      f.properties.time,
    depth:     f.geometry.coordinates[2],
    lat:       f.geometry.coordinates[1],
    lon:       f.geometry.coordinates[0],
    url:       f.properties.url,
    felt:      f.properties.felt,
    tsunami:   f.properties.tsunami,
  }));
}

export function useEarthquakes() {
  return useQuery({
    queryKey: ['earthquakes'],
    queryFn: fetchEarthquakes,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
