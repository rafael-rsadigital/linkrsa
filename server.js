const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const mysql = require("mysql2/promise");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(ROOT, "data");
const FALLBACK_FILE = path.join(DATA_DIR, "site-config.json");
const MAX_BODY = 10 * 1024 * 1024;
let pool = null;

function loadDefaultConfig() {
  const source = fs.readFileSync(path.join(ROOT, "site-config.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SITE_CONFIG;
}

const DEFAULT_CONFIG = loadDefaultConfig();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureFallbackFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FALLBACK_FILE)) fs.writeFileSync(FALLBACK_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
}

async function initializeStore() {
  if (process.env.DATABASE_URL) {
    try {
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 5,
        ssl: { rejectUnauthorized: true }
      });
      await pool.query(`CREATE TABLE IF NOT EXISTS site_settings (
        id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
        config_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);
      console.log("Persistent store: managed database");
      return;
    } catch (error) {
      console.error("Database unavailable; using local fallback:", error.message);
      pool = null;
    }
  }
  ensureFallbackFile();
  console.log("Persistent store: local fallback");
}

async function readSite() {
  if (pool) {
    const [rows] = await pool.query("SELECT config_json FROM site_settings WHERE id = 1 LIMIT 1");
    if (!rows.length) {
      const initial = JSON.stringify(DEFAULT_CONFIG);
      await pool.query("INSERT INTO site_settings (id, config_json) VALUES (1, ?)", [initial]);
      return clone(DEFAULT_CONFIG);
    }
    return JSON.parse(rows[0].config_json);
  }
  ensureFallbackFile();
  return JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf8"));
}

async function writeSite(config) {
  const serialized = JSON.stringify(config);
  if (pool) {
    await pool.query(
      "INSERT INTO site_settings (id, config_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE config_json = VALUES(config_json)",
      [serialized]
    );
    return;
  }
  ensureFallbackFile();
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(config, null, 2));
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY) {
        reject(new Error("payload_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon"
  }[ext] || "application/octet-stream";
}

async function serveStatic(req, res, pathname) {
  let requested = pathname === "/" ? "/index.html" : pathname;
  if (requested === "/admin") requested = "/admin.html";
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(res, 404, { error: "not_found" });
    return;
  }
  res.writeHead(200, { "Content-Type": contentType(filePath), "Cache-Control": "no-store" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, persistent: Boolean(pool) });
      return;
    }
    if (url.pathname === "/api/site" && req.method === "GET") {
      sendJson(res, 200, await readSite());
      return;
    }
    if (url.pathname === "/api/site" && req.method === "PUT") {
      const parsed = JSON.parse(await readBody(req));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_config");
      await writeSite(parsed);
      sendJson(res, 200, { ok: true, savedAt: new Date().toISOString(), persistent: Boolean(pool) });
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "method_not_allowed" });
      return;
    }
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    const status = error.message === "payload_too_large" ? 413 : error.message === "invalid_config" ? 400 : 500;
    console.error(error);
    sendJson(res, status, { error: error.message || "server_error" });
  }
});

initializeStore().then(() => {
  server.listen(PORT, "0.0.0.0", () => console.log(`Link RSA listening on 0.0.0.0:${PORT}`));
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
