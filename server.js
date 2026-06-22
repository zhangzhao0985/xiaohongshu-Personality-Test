/* =========================================================================
   欲望测试 · 后端服务（零依赖，直接 `node server.js` 就能跑）
   ——————————————————————————————————————————————————————————————————————
   职责：
   1) 托管前端静态页（首页 / 测试 / 结果 / 管理页）
   2) 订单编号核验：自动校验、自动放行、防重复使用（绑定设备）
   3) 防绕过：题目与结果都由后端下发/计算，未核验拿不到题、也算不出结果
   4) 管理接口：批量录入订单号 / 生成解锁码 / 查询 / 作废（发货对接）

   配置全部走环境变量（见 .env.example），不用改代码。
   ========================================================================= */

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { getClientQuiz, computeResult } = require("./content");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "orders.json");
const SECRET_FILE = path.join(DATA_DIR, ".secret");

const CFG = {
  PORT: parseInt(process.env.PORT || "8787", 10),
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || "",
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || "*",
  MAX_DEVICES_PER_CODE: parseInt(process.env.MAX_DEVICES_PER_CODE || "2", 10),
  TOKEN_TTL_DAYS: parseInt(process.env.TOKEN_TTL_DAYS || "30", 10),
  // 允许“任意 8 位以上纯数字订单号”直接通过（更省事但几乎不设防，默认关闭）
  ACCEPT_ANY_LONG_NUMBER: process.env.ACCEPT_ANY_LONG_NUMBER === "true",
};

/* ---------- 启动自检 ---------- */
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!CFG.ADMIN_TOKEN) {
  console.warn("⚠️  未设置 ADMIN_TOKEN（管理口令）。正式上线前请务必设置环境变量 ADMIN_TOKEN！");
}

// TOKEN_SECRET：优先用环境变量，否则在 data/.secret 里持久化一个随机密钥（重启后令牌不失效）
let TOKEN_SECRET = process.env.TOKEN_SECRET || "";
if (!TOKEN_SECRET) {
  try { TOKEN_SECRET = fs.readFileSync(SECRET_FILE, "utf8").trim(); } catch (_) {}
  if (!TOKEN_SECRET) {
    TOKEN_SECRET = crypto.randomBytes(32).toString("hex");
    try { fs.writeFileSync(SECRET_FILE, TOKEN_SECRET); } catch (_) {}
  }
}

/* ---------- 存储（JSON 文件 + 原子写） ---------- */
let DB = { codes: {} }; // codes[NORM] = { code, used, devices:[], createdAt, redeemedAt, revoked, note }
try { DB = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); if (!DB.codes) DB.codes = {}; } catch (_) {}

let saveChain = Promise.resolve();
let pendingSave = false;
function saveDB() {
  pendingSave = true;
  saveChain = saveChain.then(() => new Promise((resolve) => {
    if (!pendingSave) return resolve();
    pendingSave = false;
    const tmp = DB_FILE + ".tmp";
    fs.writeFile(tmp, JSON.stringify(DB, null, 2), (err) => {
      if (err) { console.error("保存失败:", err); return resolve(); }
      fs.rename(tmp, DB_FILE, (e) => { if (e) console.error("保存失败:", e); resolve(); });
    });
  }));
  return saveChain;
}

/* ---------- 工具 ---------- */
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uDecode = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
const normCode = (s) => String(s == null ? "" : s).trim().toUpperCase().replace(/\s+/g, "");
const validDevice = (s) => typeof s === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(s);

function signToken(payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = b64u(crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest());
  return `${body}.${sig}`;
}
function verifyToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expect = b64u(crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest());
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  let payload;
  try { payload = JSON.parse(b64uDecode(body)); } catch (_) { return null; }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}
function genCode(prefix) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 去掉易混字符
  let s = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) s += alphabet[bytes[i] % alphabet.length];
  return (prefix || "") + s;
}

/* ---------- 限流（按 IP，每分钟） ---------- */
const rl = new Map();
function rateLimited(ip, max = 30) {
  const now = Date.now();
  let e = rl.get(ip);
  if (!e || now > e.reset) { e = { c: 0, reset: now + 60000 }; rl.set(ip, e); }
  e.c++;
  return e.c > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of rl) if (now > v.reset) rl.delete(k); }, 120000).unref();

/* ---------- HTTP 辅助 ---------- */
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", CFG.ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}
function sendJSON(res, status, obj) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "", size = 0;
    req.on("data", (c) => { size += c.length; if (size > 1e6) { reject(new Error("body too large")); req.destroy(); } data += c; });
    req.on("end", () => { if (!data) return resolve({}); try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
const ipOf = (req) => (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "unknown";
const bearer = (req) => { const h = req.headers["authorization"] || ""; return h.startsWith("Bearer ") ? h.slice(7) : ""; };
const isAdmin = (req) => CFG.ADMIN_TOKEN && (req.headers["x-admin-token"] === CFG.ADMIN_TOKEN);

/* ---------- 静态文件 ---------- */
const STATIC = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/app.js": ["app.js", "application/javascript; charset=utf-8"],
  "/admin": ["admin.html", "text/html; charset=utf-8"],
  "/admin.html": ["admin.html", "text/html; charset=utf-8"],
};
function serveStatic(res, pathname) {
  const entry = STATIC[pathname];
  if (!entry) return false;
  fs.readFile(path.join(ROOT, entry[0]), (err, buf) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": entry[1], "Cache-Control": "no-cache" });
    res.end(buf);
  });
  return true;
}

/* =========================================================================
   路由
   ========================================================================= */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;
  const method = req.method;

  if (method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }

  // ---- 静态 ----
  if (method === "GET" && STATIC[pathname]) { if (serveStatic(res, pathname)) return; }

  // ---- 健康检查 ----
  if (pathname === "/api/health") return sendJSON(res, 200, { ok: true, time: Date.now() });

  // ---- 核验订单编号 ----
  if (pathname === "/api/verify" && method === "POST") {
    const ip = ipOf(req);
    if (rateLimited(ip, 30)) return sendJSON(res, 429, { ok: false, reason: "too_many", message: "尝试太频繁，请稍后再试" });
    let body;
    try { body = await readBody(req); } catch (_) { return sendJSON(res, 400, { ok: false, reason: "bad_request" }); }
    const code = normCode(body.code);
    const deviceId = body.deviceId;
    if (!code) return sendJSON(res, 200, { ok: false, reason: "empty", message: "请输入订单编号" });
    if (!validDevice(deviceId)) return sendJSON(res, 400, { ok: false, reason: "bad_device" });

    let rec = DB.codes[code];

    // 可选：任意长数字直接放行（默认关闭）
    if (!rec && CFG.ACCEPT_ANY_LONG_NUMBER && /^\d{8,}$/.test(code)) {
      rec = DB.codes[code] = { code, used: false, devices: [], createdAt: Date.now(), redeemedAt: null, revoked: false, note: "auto" };
    }
    if (!rec || rec.revoked) return sendJSON(res, 200, { ok: false, reason: "not_found", message: "没有匹配到这个订单编号，确认一下，或看看如何获取" });

    const known = rec.devices.includes(deviceId);
    if (!known) {
      if (rec.devices.length >= CFG.MAX_DEVICES_PER_CODE) {
        return sendJSON(res, 200, { ok: false, reason: "used", message: "这个订单编号已在其它设备使用过啦，如有疑问请联系小叭" });
      }
      rec.devices.push(deviceId);
      rec.used = true;
      if (!rec.redeemedAt) rec.redeemedAt = Date.now();
      saveDB();
    }
    const exp = Date.now() + CFG.TOKEN_TTL_DAYS * 864e5;
    const token = signToken({ d: deviceId, c: code, exp });
    return sendJSON(res, 200, { ok: true, token, expiresAt: exp });
  }

  // ---- 取题目（需令牌）----
  if (pathname === "/api/quiz" && method === "GET") {
    if (!verifyToken(bearer(req))) return sendJSON(res, 401, { ok: false, reason: "unauthorized", message: "请先验证订单编号" });
    return sendJSON(res, 200, { ok: true, ...getClientQuiz() });
  }

  // ---- 提交答案、计算结果（需令牌）----
  if (pathname === "/api/result" && method === "POST") {
    if (!verifyToken(bearer(req))) return sendJSON(res, 401, { ok: false, reason: "unauthorized", message: "请先验证订单编号" });
    let body;
    try { body = await readBody(req); } catch (_) { return sendJSON(res, 400, { ok: false, reason: "bad_request" }); }
    try {
      const result = computeResult(body.answers);
      return sendJSON(res, 200, { ok: true, result });
    } catch (e) {
      return sendJSON(res, 400, { ok: false, reason: "bad_answers", message: e.message });
    }
  }

  // ===================== 管理接口（需 x-admin-token） =====================
  if (pathname.startsWith("/api/admin/")) {
    if (!isAdmin(req)) return sendJSON(res, 401, { ok: false, message: "管理口令不正确" });

    // 批量录入订单号（发货对接：把小红书导出的订单号粘进来）
    if (pathname === "/api/admin/add" && method === "POST") {
      let body; try { body = await readBody(req); } catch (_) { return sendJSON(res, 400, { ok: false }); }
      const raw = Array.isArray(body.codes) ? body.codes
        : String(body.codes || "").split(/[\s,，、]+/);
      let added = 0, dup = 0;
      raw.map(normCode).filter(Boolean).forEach((c) => {
        if (DB.codes[c]) { dup++; return; }
        DB.codes[c] = { code: c, used: false, devices: [], createdAt: Date.now(), redeemedAt: null, revoked: false, note: body.note || "" };
        added++;
      });
      saveDB();
      return sendJSON(res, 200, { ok: true, added, duplicated: dup, total: Object.keys(DB.codes).length });
    }

    // 生成解锁码（贴进商品自动回复用）
    if (pathname === "/api/admin/generate" && method === "POST") {
      let body; try { body = await readBody(req); } catch (_) { return sendJSON(res, 400, { ok: false }); }
      const count = Math.max(1, Math.min(500, parseInt(body.count, 10) || 1));
      const prefix = String(body.prefix || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);
      const out = [];
      while (out.length < count) {
        const c = normCode(genCode(prefix));
        if (DB.codes[c]) continue;
        DB.codes[c] = { code: c, used: false, devices: [], createdAt: Date.now(), redeemedAt: null, revoked: false, note: "generated" };
        out.push(c);
      }
      saveDB();
      return sendJSON(res, 200, { ok: true, codes: out, total: Object.keys(DB.codes).length });
    }

    // 列表 / 统计
    if (pathname === "/api/admin/list" && method === "GET") {
      const list = Object.values(DB.codes).sort((a, b) => b.createdAt - a.createdAt);
      const used = list.filter((x) => x.used).length;
      return sendJSON(res, 200, { ok: true, total: list.length, used, unused: list.length - used,
        codes: list.slice(0, 1000).map((x) => ({ code: x.code, used: x.used, devices: x.devices.length, revoked: x.revoked, redeemedAt: x.redeemedAt, note: x.note })) });
    }

    // 作废
    if (pathname === "/api/admin/revoke" && method === "POST") {
      let body; try { body = await readBody(req); } catch (_) { return sendJSON(res, 400, { ok: false }); }
      const c = normCode(body.code);
      if (!DB.codes[c]) return sendJSON(res, 200, { ok: false, message: "未找到该编号" });
      DB.codes[c].revoked = true;
      saveDB();
      return sendJSON(res, 200, { ok: true });
    }
    return sendJSON(res, 404, { ok: false, message: "未知管理接口" });
  }

  // ---- 兜底 ----
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(CFG.PORT, () => {
  console.log(`✅ 欲望测试服务已启动: http://localhost:${CFG.PORT}`);
  console.log(`   管理页: http://localhost:${CFG.PORT}/admin`);
  console.log(`   订单库: ${Object.keys(DB.codes).length} 条 | 单码可用设备数: ${CFG.MAX_DEVICES_PER_CODE} | 令牌有效期: ${CFG.TOKEN_TTL_DAYS} 天`);
  if (!CFG.ADMIN_TOKEN) console.log("   ⚠️  ADMIN_TOKEN 未设置，管理接口当前不可用（请设置后再用管理页）。");
});
