const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const mysql = require("mysql2/promise");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(ROOT, "data");
const FALLBACK_FILE = path.join(DATA_DIR, "site-config.json");
const MAX_BODY = 10 * 1024 * 1024;
const ALLOWED_ADMIN_EMAIL = "atendimento.rsadigital@gmail.com";
let pool = null;

function loadDefaultConfig() {
  const source = fs.readFileSync(path.join(ROOT, "site-config.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SITE_CONFIG;
}

const DEFAULT_CONFIG = loadDefaultConfig();
const clone = (value) => JSON.parse(JSON.stringify(value));

function ensureFallbackFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FALLBACK_FILE)) fs.writeFileSync(FALLBACK_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
}

async function initializeStore() {
  if (process.env.DATABASE_URL) {
    try {
      pool = mysql.createPool({ uri: process.env.DATABASE_URL, waitForConnections: true, connectionLimit: 5, ssl: { rejectUnauthorized: true } });
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
    await pool.query("INSERT INTO site_settings (id, config_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE config_json = VALUES(config_json)", [serialized]);
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

function sendHtml(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY) { reject(new Error("payload_too_large")); req.destroy(); }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function contentType(filePath) {
  return ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" })[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function base64url(value) { return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"); }
function base64urlJson(value) { return base64url(JSON.stringify(value)); }
function decodeBase64url(value) { return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4), "base64").toString("utf8"); }

function signJwt(payload) {
  if (!process.env.MANUS_JWT_SECRET || !process.env.MANUS_PROJECT_ID) throw new Error("auth_not_configured");
  const header = base64urlJson({ alg: "HS256", typ: "JWT" });
  const body = base64urlJson(payload);
  const signature = base64url(crypto.createHmac("sha256", process.env.MANUS_JWT_SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token) {
  if (!token || !process.env.MANUS_JWT_SECRET || !process.env.MANUS_PROJECT_ID) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const expected = base64url(crypto.createHmac("sha256", process.env.MANUS_JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest());
  if (parts[2].length !== expected.length || !crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(decodeBase64url(parts[1]));
    if (payload.exp && Number(payload.exp) < Math.floor(Date.now() / 1000)) return null;
    if (payload.appId && payload.appId !== process.env.MANUS_PROJECT_ID) return null;
    const email = String(payload.email || "").trim().toLowerCase();
    return email ? { ...payload, email } : null;
  } catch { return null; }
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((item) => { const index = item.indexOf("="); return [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1).trim())]; }));
}
function cookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path || "/"}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (options.secure !== false) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}
function publicOrigin(req) {
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || req.headers.host || "localhost:3000";
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProto || (/^(localhost|127\.0\.0\.1)/.test(host) ? "http" : "https");
  return `${protocol}://${host}`;
}
function currentUser(req) { return verifyJwt(cookies(req).webdev_app_session); }
function adminAllowed(user) { return user && user.email === ALLOWED_ADMIN_EMAIL; }

async function exchangeCode(code, redirectUri) {
  const response = await fetch(`${process.env.MANUS_OAUTH_API_URL}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: process.env.MANUS_PROJECT_ID, grantType: "authorization_code", code, redirectUri }) });
  if (!response.ok) throw new Error("oauth_exchange_failed");
  return response.json();
}
async function getUserInfo(accessToken) {
  const response = await fetch(`${process.env.MANUS_OAUTH_API_URL}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken }) });
  if (!response.ok) throw new Error("oauth_identity_failed");
  return response.json();
}

async function serveStatic(req, res, pathname) {
  let requested = pathname === "/" ? "/index.html" : pathname;
  if (requested === "/admin") requested = "/admin.html";
  if (requested === "/login") requested = "/login.html";
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { sendJson(res, 404, { error: "not_found" }); return; }
  res.writeHead(200, { "Content-Type": contentType(filePath), "Cache-Control": "no-store" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const user = currentUser(req);
    if (url.pathname === "/api/health") { sendJson(res, 200, { ok: true, persistent: Boolean(pool), authConfigured: Boolean(process.env.MANUS_OAUTH_PORTAL_URL && process.env.MANUS_JWT_SECRET) }); return; }
    if (url.pathname === "/api/auth/me") { sendJson(res, 200, { authenticated: Boolean(user), allowed: adminAllowed(user), email: adminAllowed(user) ? user.email : null }); return; }
    if (url.pathname === "/auth/login") {
      const redirectUri = `${publicOrigin(req)}/manus-oauth/callback`;
      const nonce = crypto.randomBytes(24).toString("hex");
      const state = base64urlJson({ redirectUri, nonce });
      res.writeHead(302, { Location: `${process.env.MANUS_OAUTH_PORTAL_URL}/app-auth?appId=${encodeURIComponent(process.env.MANUS_PROJECT_ID)}&redirectUri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&responseType=code`, "Set-Cookie": cookie("oauth_state", state, { maxAge: 600, sameSite: "Lax" }) });
      res.end();
      return;
    }
    if (url.pathname === "/manus-oauth/callback") {
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const savedState = cookies(req).oauth_state;
      if (!state || !code || !savedState || state !== savedState) { sendHtml(res, 400, "<h1>Login inválido</h1><p>A sessão de autorização expirou. Volte e tente novamente.</p>"); return; }
      const stateData = JSON.parse(decodeBase64url(state));
      const tokens = await exchangeCode(code, stateData.redirectUri);
      const identity = await getUserInfo(tokens.accessToken);
      const email = String(identity.email || "").trim().toLowerCase();
      if (email !== ALLOWED_ADMIN_EMAIL) { res.writeHead(403, { "Set-Cookie": cookie("webdev_app_session", "", { maxAge: 0, sameSite: "None" }) }); res.end("Este e-mail não tem permissão para acessar o painel."); return; }
      const session = signJwt({ sub: identity.openId || email, email, name: identity.name || email, appId: process.env.MANUS_PROJECT_ID, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 });
      res.writeHead(302, { Location: "/admin", "Set-Cookie": [cookie("webdev_app_session", session, { maxAge: 7 * 24 * 60 * 60, sameSite: "None" }), cookie("oauth_state", "", { maxAge: 0, sameSite: "Lax" })] });
      res.end();
      return;
    }
    if (url.pathname === "/auth/logout") { res.writeHead(302, { Location: "/", "Set-Cookie": cookie("webdev_app_session", "", { maxAge: 0, sameSite: "None" }) }); res.end(); return; }
    if (url.pathname === "/api/site" && req.method === "GET") { sendJson(res, 200, await readSite()); return; }
    if (url.pathname === "/api/site" && req.method === "PUT") {
      if (!adminAllowed(user)) { sendJson(res, 401, { error: "authentication_required" }); return; }
      const parsed = JSON.parse(await readBody(req));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_config");
      await writeSite(parsed);
      sendJson(res, 200, { ok: true, savedAt: new Date().toISOString(), persistent: Boolean(pool) });
      return;
    }
    if ((url.pathname === "/admin" || url.pathname === "/admin.html") && !adminAllowed(user)) { res.writeHead(302, { Location: "/login?next=/admin" }); res.end(); return; }
    if (req.method !== "GET" && req.method !== "HEAD") { sendJson(res, 405, { error: "method_not_allowed" }); return; }
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    const status = error.message === "payload_too_large" ? 413 : error.message === "invalid_config" ? 400 : 500;
    console.error(error);
    sendJson(res, status, { error: error.message || "server_error" });
  }
});

initializeStore().then(() => server.listen(PORT, "0.0.0.0", () => console.log(`Link RSA listening on 0.0.0.0:${PORT}`))).catch((error) => { console.error(error); process.exit(1); });
