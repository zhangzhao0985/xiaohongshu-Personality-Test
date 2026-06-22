/* =========================================================================
   测试内容 + 计分（后端专用）
   —— 放在后端，前端拿不到「选项→欲望」的映射，从根本上防止绕过/刷答案。
   —— 小叭你好：想改题目和文案，改这个文件即可。
   ========================================================================= */

const DESIRES = {
  love:  { name: "爱欲",   emoji: "💗",  color: "#ff5a7e" },
  thing: { name: "物欲",   emoji: "🛍️", color: "#f4a623" },
  food:  { name: "食欲",   emoji: "🍰",  color: "#ff7a3d" },
  own:   { name: "占有欲", emoji: "🔐",  color: "#8a5cf6" },
  peek:  { name: "窥探欲", emoji: "👀",  color: "#2bb7a3" }, // 隐藏维度（彩蛋）
};
const CORE_KEYS = ["love", "thing", "food", "own"];
const TIE_PRIORITY = ["love", "own", "food", "thing"]; // 平分时谁优先当“最强”
const PEEK_THRESHOLD = 4; // 选够这么多次「窥探欲」选项，才会解锁隐藏维度（共 6 次机会）

/* —— 20 道题：选项顺序固定（前端会自己打乱显示），k 为该选项归属维度 ——
   隐藏维度 peek 只悄悄出现在第 3/9/13/14/18/19 题（共 6 题）。 */
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
    { t: "好奇某个人此刻在干嘛、在跟谁聊天", k: "peek" }, // 隐藏
  ]},
  { q: "旅行的时候，你最在意的是？", o: [
    { t: "和谁一起去——人对了，去哪都好", k: "love" },
    { t: "把当地限定、好看的纪念品带回家", k: "thing" },
    { t: "把当地最地道的味道吃个遍", k: "food" },
    { t: "把只属于我的独家风景拍下、带走", k: "own" },
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
    { t: "刚入手的新好物", k: "thing" },
    { t: "探店和美食九宫格", k: "food" },
    { t: "我珍藏的、独一份的宝贝", k: "own" },
  ]},
  { q: "压力很大的时候，你会本能地去——", o: [
    { t: "报复性购物，买点东西就好了", k: "thing" },
    { t: "大吃一顿，没什么是火锅解决不了的", k: "food" },
    { t: "躲回自己的小天地，谁也别来打扰", k: "own" },
    { t: "去刷刷别人的动态、八卦，转移注意力", k: "peek" }, // 隐藏
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
    { t: "知道了一个别人都不知道的秘密那一下", k: "peek" }, // 隐藏
  ]},
  { q: "如果可以选，你更想成为哪种人？", o: [
    { t: "被很多人爱着、也很会爱的人", k: "love" },
    { t: "很有钱、很会买、很懂生活的人", k: "thing" },
    { t: "吃遍世界、人间值得的人", k: "food" },
    { t: "什么都知道、消息最灵通的那种人", k: "peek" }, // 隐藏
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
    { t: "感觉要失去、要失控的时候", k: "own" },
    { t: "撞见别人的秘密、八卦的时候", k: "peek" }, // 隐藏
  ]},
  { q: "在别人眼里，你大概是个怎样的人？", o: [
    { t: "很需要爱，也很舍得爱别人", k: "love" },
    { t: "很懂生活、很会买的精致咖", k: "thing" },
    { t: "认定的东西就攥得死死的", k: "own" },
    { t: "好奇心重、爱打听爱观察的那一个", k: "peek" }, // 隐藏
  ]},
  { q: "测试做到这里，你此刻最想要的是——", o: [
    { t: "一个此刻正好也在想我的人", k: "love" },
    { t: "一件犒劳自己的心仪好物", k: "thing" },
    { t: "一顿热乎、好吃的饭", k: "food" },
    { t: "把这份结果牢牢地收藏住", k: "own" },
  ]},
];

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
  // 隐藏维度
  peek: {
    teaser: "",
    desc: "在那些不动声色的选择里，你总忍不住想多看一眼别人的世界——那条没回的消息背后藏着什么、那扇关着的门后面在发生什么、屏幕另一头的人此刻在想着谁。你享受“比别人多知道一点”的隐秘快感。这不是坏，恰恰说明你对人、对关系，有着远超常人的敏感与好奇。只是偶尔也记得：有些答案，等别人愿意亲口告诉你，会更动人。",
    traits: ["好奇心爆棚", "观察力惊人", "爱抠细节", "对秘密上头"],
    miss: "",
    bless: "",
  },
};

const ZHAO_TAIL =
  "谢谢你愿意陪我把这 20 道题做完。能在你心里留下一点点位置，对我来说就已经很满足了。我会继续慢慢写、慢慢做，把更多有意思的小测试、小心事放进来——记得偶尔回来看看我呀。\n—— 小叭 🌷";

/* —— 给前端的题目（剥掉 k，只给 id 和文案）—— */
function getClientQuiz() {
  return {
    total: QUESTIONS.length,
    questions: QUESTIONS.map((item, qi) => ({
      id: qi,
      q: item.q,
      options: item.o.map((opt, oi) => ({ id: `${qi}-${oi}`, t: opt.t })),
    })),
  };
}

/* —— 计分：传入每题选中的 optionId 数组，后端算出完整结果 —— */
function computeResult(answerIds) {
  if (!Array.isArray(answerIds) || answerIds.length !== QUESTIONS.length) {
    throw new Error("答案数量不正确");
  }
  const seen = new Set();
  const count = { love: 0, thing: 0, food: 0, own: 0, peek: 0 };

  answerIds.forEach((id) => {
    const m = /^(\d+)-(\d+)$/.exec(String(id));
    if (!m) throw new Error("答案格式不正确");
    const qi = +m[1], oi = +m[2];
    if (qi < 0 || qi >= QUESTIONS.length) throw new Error("题号越界");
    if (seen.has(qi)) throw new Error("同一题被重复作答");
    seen.add(qi);
    const opt = QUESTIONS[qi].o[oi];
    if (!opt) throw new Error("选项不存在");
    count[opt.k]++;
  });
  if (seen.size !== QUESTIONS.length) throw new Error("有题目未作答");

  const corePicks = CORE_KEYS.reduce((s, k) => s + count[k], 0) || 1;
  const pct = {};
  CORE_KEYS.forEach((k) => (pct[k] = Math.round((count[k] / corePicks) * 100)));

  const ranked = CORE_KEYS.slice().sort((a, b) =>
    count[b] !== count[a] ? count[b] - count[a]
      : TIE_PRIORITY.indexOf(a) - TIE_PRIORITY.indexOf(b));
  const dominant = ranked[0];
  const second = ranked[1];
  const peekUnlocked = count.peek >= PEEK_THRESHOLD;
  const missIndex = Math.max(66, Math.min(99,
    Math.round(64 + pct.love * 0.30 + pct.own * 0.10)));

  const meta = (k) => ({ key: k, name: DESIRES[k].name, emoji: DESIRES[k].emoji, color: DESIRES[k].color });
  const domP = PROFILES[dominant];

  const hidden = peekUnlocked
    ? {
        kind: "peek",
        title: `🔓 隐藏欲望已解锁：${DESIRES.peek.emoji} ${DESIRES.peek.name}`,
        desc: PROFILES.peek.desc,
        traits: PROFILES.peek.traits,
      }
    : {
        kind: "second",
        title: `🫣 你的隐藏面：${DESIRES[second].emoji} ${DESIRES[second].name}`,
        desc: `在你最强欲望的背后，悄悄藏着第二种渴望——${DESIRES[second].name}。${PROFILES[second].teaser}`,
        traits: [],
      };

  return {
    dominant: { ...meta(dominant), teaser: domP.teaser, desc: domP.desc, traits: domP.traits },
    spectrum: ranked.map((k) => ({ ...meta(k), pct: pct[k] })),
    hidden,
    missIndex,
    missLine: domP.miss,
    zhaoNote: `${domP.bless}\n\n${ZHAO_TAIL}`,
  };
}

module.exports = { getClientQuiz, computeResult, QUESTIONS, DESIRES, CORE_KEYS, PEEK_THRESHOLD };
