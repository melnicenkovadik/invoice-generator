// server/index.ts
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
var DATA_DIR = process.env.DATA_DIR || "./data";
var DATA_FILE = join(DATA_DIR, "data.json");
var PORT = parseInt(process.env.PORT || "3000");
var DIST_DIR = process.env.DIST_DIR || "./dist";
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
var app = new Hono();
app.get("/api/data", (c) => {
  if (!existsSync(DATA_FILE)) return c.body("null", { headers: { "content-type": "application/json" } });
  const raw = readFileSync(DATA_FILE, "utf-8");
  return c.body(raw, { headers: { "content-type": "application/json" } });
});
app.put("/api/data", async (c) => {
  const body = await c.req.text();
  writeFileSync(DATA_FILE, body, "utf-8");
  return c.json({ ok: true });
});
app.post("/api/resend/*", async (c) => {
  const path = c.req.path.replace("/api/resend", "");
  const body = await c.req.text();
  const authHeader = c.req.header("Authorization") || "";
  const contentType = c.req.header("Content-Type") || "application/json";
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": contentType },
    body
  });
  return c.body(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" }
  });
});
app.use("/*", serveStatic({ root: DIST_DIR }));
app.get("*", (c) => {
  const html = readFileSync(join(DIST_DIR, "index.html"), "utf-8");
  return c.html(html);
});
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Invoice Generator \u2192 http://localhost:${PORT}`);
});
