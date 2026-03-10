import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = process.env.DATA_DIR || './data';
const DATA_FILE = join(DATA_DIR, 'data.json');
const PORT = parseInt(process.env.PORT || '3000');
const DIST_DIR = process.env.DIST_DIR || './dist';

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const app = new Hono();

// --- API routes ---

app.get('/api/data', (c) => {
  if (!existsSync(DATA_FILE)) return c.body('null', { headers: { 'content-type': 'application/json' } });
  const raw = readFileSync(DATA_FILE, 'utf-8');
  return c.body(raw, { headers: { 'content-type': 'application/json' } });
});

app.put('/api/data', async (c) => {
  const body = await c.req.text();
  writeFileSync(DATA_FILE, body, 'utf-8');
  return c.json({ ok: true });
});

// Resend email proxy
app.post('/api/resend/*', async (c) => {
  const path = c.req.path.replace('/api/resend', '');
  const body = await c.req.text();
  const authHeader = c.req.header('Authorization') || '';
  const contentType = c.req.header('Content-Type') || 'application/json';

  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': contentType },
    body,
  });

  return c.body(await res.text(), {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
});

// --- Static files (Vite build output) ---
app.use('*', serveStatic({ root: DIST_DIR }));

// SPA fallback — serve index.html for any unmatched route (deep links)
app.use('*', serveStatic({ root: DIST_DIR, path: 'index.html' }));

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Invoice Generator → http://localhost:${PORT}`);
});
