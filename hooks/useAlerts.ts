import { useQuery } from '@tanstack/react-query';
import { XMLParser } from 'fast-xml-parser';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AlertSeverity = 'Red' | 'Orange' | 'Green';
export type AlertType = 'earthquake' | 'flood' | 'cyclone' | 'volcano' | 'drought';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  date: number;
  lat: number;
  lon: number;
  country: string;
  url: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Cyprus bbox with ~1° margin
const CYPRUS_BBOX = {
  minLat: 33,
  maxLat: 37,
  minLon: 31,
  maxLon: 36,
};

const EVENT_TYPE_MAP: Record<string, AlertType> = {
  EQ: 'earthquake',
  FL: 'flood',
  TC: 'cyclone',
  VO: 'volcano',
  DR: 'drought',
};

const GDACS_URL = 'https://www.gdacs.org/xml/rss.xml';

// ─── Parser ──────────────────────────────────────────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: false,
});

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').trim() ?? '';
}

export function parseGdacsXml(xml: string): Alert[] {
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  if (!items) return [];

  const itemArray = Array.isArray(items) ? items : [items];

  return itemArray
    .map((item: any) => {
      const point = item['georss:point'];
      if (!point) return null;

      const [lat, lon] = String(point).split(' ').map(Number);
      if (isNaN(lat) || isNaN(lon)) return null;

      // Filter to Cyprus bounding box
      if (lat < CYPRUS_BBOX.minLat || lat > CYPRUS_BBOX.maxLat) return null;
      if (lon < CYPRUS_BBOX.minLon || lon > CYPRUS_BBOX.maxLon) return null;

      const eventCode = item['gdacs:eventtype'] ?? '';
      const type = EVENT_TYPE_MAP[eventCode];
      if (!type) return null;

      const severity = item['gdacs:alertlevel'] as AlertSeverity;
      if (!['Red', 'Orange', 'Green'].includes(severity)) return null;

      const fromDate = item['gdacs:fromdate'];
      const date = fromDate ? new Date(fromDate).getTime() : 0;

      return {
        id: String(item.guid ?? ''),
        severity,
        type,
        title: String(item.title ?? ''),
        description: stripHtml(String(item.description ?? '')),
        date,
        lat,
        lon,
        country: String(item['gdacs:country'] ?? ''),
        url: String(item.link ?? ''),
      } satisfies Alert;
    })
    .filter((a): a is Alert => a !== null);
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(GDACS_URL);
  if (!res.ok) throw new Error(`GDACS error ${res.status}`);
  const xml = await res.text();
  return parseGdacsXml(xml);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAlerts(enabledTypes?: Set<AlertType>) {
  const query = useQuery({
    queryKey: ['gdacs-alerts'],
    queryFn: fetchAlerts,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const filtered = enabledTypes && query.data
    ? query.data.filter(a => enabledTypes.has(a.type))
    : query.data;

  return { ...query, data: filtered };
}
