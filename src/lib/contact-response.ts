export type EndpointResult = { ok: true } | { ok: false; error: string };
export function parseEndpointResponse(httpOk: boolean, text: string): EndpointResult {
  if (!httpOk) return { ok: false, error: 'The server returned an error.' };
  try {
    const data = JSON.parse(text) as { ok?: unknown; error?: unknown };
    if (data.ok === true) return { ok: true };
    return { ok: false, error: typeof data.error === 'string' ? data.error : 'The server rejected the message.' };
  } catch {
    return { ok: false, error: 'Unexpected response from the server.' };
  }
}
