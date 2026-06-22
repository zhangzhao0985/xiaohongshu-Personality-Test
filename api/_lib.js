/* =========================================================================
   Vercel 版后端 · 公共库（被 api/ 下的各函数复用）
   存储用 Upstash Redis（Vercel 上叫 KV）的 REST 接口，纯 fetch、零依赖。
   下划线开头的文件 Vercel 不会当成接口、也不会公开访问，安全。
   ========================================================================= */
const crypto = require("crypto");
const content = require("./_content");

const CFG = {
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || "",
  MAX_DEVICES_PER_CODE: parseInt(process.env.MAX_DEVICES_PER_CODE || "2", 10),
  TOKEN_TTL_DAYS: parseInt(process.env.TOKEN_TTL_DAYS || "30", 10),
  ACCEPT_ANY_LONG_NUMBER: process.env.ACCEPT_ANY_LONG_NUMBER === "true",
};
const TOKEN_SECRET = process.env.TOKEN_SECRET || process.env.ADMIN_TOKEN || "dev-secret-change-me";

// 兼容 Vercel KV 与 Upstash 两种环境变量命名
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const kvConfigured = !!(KV_URL && KV_TOKEN);

async function redis(...cmd) {
  if (!kvConfigured) { const e = new Error("KV_NOT_CONFIGURED"); e.kv = true; throw e; }
  const r = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + KV_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json().catch(() => null);
  if (j && j.error) throw new Error("KV: " + j.error);
  return j ? j.result : null;
}

/* ---------- 编码 / 令牌 ---------- */
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uDecode = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
const normCode = (s) => String(s == null ? "" : s).trim().toUpperCase().replace(/\s+/g, "");
const validDevice = (s) => typeof s === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(s);

function sign(payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = b64u(crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest());
  return body + "." + sig;
}
function verify(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expect = b64u(crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest());
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  let p; try { p = JSON.parse(b64uDecode(body)); } catch (_) { return null; }
  if (!p.exp || Date.now() > p.exp) return null;
  return p;
}
function genCode(prefix) {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = ""; const b = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) s += a[b[i] % a.length];
  return (prefix || "") + s;
}

/* ---------- 请求辅助 ---------- */
const bearer = (req) => { const h = req.headers["authorization"] || ""; return h.startsWith("Bearer ") ? h.slice(7) : ""; };
const isAdmin = (req) => CFG.ADMIN_TOKEN && (req.headers["x-admin-token"] === CFG.ADMIN_TOKEN);
async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch (_) { return {}; } }
  return await new Promise((resolve) => {
    let d = ""; req.on("data", (c) => (d += c));
    req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch (_) { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}
function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

/* ---------- 订单存储 ---------- */
async function getOrder(norm) { const s = await redis("GET", "order:" + norm); return s ? JSON.parse(s) : null; }
async function putOrder(norm, obj) { await redis("SET", "order:" + norm, JSON.stringify(obj)); await redis("SADD", "orders:index", norm); }
async function listOrders() {
  const idx = (await redis("SMEMBERS", "orders:index")) || [];
  if (!idx.length) return [];
  const vals = (await redis("MGET", ...idx.map((n) => "order:" + n))) || [];
  return vals.filter(Boolean).map((v) => JSON.parse(v));
}

module.exports = {
  CFG, content, kvConfigured, redis,
  normCode, validDevice, sign, verify, genCode,
  bearer, isAdmin, readJson, sendJson,
  getOrder, putOrder, listOrders,
};
