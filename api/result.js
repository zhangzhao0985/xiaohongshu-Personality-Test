/* 提交答案、计算结果，需令牌（Vercel 接口：/api/result） */
const L = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return L.sendJson(res, 405, { ok: false });
  if (!L.verify(L.bearer(req))) {
    return L.sendJson(res, 401, { ok: false, reason: "unauthorized", message: "请先验证订单编号" });
  }
  const body = await L.readJson(req);
  try {
    return L.sendJson(res, 200, { ok: true, result: L.content.computeResult(body.answers) });
  } catch (e) {
    return L.sendJson(res, 400, { ok: false, reason: "bad_answers", message: e.message });
  }
};
