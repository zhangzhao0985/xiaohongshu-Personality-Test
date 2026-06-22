/* 管理接口（Vercel：/api/admin/add|generate|list|revoke），需 x-admin-token */
const L = require("../_lib");

module.exports = async (req, res) => {
  if (!L.isAdmin(req)) return L.sendJson(res, 401, { ok: false, message: "管理口令不正确" });
  const action = req.query.action;

  try {
    // 批量录入订单号（发货对接）
    if (action === "add" && req.method === "POST") {
      const body = await L.readJson(req);
      const raw = Array.isArray(body.codes) ? body.codes : String(body.codes || "").split(/[\s,，、]+/);
      let added = 0, dup = 0;
      for (const c0 of raw) {
        const c = L.normCode(c0);
        if (!c) continue;
        if (await L.getOrder(c)) { dup++; continue; }
        await L.putOrder(c, { code: c, used: false, devices: [], createdAt: Date.now(), redeemedAt: null, revoked: false, note: body.note || "" });
        added++;
      }
      return L.sendJson(res, 200, { ok: true, added, duplicated: dup });
    }

    // 生成解锁码
    if (action === "generate" && req.method === "POST") {
      const body = await L.readJson(req);
      const count = Math.max(1, Math.min(200, parseInt(body.count, 10) || 1));
      const prefix = String(body.prefix || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);
      const out = [];
      while (out.length < count) {
        const c = L.normCode(L.genCode(prefix));
        if (await L.getOrder(c)) continue;
        await L.putOrder(c, { code: c, used: false, devices: [], createdAt: Date.now(), redeemedAt: null, revoked: false, note: "generated" });
        out.push(c);
      }
      return L.sendJson(res, 200, { ok: true, codes: out });
    }

    // 列表 / 统计
    if (action === "list") {
      const list = (await L.listOrders()).sort((a, b) => b.createdAt - a.createdAt);
      const used = list.filter((x) => x.used).length;
      return L.sendJson(res, 200, {
        ok: true, total: list.length, used, unused: list.length - used,
        codes: list.slice(0, 1000).map((x) => ({ code: x.code, used: x.used, devices: x.devices.length, revoked: x.revoked, redeemedAt: x.redeemedAt, note: x.note })),
      });
    }

    // 作废
    if (action === "revoke" && req.method === "POST") {
      const body = await L.readJson(req);
      const c = L.normCode(body.code);
      const rec = await L.getOrder(c);
      if (!rec) return L.sendJson(res, 200, { ok: false, message: "未找到该编号" });
      rec.revoked = true;
      await L.putOrder(c, rec);
      return L.sendJson(res, 200, { ok: true });
    }

    return L.sendJson(res, 404, { ok: false, message: "未知管理接口" });
  } catch (e) {
    if (e.kv) return L.sendJson(res, 500, { ok: false, message: "服务器还没连接数据库（KV），请在 Vercel 里创建并绑定 KV 后重新部署" });
    return L.sendJson(res, 500, { ok: false, message: "出错了：" + e.message });
  }
};
