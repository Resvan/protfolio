// Dev-only stand-in for the Apps Script endpoint: node scripts/mock-endpoint.mjs
import { createServer } from 'node:http';
createServer((req, res) => {
  let b = ''; req.on('data', (c) => (b += c));
  req.on('end', () => {
    console.log('received', b);
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify(b.includes('fail') ? { ok: false, error: 'Mock failure' } : { ok: true }));
  });
}).listen(8787, () => console.log('mock on :8787'));
