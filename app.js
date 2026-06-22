/* =========================================================================
   你的什么欲望最强 · 前端
   —— 题目和计分都在后端，这里只负责界面、验证、答题、出结果、生成分享图。
   —— 小叭你好：这一块 CONFIG 是前端唯一要改的（店铺名/链接/后端地址/备案号）。
   ========================================================================= */

const CONFIG = {
  SHOP_NAME: "叭叭博一",   // 你的小红书店铺名，例如 "小叭的杂货铺"
  SHOP_URL: "",          // 可留空；填了会在弹窗里出现「前往店铺 →」按钮
  // 后端地址。若前后端同一个服务（推荐），留空即可；分开部署时填后端域名，如 "https://api.xxx.com"
  API_BASE: "",
  // 大陆备案上线后，把工信部 ICP 备案号填这里，会显示在首页底部（大陆网站合规要求）。
  // 例如 "粤ICP备12345678号-1"
  ICP_BEIAN: "",
};

const VALUE_POINTS = [
  { i: "🎯", t: "精准 · 5 维欲望测评", s: "20 道情境题，量化你 5 大欲望的真实强度" },
  { i: "📑", t: "专属 · 你的《欲望档案》", s: "主导欲望 + 隐藏面 + 想我指数，一份只属于你" },
  { i: "✨", t: "彩蛋 · 一个隐藏维度", s: "大多数人都测不出来的第 5 种欲望，你会触发它吗？" },
  { i: "💌", t: "治愈 · 小叭的悄悄话", s: "每一份结果里，都藏着小叭单独想对你说的一句话" },
];

/* ---------- 状态 ---------- */
const LS = { device: "yw_device", token: "yw_token" };
let quiz = null;       // { total, questions:[{id,q,options:[{id,t}]}] }
let answers = {};      // qi -> optionId
let cur = 0;
let lastResult = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ---------- 设备号 / 令牌 ---------- */
function deviceId() {
  let d = localStorage.getItem(LS.device);
  if (!d) {
    d = (crypto.randomUUID ? crypto.randomUUID() : "d" + Date.now() + Math.random().toString(36).slice(2)).replace(/[^A-Za-z0-9_-]/g, "");
    localStorage.setItem(LS.device, d);
  }
  return d;
}
const getToken = () => localStorage.getItem(LS.token) || "";
const setToken = (t) => localStorage.setItem(LS.token, t);

/* ---------- API ---------- */
async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["Authorization"] = "Bearer " + getToken();
  const r = await fetch(CONFIG.API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({ ok: false, message: "网络异常" }));
  return { status: r.status, data };
}

/* =========================================================================
   初始化
   ========================================================================= */
function init() {
  $("#shopNameText").textContent = CONFIG.SHOP_NAME || "待补充";
  if (CONFIG.SHOP_URL) { const a = $("#shopGoLink"); a.href = CONFIG.SHOP_URL; a.hidden = false; }

  $("#valueList").innerHTML = VALUE_POINTS.map((v) =>
    `<li><span class="vi">${v.i}</span><div><b>${v.t}</b><span class="vt">${v.s}</span></div></li>`).join("");
  $("#recapList").innerHTML = VALUE_POINTS.map((v) => `<li>${v.i} ${v.t.replace(/^.+ · /, "")}</li>`).join("");

  if (CONFIG.ICP_BEIAN) {
    $("#siteBeian").innerHTML = `<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">${CONFIG.ICP_BEIAN}</a>`;
  }

  deviceId();
  bindEvents();

  // 打开网页即弹出「解锁您的专属测试」弹窗
  setTimeout(() => openModal("#shopModal"), 600);
}

function bindEvents() {
  $("#startBtn").addEventListener("click", enterFlow);
  $("#gateBack").addEventListener("click", () => show("#home"));
  $("#quizBack").addEventListener("click", prevQuestion);
  $("#verifyBtn").addEventListener("click", verify);
  $("#orderInput").addEventListener("keydown", (e) => { if (e.key === "Enter") verify(); });
  $("#howToOrder").addEventListener("click", () => openModal("#shopModal"));
  $("#retakeBtn").addEventListener("click", () => beginQuiz());
  $("#shareBtn").addEventListener("click", openShare);

  $("#shopModalClose").addEventListener("click", () => closeModal("#shopModal"));
  $("#shopModal").addEventListener("click", (e) => { if (e.target.id === "shopModal") closeModal("#shopModal"); });
  $("#shopModalOk").addEventListener("click", () => { closeModal("#shopModal"); show("#gate"); $("#orderInput").focus(); });
  $("#okModalBtn").addEventListener("click", () => { closeModal("#okModal"); beginQuiz(); });
  $("#shareModalClose").addEventListener("click", () => closeModal("#shareModal"));
  $("#shareModal").addEventListener("click", (e) => { if (e.target.id === "shareModal") closeModal("#shareModal"); });
}

function show(id) {
  $$(".screen").forEach((s) => s.classList.remove("is-active"));
  $(id).classList.add("is-active");
  window.scrollTo(0, 0);
}

/* =========================================================================
   进入流程：先验证订单编号
   ========================================================================= */
async function enterFlow() {
  // 已验证过（令牌有效）→ 直接开始；否则进验证门
  if (getToken()) {
    const ok = await beginQuiz(true);
    if (ok) return;
  }
  show("#gate");
}

async function verify() {
  const input = $("#orderInput");
  const msg = $("#verifyMsg");
  const val = input.value.trim();
  if (!val) { msg.textContent = "请先输入订单编号哦～"; msg.className = "unlock-msg err"; shake(input); return; }

  msg.textContent = "验证中…"; msg.className = "unlock-msg";
  const { data } = await api("/api/verify", { method: "POST", body: { code: val, deviceId: deviceId() } });
  if (data.ok) {
    setToken(data.token);
    msg.textContent = "验证成功！"; msg.className = "unlock-msg ok";
    openModal("#okModal"); fireConfetti();
  } else {
    msg.textContent = data.message || "验证未通过"; msg.className = "unlock-msg err";
    shake(input);
    if (data.reason === "not_found" || data.reason === "empty") setTimeout(() => openModal("#shopModal"), 700);
  }
}

/* =========================================================================
   测试
   ========================================================================= */
async function beginQuiz(silent) {
  const { status, data } = await api("/api/quiz", { auth: true });
  if (status === 401 || !data.ok) {
    if (!silent) { $("#verifyMsg").textContent = "登录已过期，请重新验证订单编号"; $("#verifyMsg").className = "unlock-msg err"; }
    show("#gate");
    return false;
  }
  quiz = data;
  answers = {};
  cur = 0;
  $("#qTotal").textContent = quiz.total;
  show("#quiz");
  renderQuestion();
  return true;
}

function renderQuestion() {
  const item = quiz.questions[cur];
  $("#qDeco").textContent = "Q" + (cur + 1);
  $("#qIndex").textContent = cur + 1;
  $("#progressBar").style.width = (cur / quiz.total) * 100 + 5 + "%";
  $("#qTitle").textContent = item.q;

  const opts = shuffle(item.options.slice());
  const box = $("#qOptions");
  box.innerHTML = "";
  opts.forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "opt opt-anim";
    b.style.animationDelay = i * 0.05 + "s";
    if (answers[item.id] === opt.id) b.classList.add("sel");
    b.innerHTML = `<span class="dot"></span><span>${opt.t}</span>`;
    b.addEventListener("click", () => selectOption(item.id, opt.id, b));
    box.appendChild(b);
  });
}

function selectOption(qid, optId, el) {
  answers[qid] = optId;
  $$("#qOptions .opt").forEach((o) => o.classList.remove("sel"));
  el.classList.add("sel");
  setTimeout(() => {
    if (cur < quiz.total - 1) { cur++; renderQuestion(); }
    else finishQuiz();
  }, 280);
}

function prevQuestion() {
  if (cur === 0) { show("#home"); return; }
  cur--;
  renderQuestion();
}

async function finishQuiz() {
  $("#progressBar").style.width = "100%";
  const ordered = quiz.questions.map((q) => answers[q.id]);
  const { status, data } = await api("/api/result", { method: "POST", auth: true, body: { answers: ordered } });
  if (status === 401) { show("#gate"); return; }
  if (!data.ok) { alert(data.message || "结果生成失败，请重试"); return; }
  lastResult = data.result;
  renderResult(lastResult);
  show("#result");
}

/* =========================================================================
   结果
   ========================================================================= */
function renderResult(r) {
  const dom = r.dominant;
  $("#domEmoji").textContent = dom.emoji;
  $("#domName").textContent = dom.name;
  $("#domName").style.color = dom.color;
  $("#domTeaser").textContent = dom.teaser;

  $("#bars").innerHTML = r.spectrum.map((d) =>
    `<div class="bar-row">
      <span class="bar-name">${d.emoji} ${d.name}</span>
      <span class="bar-track"><span class="bar-fill" data-w="${d.pct}" style="background:${d.color}"></span></span>
      <span class="bar-val">${d.pct}%</span>
    </div>`).join("");

  $("#domCardH").textContent = `关于你的「${dom.name}」`;
  $("#domDesc").textContent = dom.desc;
  $("#domTraits").innerHTML = dom.traits.map((t) => `<span class="chip">${t}</span>`).join("");

  $("#hiddenH").innerHTML = r.hidden.title;
  $("#hiddenDesc").textContent = r.hidden.desc;
  $("#hiddenTraits").innerHTML = (r.hidden.traits || []).map((t) => `<span class="chip">${t}</span>`).join("");

  $("#missNum").textContent = r.missIndex;
  $("#missLine").textContent = r.missLine;
  $("#zhaoNote").textContent = r.zhaoNote;

  setTimeout(() => {
    $$("#bars .bar-fill").forEach((f) => (f.style.width = f.dataset.w + "%"));
    $("#missFill").style.width = r.missIndex + "%";
  }, 140);
}

/* =========================================================================
   分享长图（canvas 绘制，无需任何外部库）
   ========================================================================= */
function openShare() {
  if (!lastResult) return;
  drawPoster(lastResult);
  const url = $("#posterCanvas").toDataURL("image/png");
  $("#shareImg").src = url;
  $("#shareDownload").href = url;
  openModal("#shareModal");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function wrapText(ctx, text, x, y, maxW, lh) {
  const chars = text.split("");
  let line = "";
  for (const ch of chars) {
    if (ctx.measureText(line + ch).width > maxW && line) { ctx.fillText(line, x, y); line = ch; y += lh; }
    else line += ch;
  }
  if (line) ctx.fillText(line, x, y);
  return y;
}

function drawPoster(r) {
  const c = $("#posterCanvas");
  const W = c.width, H = c.height;
  const ctx = c.getContext("2d");
  const dom = r.dominant;

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#fff0f3"); bg.addColorStop(0.5, "#fff7f3"); bg.addColorStop(1, "#fff");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = dom.color + "22"; ctx.beginPath(); ctx.arc(W - 80, 120, 180, 0, 7); ctx.fill();
  ctx.fillStyle = "#ffd9df55"; ctx.beginPath(); ctx.arc(60, 60, 120, 0, 7); ctx.fill();

  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = "#b09aa3";
  ctx.font = '500 26px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText("我 的 欲 望 档 案", cx, 92);

  ctx.font = '900 62px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "#2b2230";
  ctx.fillText("你的最强欲望是", cx, 190);

  ctx.font = "100px sans-serif";
  ctx.fillText(dom.emoji, cx, 320);
  ctx.font = '900 90px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = dom.color;
  ctx.fillText(dom.name, cx, 430);

  // teaser
  ctx.font = '500 30px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = "#6f6677";
  wrapText(ctx, dom.teaser, cx, 500, W - 140, 46);

  // 光谱卡
  let y = 600;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 70, y, W - 140, 360, 28); ctx.fill();
  ctx.fillStyle = "#2b2230";
  ctx.font = '800 34px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText("🧬 你的欲望光谱", 110, y + 60);

  let by = y + 110;
  r.spectrum.forEach((d) => {
    ctx.fillStyle = "#2b2230";
    ctx.font = '700 28px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(`${d.emoji} ${d.name}`, 110, by + 8);
    const tx = 280, tw = W - 140 - (tx - 70) - 90;
    ctx.fillStyle = "#f1ecef"; roundRect(ctx, tx, by - 16, tw, 22, 11); ctx.fill();
    ctx.fillStyle = d.color; roundRect(ctx, tx, by - 16, Math.max(22, tw * d.pct / 100), 22, 11); ctx.fill();
    ctx.fillStyle = "#6f6677"; ctx.textAlign = "right";
    ctx.font = '700 26px "PingFang SC",sans-serif';
    ctx.fillText(d.pct + "%", W - 100, by + 6);
    ctx.textAlign = "left";
    by += 58;
  });

  // 想我指数
  y = 1010;
  ctx.fillStyle = "#fff0f4"; roundRect(ctx, 70, y, W - 140, 150, 28); ctx.fill();
  ctx.fillStyle = "#2b2230"; ctx.font = '800 32px "PingFang SC",sans-serif';
  ctx.fillText("💌 想我指数", 110, y + 56);
  ctx.fillStyle = dom.color; ctx.font = '900 64px "PingFang SC",sans-serif';
  ctx.textAlign = "right"; ctx.fillText(r.missIndex + "%", W - 100, y + 100);
  ctx.textAlign = "left";

  // 底部
  ctx.textAlign = "center";
  ctx.fillStyle = "#b09aa3"; ctx.font = '500 26px "PingFang SC",sans-serif';
  ctx.fillText("你的什么欲望最强 · 20 道题测出你的专属档案", cx, 1240);
  ctx.fillStyle = "#ff2e4d"; ctx.font = '800 30px "PingFang SC",sans-serif';
  ctx.fillText("👀 来小红书找小叭，测测你的", cx, 1285);
}

/* =========================================================================
   弹窗 / 工具
   ========================================================================= */
function openModal(sel) { $(sel).classList.add("show"); }
function closeModal(sel) { $(sel).classList.remove("show"); }
function shake(el) { el.classList.add("shake"); setTimeout(() => el.classList.remove("shake"), 400); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function fireConfetti() {
  const box = $("#confetti"); if (!box) return; box.innerHTML = "";
  const colors = ["#ff5a7e", "#f4a623", "#ff7a3d", "#8a5cf6", "#2bb7a3", "#ff2e4d"];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.4 + Math.random() * 1.2 + "s";
    c.style.animationDelay = Math.random() * 0.4 + "s";
    box.appendChild(c);
  }
}

document.addEventListener("DOMContentLoaded", init);
