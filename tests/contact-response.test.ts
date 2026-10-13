import { describe, expect, it } from 'vitest';
import { parseEndpointResponse } from '../src/lib/contact-response';

describe('parseEndpointResponse', () => {
  it('succeeds only on HTTP ok + JSON ok:true', () => {
    expect(parseEndpointResponse(true, '{"ok":true}')).toEqual({ ok: true });
  });
  it('fails on server-side error JSON', () => {
    expect(parseEndpointResponse(true, '{"ok":false,"error":"Too many requests"}')).toEqual({ ok: false, error: 'Too many requests' });
  });
  it('fails on HTML or non-JSON bodies (Apps Script error page)', () => {
    expect(parseEndpointResponse(true, '<!doctype html><title>Error</title>').ok).toBe(false);
  });
  it('fails on non-2xx', () => {
    expect(parseEndpointResponse(false, '{"ok":true}').ok).toBe(false);
  });
});
