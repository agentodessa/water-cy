import { parseGdacsXml, type Alert } from '../hooks/useAlerts';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:gdacs="http://www.gdacs.org"
  xmlns:georss="http://www.georss.org/georss">
  <channel>
    <item>
      <guid>EQ1234</guid>
      <title>M 5.2 - Cyprus</title>
      <description>Earthquake near Limassol</description>
      <link>https://www.gdacs.org/report.aspx?eventid=1234</link>
      <gdacs:alertlevel>Orange</gdacs:alertlevel>
      <gdacs:eventtype>EQ</gdacs:eventtype>
      <gdacs:fromdate>2026-03-19T10:00:00Z</gdacs:fromdate>
      <gdacs:country>Cyprus</gdacs:country>
      <georss:point>34.7 33.0</georss:point>
    </item>
    <item>
      <guid>FL5678</guid>
      <title>Flood - Turkey</title>
      <description>Flash flooding in coastal areas</description>
      <link>https://www.gdacs.org/report.aspx?eventid=5678</link>
      <gdacs:alertlevel>Red</gdacs:alertlevel>
      <gdacs:eventtype>FL</gdacs:eventtype>
      <gdacs:fromdate>2026-03-18T08:30:00Z</gdacs:fromdate>
      <gdacs:country>Turkey</gdacs:country>
      <georss:point>40.0 30.0</georss:point>
    </item>
    <item>
      <guid>EQ9999</guid>
      <title>M 3.1 - Near Cyprus</title>
      <description>Minor earthquake</description>
      <link>https://www.gdacs.org/report.aspx?eventid=9999</link>
      <gdacs:alertlevel>Green</gdacs:alertlevel>
      <gdacs:eventtype>EQ</gdacs:eventtype>
      <gdacs:fromdate>2026-03-19T12:00:00Z</gdacs:fromdate>
      <gdacs:country>Cyprus</gdacs:country>
      <georss:point>35.0 33.5</georss:point>
    </item>
  </channel>
</rss>`;

describe('parseGdacsXml', () => {
  let alerts: Alert[];

  beforeAll(() => {
    alerts = parseGdacsXml(SAMPLE_XML);
  });

  it('filters to Cyprus bounding box only', () => {
    expect(alerts).toHaveLength(2);
    expect(alerts.every(a => a.country === 'Cyprus')).toBe(true);
  });

  it('parses severity correctly', () => {
    expect(alerts[0].severity).toBe('Orange');
    expect(alerts[1].severity).toBe('Green');
  });

  it('maps event type codes to readable types', () => {
    expect(alerts[0].type).toBe('earthquake');
    expect(alerts[1].type).toBe('earthquake');
  });

  it('parses georss:point into lat/lon', () => {
    expect(alerts[0].lat).toBeCloseTo(34.7);
    expect(alerts[0].lon).toBeCloseTo(33.0);
  });

  it('parses date to ms epoch', () => {
    expect(typeof alerts[0].date).toBe('number');
    expect(alerts[0].date).toBeGreaterThan(0);
  });

  it('extracts title, description, url, country', () => {
    expect(alerts[0].title).toBe('M 5.2 - Cyprus');
    expect(alerts[0].description).toBe('Earthquake near Limassol');
    expect(alerts[0].url).toContain('gdacs.org');
    expect(alerts[0].country).toBe('Cyprus');
  });
});
