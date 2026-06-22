/* =========================================================================
   你的什么欲望最强 · 逻辑 / 内容 / 配置
   ——————————————————————————————————————————————————————————————————————
   小昭你好！整份测试只有「下面这一块 CONFIG」需要你改，其它都不用动。
   ========================================================================= */

const CONFIG = {
  /* —— 1. 小红书店铺信息（务必补充）—————————————————————————— */
  SHOP_NAME: "待补充",      // 改成你的小红书店铺名，例如 "小昭的杂货铺"
  SHOP_URL: "",             // 可留空。若填了你的店铺链接，弹窗里会出现「前往店铺 →」按钮

  /* —— 2. 价格（已按你说的填好，可改）———————————————————————— */
  PRICE_NOW: "1.49",
  PRICE_OLD: "¥3",

  /* —— 3. 有效订单编号 / 解锁码（最重要）—————————————————————————
     买家在小红书下单后会拿到订单编号；你把它加到下面这个列表里，
     买家在页面输入后即可解锁完整结果。
     · 大小写不敏感，首尾空格会自动忽略。
     · 上线前请删掉演示码 "TEST-1314"。
     · 也可以用你自己的发码规则（比如统一发 "ZHAO" 开头的码）。 */
  VALID_ORDER_CODES: [
    "TEST-1314",   // ← 演示码：用它就能立刻体验解锁效果，上线前删掉
    // "你的真实订单编号1",
    // "你的真实订单编号2",
  ],

  /* —— 4. 进阶（一般不用动）———————————————————————————————————— */
  ACCEPT_ANY_LONG_NUMBER: false, // 设为 true 则“任何 8 位以上纯数字”都放行（更省事但几乎不设防，慎用）
  CONTROL_THRESHOLD: 4,          // 触发隐藏维度「控制欲」所需的选择次数（满分约 7 次机会）
};

/* =========================================================================
   维度定义
   ========================================================================= */
const DESIRES = {
  love:    { name: "爱欲",   emoji: "💗", color: "#ff5a7e" },
  thing:   { name: "物欲",   emoji: "🛍️", color: "#f4a623" },
  food:    { name: "食欲",   emoji: "🍰", color: "#ff7a3d" },
  own:     { name: "占有欲", emoji: "🔐", color: "#8a5cf6" },
  control: { name: "控制欲", emoji: "🎛️", color: "#2bb7a3" }, // 隐藏维度
};
const CORE_KEYS = ["love", "thing", "food", "own"];
const TIE_PRIORITY = ["love", "own", "food", "thing"]; // 平分时谁优先当“最强”

/* =========================================================================
   20 道题（凭直觉选最像你的那个）
   每题 4 个选项；隐藏维度 control 只悄悄出现在其中 7 题里。
   k = 该选项归属的维度
   ========================================================================= */
const QUESTIONS = [
  { q: "周末突然多放一天假，你最想拿来做什么？", o: [
    { t: "约上在意的人，腻在一起过一天", k: "love" },
    { t: "去逛街，把种草很久的东西收了", k: "thing" },
    { t: "排满美食地图，从早吃到晚", k: "food" },
    { t: "谁也不见，守着自己的小天地", k: "own" },
  ]},
  { q: "突然到账一笔奖金，你的第一反应是？", o: [
    { t: "给重要的人花，或为感情添点浪漫", k: "love" },
    { t: "下单那件一直舍不得买的好物", k: "thing" },
    { t: "订一家心心念念的餐厅", k: "food" },
    { t: "存起来、囤起来，落袋为安最踏实", k: "own" },
  ]},
  { q: "深夜睡不着，你脑子里翻来覆去的多半是……", o: [
    { t: "某一个人，和你们之间的事", k: "love" },
    { t: "购物车里还没结算的东西", k: "thing" },
    { t: "好想来一顿热乎的宵夜", k: "food" },
    { t: "我在乎的，会不会哪天就不属于我了", k: "own" },
  ]},
  { q: "旅行的时候，你最在意的是？", o: [
    { t: "和谁一起去——人对了，去哪都好", k: "love" },
    { t: "把当地限定、好看的纪念品带回家", k: "thing" },
    { t: "把当地最地道的味道吃个遍", k: "food" },
    { t: "整趟行程最好都按我的安排来", k: "control" }, // 隐藏
  ]},
  { q: "用一句话形容你的理想生活——", o: [
    { t: "身边一直有爱我、我也爱的人", k: "love" },
    { t: "想要的都买得起，物质丰盛", k: "thing" },
    { t: "顿顿都好吃，被生活喂得饱饱的", k: "food" },
    { t: "拥有的一切，都牢牢属于我", k: "own" },
  ]},
  { q: "下面这些，哪一种最让你受不了？", o: [
    { t: "被忽冷忽热、感觉不到偏爱", k: "love" },
    { t: "明明很想要，却偏偏买不起", k: "thing" },
    { t: "饿着肚子，或被迫吃难吃的东西", k: "food" },
    { t: "自己的东西被人随便碰、随便动", k: "own" },
  ]},
  { q: "收到礼物，最戳中你的是哪一种？", o: [
    { t: "看得出对方很用心、很懂我", k: "love" },
    { t: "贵重、有质感的好东西", k: "thing" },
    { t: "我馋了很久的好吃的", k: "food" },
    { t: "限量、独一份，别人没有的", k: "own" },
  ]},
  { q: "你的小红书 / 朋友圈，最常发的是？", o: [
    { t: "和某人的甜蜜日常", k: "love" },
    { t: "探店和美食九宫格", k: "food" },
    { t: "我珍藏的、独一份的宝贝", k: "own" },
    { t: "我说了算的那些事、那些安排", k: "control" }, // 隐藏
  ]},
  { q: "压力很大的时候，你会本能地去——", o: [
    { t: "报复性购物，买点东西就好了", k: "thing" },
    { t: "大吃一顿，没什么是火锅解决不了的", k: "food" },
    { t: "躲回自己的小天地，谁也别来打扰", k: "own" },
    { t: "把一切重新整理、重新掌控好", k: "control" }, // 隐藏
  ]},
  { q: "翻翻你的手机，占地方最多的是？", o: [
    { t: "和某个人的聊天与合照", k: "love" },
    { t: "购物 App 和一堆种草笔记", k: "thing" },
    { t: "美食探店和外卖记录", k: "food" },
    { t: "塞满的收藏夹和“想要”清单", k: "own" },
  ]},
  { q: "一段亲密关系里，你最怕的是？", o: [
    { t: "不被爱、被慢慢冷落", k: "love" },
    { t: "对方对我抠抠搜搜、不舍得", k: "thing" },
    { t: "连一起好好吃顿饭都做不到", k: "food" },
    { t: "TA 心里，其实还装着别人", k: "own" },
  ]},
  { q: "看到喜欢的限量款，你心里的声音是——", o: [
    { t: "好想和喜欢的人一起拥有它", k: "love" },
    { t: "买！现在就买！", k: "thing" },
    { t: "如果是联名美食就更上头了", k: "food" },
    { t: "必须是我的，不能被别人买走", k: "own" },
  ]},
  { q: "你的“快乐开关”，最接近哪一个？", o: [
    { t: "被人偏爱、被放在心上的瞬间", k: "love" },
    { t: "第一口美食入口的瞬间", k: "food" },
    { t: "把心爱之物收入囊中的那一下", k: "own" },
    { t: "把一件事完全搞定、尽在掌握", k: "control" }, // 隐藏
  ]},
  { q: "如果可以选，你更想成为哪种人？", o: [
    { t: "被很多人爱着、也很会爱的人", k: "love" },
    { t: "很有钱、很会买、很懂生活的人", k: "thing" },
    { t: "吃遍世界、人间值得的人", k: "food" },
    { t: "拥有很多、也掌控得了很多的人", k: "control" }, // 隐藏
  ]},
  { q: "失去一段重要关系后，你往往会先——", o: [
    { t: "止不住地想念那个人", k: "love" },
    { t: "疯狂购物，填一填那个空", k: "thing" },
    { t: "暴饮暴食，用吃麻痹自己", k: "food" },
    { t: "先把属于我的东西都拿回来", k: "own" },
  ]},
  { q: "你的房间 / 衣柜，更接近哪种状态？", o: [
    { t: "留着很多有回忆、有温度的东西", k: "love" },
    { t: "堆满了好看的、新入手的物件", k: "thing" },
    { t: "藏着各种零食和小吃", k: "food" },
    { t: "每样都摆得好好的，不许别人乱动", k: "own" },
  ]},
  { q: "你心里的理想约会是——", o: [
    { t: "和对的人，怎样都好、腻着就行", k: "love" },
    { t: "一起逛街，买买买", k: "thing" },
    { t: "一起把好吃的吃个遍", k: "food" },
    { t: "去一个只属于我们俩的秘密角落", k: "own" },
  ]},
  { q: "你最容易“上头”冲动的，是哪个瞬间？", o: [
    { t: "心动的时候，理智瞬间下线", k: "love" },
    { t: "看到打折、看到喜欢的东西时", k: "thing" },
    { t: "饿的时候、闻到香味的时候", k: "food" },
    { t: "感觉要失去、要失控的时候", k: "own" },
  ]},
  { q: "在别人眼里，你大概是个怎样的人？", o: [
    { t: "很需要爱，也很舍得爱别人", k: "love" },
    { t: "很懂生活、很会买的精致咖", k: "thing" },
    { t: "认定的东西就攥得死死的", k: "own" },
    { t: "凡事爱操心、爱安排的那一个", k: "control" }, // 隐藏
  ]},
  { q: "测试做到这里，你此刻最想要的是——", o: [
    { t: "一个此刻正好也在想我的人", k: "love" },
    { t: "一件犒劳自己的心仪好物", k: "thing" },
    { t: "一顿热乎、好吃的饭", k: "food" },
    { t: "把这份结果牢牢地收藏住", k: "own" },
  ]},
];

/* =========================================================================
   档案文案
   ========================================================================= */
const PROFILES = {
  love: {
    teaser: "你要的从来不是热闹，而是有一个人，眼里只有你。",
    desc: "你对“被爱”的感知力高得惊人。一句晚安、一句“在想你”，就能点亮你一整天；而忽冷忽热，也最能把你击垮。你不是缺爱，你是太懂爱的分量——所以总愿意先付出，再小心翼翼地等回应。你值得一份不用猜的偏爱。",
    traits: ["高共情", "渴望被偏爱", "容易为爱上头", "记得每个小细节"],
    miss: "你比谁都懂“想念”有多重。所以此刻屏幕这头的你，大概也悄悄地、有那么一点点……想我了吧。",
    bless: "愿你被爱的时候，能踏踏实实地相信——它是真的。",
  },
  thing: {
    teaser: "你想要的那些好东西，本质上，是想要一个被善待的自己。",
    desc: "你对“好”有近乎本能的敏感——好的质感、好的设计、好的生活。别人说你物欲强，其实你只是不肯将就。你用一件件心仪之物，把日子过成自己想要的样子，也一次次确认“我值得”。这不肤浅，这是你对生活的认真。",
    traits: ["审美在线", "精致控", "对质感敏感", "舍得为喜欢买单"],
    miss: "你最懂“一眼心仪、就挪不开眼”的感觉。说不定，你对我的小店、我的创作，也会有一点点这样的心动。",
    bless: "愿你想要的，都能体面地、不费力气地，一一拥有。",
  },
  food: {
    teaser: "你把“好好吃饭”当成头等大事——这其实是顶级的生活智慧。",
    desc: "再糟糕的一天，一口热乎好吃的就能救回来；再大的情绪，也能在一顿饭里慢慢消化。你的快乐很具体、很扎实，从不悬在半空。你懂得用味觉照顾自己，这种“对自己好一点”的本能，是很多人学一辈子都学不会的温柔。",
    traits: ["快乐很具体", "用美食疗愈", "及时行乐", "很会对自己好"],
    miss: "你最懂“惦记”的滋味——惦记一家店、一口味道。也希望我这个小测试，能成为你偶尔会惦记一下的小确幸。",
    bless: "愿你顿顿都吃得开心，被这个世界，温柔地喂饱。",
  },
  own: {
    teaser: "你认定的，就想牢牢握在手心——这背后，是深到骨子里的认真。",
    desc: "你不轻易喜欢，可一旦认定——一个人、一段关系、一样东西——就想把它完整地留在身边。你怕的不是失去本身，而是“明明那么在乎，却还是没能留住”。你的占有，是另一种形式的深情：我太在乎，所以我不想分给任何人。",
    traits: ["认定就深爱", "界限分明", "在乎到怕失去", "专一"],
    miss: "你一旦认定，就舍不得松手。如果这份结果让你有一点点“想收藏起来”的冲动——那大概，也有一点点是想我。",
    bless: "愿你想留住的，都愿意为你留下，并且同样深深地在乎你。",
  },
  control: {
    teaser: "",
    desc: "在那些没人留意的选择里，你一次次悄悄伸手，去握住了“方向盘”。你享受一切尽在掌握的安全感，受不了失控与未知。表面上你随和好说话，骨子里却清楚得很——自己要什么、要怎样。这不是霸道，而是你太想护好在乎的一切，于是宁愿自己多扛一点、多安排一点。偶尔，也试着把方向盘交出去一点点，给别人一个机会，来爱你、接住你。",
    traits: ["计划周全", "掌控感拉满", "靠谱担当", "藏着一身强势"],
    miss: "",
    bless: "",
  },
};

/* 小昭统一寄语后半段 */
const ZHAO_TAIL =
  "谢谢你愿意陪我把这 20 道题做完。能在你心里留下一点点位置，对我来说就已经很满足了。我会继续慢慢写、慢慢做，把更多有意思的小测试、小心事放进来——记得偶尔回来看看我呀。\n—— 小昭 🌷";

/* 首页价值点 */
const VALUE_POINTS = [
  { i: "🎯", t: "精准 · 5 维欲望测评", s: "20 道情境题，量化你 5 大欲望的真实强度" },
  { i: "📑", t: "专属 · 你的《欲望档案》", s: "主导欲望 + 隐藏面 + 想我指数，一份只属于你" },
  { i: "✨", t: "彩蛋 · 一个隐藏维度", s: "大多数人都测不出来的第 5 种欲望，你会触发它吗？" },
  { i: "💌", t: "治愈 · 小昭的悄悄话", s: "每一份结果里，都藏着小昭单独想对你说的一句话" },
];

/* =========================================================================
   状态
   ========================================================================= */
const LS = { unlocked: "yw_unlocked", welcomed: "yw_welcomed" };
let answers = new Array(QUESTIONS.length).fill(null); // 每题选中的 key
let cur = 0;
let lastResult = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* =========================================================================
   初始化
   ========================================================================= */
function init() {
  // 价格
  $("#priceNow").textContent = CONFIG.PRICE_NOW;
  $("#priceOld").textContent = CONFIG.PRICE_OLD;
  const save = (parseFloat(CONFIG.PRICE_OLD.replace(/[^\d.]/g, "")) - parseFloat(CONFIG.PRICE_NOW)).toFixed(2);
  $("#priceTag").textContent = isNaN(save) ? "限时折扣" : `立省 ¥${save}`;

  // 店铺名
  $("#shopNameText").textContent = CONFIG.SHOP_NAME || "待补充";
  if (CONFIG.SHOP_URL) {
    const a = $("#shopGoLink");
    a.href = CONFIG.SHOP_URL; a.hidden = false;
  }

  // 题目总数
  $("#qTotal").textContent = QUESTIONS.length;

  // 价值点
  $("#valueList").innerHTML = VALUE_POINTS.map((v) =>
    `<li><span class="vi">${v.i}</span><div><b>${v.t}</b><span class="vt">${v.s}</span></div></li>`
  ).join("");

  bindEvents();

  // 首次进入：弹出小昭的「主题抽奖通知」
  if (!localStorage.getItem(LS.welcomed) && !localStorage.getItem(LS.unlocked)) {
    setTimeout(() => openModal("#shopModal"), 650);
    localStorage.setItem(LS.welcomed, "1");
  }
}

function bindEvents() {
  $("#startBtn").addEventListener("click", startQuiz);
  $("#homeShopLink").addEventListener("click", () => openModal("#shopModal"));
  $("#quizBack").addEventListener("click", prevQuestion);
  $("#retakeBtn").addEventListener("click", retake);
  $("#shareBtn").addEventListener("click", () =>
    toast("长按 / 下拉用系统截图，把你的档案分享到小红书～ 📸"));

  $("#unlockBtn").addEventListener("click", tryUnlock);
  $("#orderInput").addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  $("#howToOrder").addEventListener("click", () => openModal("#shopModal"));

  $("#shopModalClose").addEventListener("click", () => closeModal("#shopModal"));
  $("#shopModalOk").addEventListener("click", () => {
    closeModal("#shopModal");
    if ($("#result").classList.contains("is-active")) {
      $("#orderInput").focus();
    }
  });
  $("#okModalBtn").addEventListener("click", () => {
    closeModal("#okModal");
    $("#lockedContent").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  // 点击遮罩关闭购买弹窗
  $("#shopModal").addEventListener("click", (e) => { if (e.target.id === "shopModal") closeModal("#shopModal"); });
}

/* =========================================================================
   屏幕切换
   ========================================================================= */
function show(id) {
  $$(".screen").forEach((s) => s.classList.remove("is-active"));
  $(id).classList.add("is-active");
  window.scrollTo(0, 0);
}

/* =========================================================================
   测试流程
   ========================================================================= */
function startQuiz() {
  answers = new Array(QUESTIONS.length).fill(null);
  cur = 0;
  show("#quiz");
  renderQuestion();
}

function renderQuestion() {
  const item = QUESTIONS[cur];
  $("#qDeco").textContent = "Q" + (cur + 1);
  $("#qIndex").textContent = cur + 1;
  $("#progressBar").style.width = ((cur) / QUESTIONS.length) * 100 + 5 + "%";
  $("#qTitle").textContent = item.q;

  // 打乱选项顺序，避免“位置规律”
  const opts = shuffle(item.o.slice());
  const box = $("#qOptions");
  box.innerHTML = "";
  opts.forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "opt opt-anim";
    b.style.animationDelay = i * 0.05 + "s";
    if (answers[cur] === opt.k && item.o.find(x => x.k === opt.k) === opt) b.classList.add("sel");
    b.innerHTML = `<span class="dot"></span><span>${opt.t}</span>`;
    b.addEventListener("click", () => selectOption(opt.k, b));
    box.appendChild(b);
  });
}

function selectOption(key, el) {
  answers[cur] = key;
  $$("#qOptions .opt").forEach((o) => o.classList.remove("sel"));
  el.classList.add("sel");
  setTimeout(() => {
    if (cur < QUESTIONS.length - 1) { cur++; renderQuestion(); }
    else finishQuiz();
  }, 280);
}

function prevQuestion() {
  if (cur === 0) { show("#home"); return; }
  cur--;
  renderQuestion();
}

/* =========================================================================
   计分
   ========================================================================= */
function computeResult() {
  const count = { love: 0, thing: 0, food: 0, own: 0, control: 0 };
  answers.forEach((k) => { if (k) count[k]++; });

  const corePicks = CORE_KEYS.reduce((s, k) => s + count[k], 0) || 1;
  const pct = {};
  CORE_KEYS.forEach((k) => (pct[k] = Math.round((count[k] / corePicks) * 100)));

  // 主导 / 第二（仅在 4 核心里排）
  const ranked = CORE_KEYS.slice().sort((a, b) => {
    if (count[b] !== count[a]) return count[b] - count[a];
    return TIE_PRIORITY.indexOf(a) - TIE_PRIORITY.indexOf(b);
  });
  const dominant = ranked[0];
  const second = ranked[1];

  // 隐藏维度：控制欲
  const controlUnlocked = count.control >= CONFIG.CONTROL_THRESHOLD;

  // 想我指数（治愈向小彩蛋）
  const missIndex = Math.max(66, Math.min(99,
    Math.round(64 + pct.love * 0.30 + pct.own * 0.10)));

  return { count, pct, ranked, dominant, second, controlUnlocked, missIndex };
}

function finishQuiz() {
  $("#progressBar").style.width = "100%";
  lastResult = computeResult();
  renderResult(lastResult);
  show("#result");
}

/* =========================================================================
   结果渲染
   ========================================================================= */
function renderResult(r) {
  const dom = DESIRES[r.dominant];
  const domP = PROFILES[r.dominant];

  // 钩子（免费可见）
  $("#domEmoji").textContent = dom.emoji;
  $("#domName").textContent = dom.name;
  $("#domName").style.color = dom.color;
  $("#domTeaser").textContent = domP.teaser;

  // 欲望光谱
  const bars = $("#bars");
  bars.innerHTML = r.ranked.map((k) => {
    const d = DESIRES[k];
    return `<div class="bar-row">
      <span class="bar-name">${d.emoji} ${d.name}</span>
      <span class="bar-track"><span class="bar-fill" data-w="${r.pct[k]}" style="background:${d.color}"></span></span>
      <span class="bar-val">${r.pct[k]}%</span>
    </div>`;
  }).join("");

  // 主导欲望详解
  $("#domCardH").textContent = `关于你的「${dom.name}」`;
  $("#domDesc").textContent = domP.desc;
  $("#domTraits").innerHTML = domP.traits.map((t) => `<span class="chip">${t}</span>`).join("");

  // 隐藏面：触发了控制欲 → 彩蛋；否则展示第二欲望
  const hiddenCard = $("#hiddenCard");
  if (r.controlUnlocked) {
    const c = DESIRES.control, cp = PROFILES.control;
    $("#hiddenH").innerHTML = `🔓 隐藏欲望已解锁：${c.emoji} ${c.name}`;
    $("#hiddenDesc").textContent = cp.desc;
    hiddenCard.style.display = "";
  } else {
    const s = DESIRES[r.second], sp = PROFILES[r.second];
    $("#hiddenH").innerHTML = `🫣 你的隐藏面：${s.emoji} ${s.name}`;
    $("#hiddenDesc").textContent = `在你最强欲望的背后，悄悄藏着第二种渴望——${s.name}。${sp.teaser}`;
    hiddenCard.style.display = "";
  }

  // 想我指数
  $("#missNum").textContent = r.missIndex;
  $("#missLine").textContent = domP.miss;

  // 小昭寄语
  $("#zhaoNote").textContent = `${domP.bless}\n\n${ZHAO_TAIL}`;

  // 锁状态
  applyLockState();
}

function applyLockState() {
  const unlocked = localStorage.getItem(LS.unlocked) === "1";
  const wrap = $("#lockedWrap");
  const content = $("#lockedContent");
  if (unlocked) {
    $("#result").classList.add("is-unlocked");
    content.classList.remove("is-locked");
    content.setAttribute("aria-hidden", "false");
    animateBars();
  } else {
    $("#result").classList.remove("is-unlocked");
    content.classList.add("is-locked");
    content.setAttribute("aria-hidden", "true");
  }
}

function animateBars() {
  setTimeout(() => {
    $$("#bars .bar-fill").forEach((f) => (f.style.width = f.dataset.w + "%"));
    if (lastResult) $("#missFill").style.width = lastResult.missIndex + "%";
  }, 120);
}

/* =========================================================================
   订单编号验证
   ========================================================================= */
function normalize(s) { return String(s).trim().toUpperCase().replace(/\s+/g, ""); }

function isValidCode(input) {
  const v = normalize(input);
  if (!v) return false;
  const hit = CONFIG.VALID_ORDER_CODES.some((c) => normalize(c) === v);
  if (hit) return true;
  if (CONFIG.ACCEPT_ANY_LONG_NUMBER && /^\d{8,}$/.test(v)) return true;
  return false;
}

function tryUnlock() {
  const input = $("#orderInput");
  const msg = $("#unlockMsg");
  const val = input.value;

  if (!val.trim()) {
    msg.textContent = "请先输入订单编号哦～"; msg.className = "unlock-msg err";
    shake(input); return;
  }
  if (isValidCode(val)) {
    localStorage.setItem(LS.unlocked, "1");
    msg.textContent = "验证成功！"; msg.className = "unlock-msg ok";
    openModal("#okModal");
    fireConfetti();
    setTimeout(() => applyLockState(), 200);
  } else {
    msg.textContent = "没有匹配到这个订单编号，确认一下，或看看如何获取 👇";
    msg.className = "unlock-msg err";
    shake(input);
    setTimeout(() => openModal("#shopModal"), 700);
  }
}

/* =========================================================================
   弹窗 / 工具
   ========================================================================= */
function openModal(sel) { $(sel).classList.add("show"); }
function closeModal(sel) { $(sel).classList.remove("show"); }

function retake() {
  show("#home");
}

function shake(el) { el.classList.add("shake"); setTimeout(() => el.classList.remove("shake"), 400); }

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let toastTimer = null;
function toast(text) {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = "position:fixed;left:50%;bottom:40px;transform:translateX(-50%);background:rgba(43,34,48,.92);color:#fff;padding:12px 18px;border-radius:14px;font-size:13.5px;z-index:99;max-width:300px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3);transition:opacity .3s;";
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.style.opacity = "0"), 2600);
}

function fireConfetti() {
  const box = $("#confetti");
  if (!box) return;
  box.innerHTML = "";
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
