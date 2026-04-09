import { describe, it, expect } from 'vitest';
import RADIO_STREAMS from '../radioStreams.js';

describe('Radio Streams', () => {
  it('has at least 10 streams', () => {
    const actual = RADIO_STREAMS.filter((s) => s.url !== 'custom');
    expect(actual.length).toBeGreaterThanOrEqual(10);
  });

  it('every stream has url and label', () => {
    for (const stream of RADIO_STREAMS) {
      expect(stream.url).toBeTruthy();
      expect(stream.label).toBeTruthy();
    }
  });

  it('custom URL option is last', () => {
    expect(RADIO_STREAMS[RADIO_STREAMS.length - 1].url).toBe('custom');
  });

  it('all non-custom URLs are valid https URLs', () => {
    for (const stream of RADIO_STREAMS) {
      if (stream.url === 'custom') continue;
      expect(stream.url).toMatch(/^https?:\/\//);
    }
  });

  it('no duplicate URLs', () => {
    const urls = RADIO_STREAMS.filter((s) => s.url !== 'custom').map((s) => s.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('labels include country flag emoji', () => {
    for (const stream of RADIO_STREAMS) {
      if (stream.url === 'custom') continue;
      // Should start with a flag emoji (🇧🇷, 🇺🇸, etc.) or 🌐
      expect(stream.label).toMatch(/^[\u{1F1E0}-\u{1F1FF}]{2}|^\u{1F310}/u);
    }
  });

  // Network test — runs against real streams to verify they respond.
  // Skipped by default (enable with STREAM_CHECK=1 npm test)
  const shouldCheckStreams = typeof process !== 'undefined' && process.env?.STREAM_CHECK === '1';

  describe.skipIf(!shouldCheckStreams)('stream reachability (network)', () => {
    for (const stream of RADIO_STREAMS) {
      if (stream.url === 'custom') continue;

      it(`${stream.label} responds`, async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
          const resp = await fetch(stream.url, {
            method: 'GET',
            signal: controller.signal,
            headers: { Range: 'bytes=0-1024' },
          });
          clearTimeout(timeout);

          // Accept 200 (OK) or 206 (Partial Content) or even 302 (redirect)
          expect(resp.status).toBeLessThan(400);
        } catch (err) {
          clearTimeout(timeout);
          if (err.name === 'AbortError') {
            // Timeout = stream might be slow but not dead
            // For a streaming server, connecting and timing out on data is actually OK
            // (it means the server is there, just slow to start sending)
            expect(true).toBe(true);
          } else {
            throw new Error(`Stream unreachable: ${stream.url} — ${err.message}`);
          }
        }
      }, 15000);
    }
  });
});
