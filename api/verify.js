/* 核验订单编号（Vercel 接口：/api/verify） */
const L = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return L.sendJson(res, 405, { ok: false });
  const body = await L.readJson(req);
  const code = L.normCode(body.code);
  const deviceId = body.deviceId;
  if (!code) return L.sendJson(res, 200, { ok: false, reason: "empty", message: "请输入订单编号" });
  if (!L.validDevice(deviceId)) return L.sendJson(res, 400, { ok: false, reason: "bad_device" });

  let rec;
  try {
    rec = await L.getOrder(code);
  } catch (e) {
    return L.sendJson(res, 500, { ok: false, reason: "kv",
      message: "服务器还没连接数据库（KV），请在 Vercel 里创建并绑定 KV 后重新部署" });
  }

  if (!rec && L.CFG.ACCEPT_ANY_LONG_NUMBER && /^\d{8,}$/.test(code)) {
    rec = { code, used: false, devices: [], createdAt: Date.now(), redeemedAt: null, revoked: false, note: "auto" };
  }
  if (!rec || rec.revoked) {
    return L.sendJson(res, 200, { ok: false, reason: "not_found",
      message: "没有匹配到这个订单编号，确认一下，或看看如何获取" });
  }

  const known = rec.devices.includes(deviceId);
  if (!known) {
    if (rec.devices.length >= L.CFG.MAX_DEVICES_PER_CODE) {
      return L.sendJson(res, 200, { ok: false, reason: "used",
        message: "这个订单编号已在其它设备使用过啦，如有疑问请联系小叭" });
    }
    rec.devices.push(deviceId);
    rec.used = true;
    if (!rec.redeemedAt) rec.redeemedAt = Date.now();
    await L.putOrder(code, rec);
  }

  const exp = Date.now() + L.CFG.TOKEN_TTL_DAYS * 864e5;
  return L.sendJson(res, 200, { ok: true, token: L.sign({ d: deviceId, c: code, exp }), expiresAt: exp });
};
