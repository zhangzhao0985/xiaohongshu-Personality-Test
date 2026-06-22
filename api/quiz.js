/* 取题目，需令牌（Vercel 接口：/api/quiz） */
const L = require("./_lib");

module.exports = async (req, res) => {
  if (!L.verify(L.bearer(req))) {
    return L.sendJson(res, 401, { ok: false, reason: "unauthorized", message: "请先验证订单编号" });
  }
  return L.sendJson(res, 200, { ok: true, ...L.content.getClientQuiz() });
};
