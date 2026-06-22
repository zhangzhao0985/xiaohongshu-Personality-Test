/* 健康检查 / 自检（Vercel：/api/health）。打开它能看出数据库有没有连上。 */
const L = require("./_lib");

module.exports = async (req, res) => {
  let kvOk = false, kvMsg = "未配置 KV（数据库）";
  try {
    await L.redis("PING");
    kvOk = true; kvMsg = "数据库已连接";
  } catch (e) {
    kvMsg = e.kv ? "未配置 KV（数据库）" : "数据库连接失败：" + e.message;
  }
  return L.sendJson(res, 200, {
    ok: true,
    adminTokenSet: !!L.CFG.ADMIN_TOKEN,
    kvConnected: kvOk,
    kvMessage: kvMsg,
    time: Date.now(),
  });
};
