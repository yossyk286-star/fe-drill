(() => {
  "use strict";

  const Q = window.QUESTIONS;
  const BY_ID = Object.fromEntries(Q.map((q) => [q.id, q]));
  const KANA = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ"];
  const KEY = "fe-drill-v1";
  const EXAM_LEN = 60;
  const EXAM_MIN = 90;
  // 科目B 模擬試験：本番と同じ 20問(アルゴリズム16・セキュリティ4)・100分
  const B_EXAM = { "アルゴリズムとプログラミング": 16, "情報セキュリティ(科目B)": 4 };
  const B_EXAM_MIN = 100;
  const MASTER_STREAK = 2;
  const PASS = 0.6;
  const A_IDS = Q.filter((q) => q.part !== "B").map((q) => q.id);
  const B_IDS = Q.filter((q) => q.part === "B").map((q) => q.id);
  const GROUPS = window.CATEGORIES.concat(window.CATEGORIES_B || []);
  // 科目A 60問の分野別の出題数(公表されている目安)
  const EXAM_MIX = { "テクノロジ": 41, "マネジメント": 7, "ストラテジ": 12 };
  // 正解が続くたびに広げる復習間隔(日)
  const INTERVALS = [1, 3, 7, 14, 30];
  const DUE_MAX = 30;
  const GOALS = [10, 20, 30, 50, 80];
  const FORMULAS = window.FORMULAS || [];
  const SETS = window.IPA_SETS || [];
  const idsOfSet = (sid) => Q.filter((q) => q.set === sid).sort((x, y) => x.no - y.no).map((q) => q.id);
  const ORIG_COUNT = Q.filter((q) => !q.set).length;
  const CONF = [["sure", "自信あり"], ["maybe", "たぶん"], ["guess", "勘"]];
  const REASONS = [["know", "知らなかった"], ["confuse", "勘違い"], ["calc", "計算ミス"], ["read", "読み違い"]];

  // ---------- アイコン ----------
  const svg = (d, extra = "") => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
  const I = {
    home: svg('<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>'),
    grid: svg('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
    book: svg('<path d="M12 6.5C10 5 7 4.5 3.5 4.5v14c3.5 0 6.5.5 8.5 2 2-1.5 5-2 8.5-2v-14C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v14"/>'),
    chart: svg('<path d="M3.5 20.5h17"/><path d="M6.5 17v-6"/><path d="M12 17V6"/><path d="M17.5 17v-9"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    flag: svg('<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    bolt: svg('<path d="M13 2.5 4.5 14h7l-1 7.5 8.5-11.5h-7z"/>'),
    redo: svg('<path d="M4 12a8 8 0 0 1 14.2-5"/><path d="M19 3v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-14.2 5"/><path d="M5 21v-4.5h4.5"/>'),
    timer: svg('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4.5l3 2"/><path d="M9.5 2.5h5"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
    fire: svg('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.6-8.3.4 1.6 1.4 2.6 2.4 3.2C12 6.4 13.4 4 15.5 2.5c-.2 2.8 3 5.7 3 10.3 0 4.6-2.6 8.2-6.5 8.2z"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    code: svg('<path d="m8 8-4.5 4L8 16"/><path d="m16 8 4.5 4L16 16"/><path d="m13.5 5-3 14"/>'),
    calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    cards: svg('<rect x="3.5" y="6.5" width="13" height="14" rx="2"/><path d="M8 3.5h10.5a2 2 0 0 1 2 2V17"/>'),
    copy: svg('<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>'),
    download: svg('<path d="M12 3.5v12M7 11l5 5 5-5"/><path d="M4 20.5h16"/>'),
    upload: svg('<path d="M12 16V4M7 8.5l5-5 5 5"/><path d="M4 20.5h16"/>'),
    up: svg('<path d="m6 15 6-6 6 6"/>'),
    formula: svg('<path d="M4 6.5h7M7.5 3v7"/><path d="M13.5 6.5h6.5"/><path d="m4.5 14.5 6 6M10.5 14.5l-6 6"/><path d="M14 16h6M14 19.5h6"/>'),
    eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    swap: svg('<path d="M4 8h14l-3.5-3.5"/><path d="M20 16H6l3.5 3.5"/>'),
  };

  // ---------- 用語 ----------
  const G = window.GLOSSARY || [];
  const TERM = {};
  const BY_T = Object.fromEntries(G.map((g) => [g.t, g]));
  G.forEach((g) => { [g.t].concat(g.al || []).forEach((k) => { TERM[k] = g; }); });
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const TERM_RE = new RegExp(Object.keys(TERM).sort((a, b) => b.length - a.length).map(reEsc).join("|"), "g");
  // 英字の用語が、もっと長い英単語の一部(CROSS の中の OS など)に当たったものは無視する
  const glued = (text, m, at) => /[A-Za-z]/.test(m[0]) && /[A-Za-z]/.test(text[at - 1] || "") ||
    /[A-Za-z]/.test(m[m.length - 1]) && /[A-Za-z]/.test(text[at + m.length] || "");
  // 本文の用語に印を付ける。used に入っている用語は二度目以降は付けない
  function linkify(text, used, skip) {
    text = String(text);
    let out = "", last = 0;
    text.replace(TERM_RE, (m, at) => {
      const g = TERM[m];
      out += esc(text.slice(last, at));
      if (g === skip || glued(text, m, at) || (used && used.has(g.t))) out += esc(m);
      else {
        if (used) used.add(g.t);
        out += `<span class="term" role="button" tabindex="0" data-term="${esc(g.t)}">${esc(m)}</span>`;
      }
      last = at + m.length;
      return m;
    });
    return out + esc(text.slice(last));
  }
  function termsIn(texts) {
    const found = new Set();
    texts.forEach((t) => {
      t = String(t);
      t.replace(TERM_RE, (m, at) => { if (!glued(t, m, at)) found.add(TERM[m].t); return m; });
    });
    return Array.from(found);
  }

  // ---------- 保存 ----------
  const blank = () => ({ st: {}, fl: {}, days: {}, known: {}, mist: {}, set: { skip: false, goal: 20, exam: "", conf: true, hide: true } });
  let store = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const d = JSON.parse(raw);
      return { ...blank(), ...d, set: { ...blank().set, ...(d.set || {}) }, days: d.days || {}, known: d.known || {}, mist: d.mist || {} };
    } catch (e) {
      return blank();
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 保存できない環境でも動かす */ }
  }

  // ---------- 日付 ----------
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const todayCount = () => store.days[dayKey()] || 0;
  function streakDays() {
    let n = 0;
    let i = todayCount() ? 0 : 1; // 今日まだ解いていなくても、昨日まで続いていれば途切れていない
    while (store.days[dayKey(daysAgo(i))]) { n += 1; i += 1; }
    return n;
  }

  function daysLeft() {
    if (!store.set.exam) return null;
    const exam = new Date(store.set.exam + "T00:00:00");
    if (isNaN(exam)) return null;
    return Math.round((exam - new Date(dayKey() + "T00:00:00")) / 86400000);
  }

  // ---------- 集計 ----------
  const stat = (id) => store.st[id] || { n: 0, ok: 0, streak: 0, last: null };
  const mastered = (id) => stat(id).streak >= MASTER_STREAK;
  // level: "sure" 自信あり / "maybe" たぶん / "guess" 勘 / undefined(模試など、選ばないとき)
  function record(id, correct, level) {
    const s = { ...stat(id) };
    s.n += 1;
    const lucky = correct && level === "guess";
    if (correct) s.ok += 1;
    // 勘で当たったものは「覚えていない」とみなし、連続正解を0に戻して翌日にまた出す
    if (correct && !lucky) s.streak += 1; else s.streak = 0;
    s.last = lucky ? "guess" : correct;
    s.conf = level || null;
    // 間隔反復：正解が続くほど次に出す日を先にし、間違えたら翌日に出す。「たぶん」は最長3日
    s.iv = correct && !lucky ? INTERVALS[Math.min(s.streak - 1, INTERVALS.length - 1)] : 1;
    if (correct && level === "maybe") s.iv = Math.min(s.iv, 3);
    s.due = dayKey(daysAgo(-s.iv));
    store.st[id] = s;
    const k = dayKey();
    store.days[k] = (store.days[k] || 0) + 1;
  }
  function totals(ids = Q.map((q) => q.id)) {
    let n = 0, ok = 0, seen = 0, mast = 0;
    ids.forEach((id) => {
      const s = stat(id);
      n += s.n; ok += s.ok;
      if (s.n) seen += 1;
      if (s.streak >= MASTER_STREAK) mast += 1;
    });
    return { n, ok, seen, mast, rate: n ? ok / n : null, total: ids.length };
  }
  const idsOfCat = (c) => Q.filter((q) => q.cat === c).map((q) => q.id);
  const idsOfField = (f) => Q.filter((q) => f.cats.includes(q.cat)).map((q) => q.id);
  const wrongIds = () => Q.filter((q) => stat(q.id).last === false || stat(q.id).last === "guess").map((q) => q.id);
  const flagIds = () => Q.filter((q) => store.fl[q.id]).map((q) => q.id);
  const dueIds = () => {
    const today = dayKey();
    return Q.filter((q) => { const s = stat(q.id); return s.due && s.due <= today; })
      .sort((x, y) => (stat(x.id).due < stat(y.id).due ? -1 : 1)).map((q) => q.id);
  };
  function weakest() {
    let best = null;
    GROUPS.forEach((f) => f.cats.forEach((c) => {
      const t = totals(idsOfCat(c));
      if (t.n >= 3 && t.rate < PASS && (!best || t.rate < best.rate)) best = { cat: c, rate: t.rate };
    }));
    return best;
  }

  // ---------- 画面状態 ----------
  let screen = "home"; // home / cats / words / stats / quiz / result
  let tab = "home";
  let session = null;
  let confirmReset = false;
  let timerId = null;
  let wordQuery = "";
  let wordMode = "list";
  let deck = [], di = 0, flipped = false, cardsAll = false, cardDir = "fwd";
  let backupOpen = false, backupMsg = "";
  let canDownload = false;
  try { canDownload = window.top === window; } catch (e) { canDownload = false; }

  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }
  const pool = (ids) => (store.set.skip ? ids.filter((id) => !mastered(id)) : ids);

  // オリジナル問題は選択肢の並びを毎回入れ替える(正解の位置を覚えてしまわないように)。
  // IPA の過去問題は公式の並びのまま出す
  function makeSession(title, ids, exam, minutes = EXAM_MIN) {
    const order = {};
    ids.forEach((id) => {
      const idx = BY_ID[id].c.map((_, i) => i);
      order[id] = BY_ID[id].src === "オリジナル" ? shuffle(idx) : idx;
    });
    return { title, ids, order, i: 0, answers: {}, exam, minutes, review: false, graded: !exam, startedAt: Date.now(), endedAt: null,
      revealed: {}, pending: {}, conf: {}, reason: {}, similar: {} };
  }
  const orderOf = (id) => (session.order && session.order[id]) || BY_ID[id].c.map((_, i) => i);

  function begin(title, ids, exam = false, minutes = EXAM_MIN) {
    if (!ids.length) return;
    session = makeSession(title, ids, exam, minutes);
    go("quiz");
  }
  function start(kind, arg) {
    if (kind === "random") begin("今日の10問", shuffle(pool(A_IDS)).slice(0, 10));
    else if (kind === "due") begin("今日の復習", dueIds().slice(0, DUE_MAX));
    else if (kind === "b") begin("科目B", shuffle(pool(B_IDS)));
    else if (kind === "set") {
      const st = SETS.find((x) => x.id === arg);
      begin(`${st.label} 過去問`, idsOfSet(arg));
    }
    else if (kind === "setExam") {
      const st = SETS.find((x) => x.id === arg);
      begin(`${st.label} 本番形式`, idsOfSet(arg), true, st.minutes);
    }
    else if (kind === "wrong") begin("苦手を復習", shuffle(wrongIds()));
    else if (kind === "flag") begin("チェックした問題", shuffle(flagIds()));
    else if (kind === "examB") {
      const ids = [];
      Object.entries(B_EXAM).forEach(([c, n]) => { ids.push(...shuffle(idsOfCat(c)).slice(0, n)); });
      begin("科目B 模擬試験", shuffle(ids), true, B_EXAM_MIN);
    }
    else if (kind === "exam") {
      const ids = [];
      window.CATEGORIES.forEach((f) => { ids.push(...shuffle(idsOfField(f)).slice(0, EXAM_MIX[f.field] || 0)); });
      begin("模擬試験", shuffle(ids), true);
    }
    else if (kind === "cat") begin(arg, shuffle(pool(idsOfCat(arg))));
    else if (kind === "field") {
      const f = GROUPS.find((x) => x.field === arg);
      begin(arg, shuffle(pool(idsOfField(f))));
    }
  }

  function go(next) {
    screen = next;
    if (["home", "cats", "words", "stats"].includes(next)) tab = next;
    render();
    window.scrollTo(0, 0);
  }

  // pos は画面上の位置(ア=0〜エ=3)。記録は元データの選択肢番号で残す
  function answer(pos) {
    const id = session.ids[session.i];
    if (session.review) return;
    const choice = orderOf(id)[pos];
    if (choice === undefined) return;
    if (session.exam) {
      session.answers[id] = choice;
      render();
      return;
    }
    if (id in session.answers || choice === undefined) return;
    // 自信を選ぶ設定なら、まず選択肢に印を付けて、自信のタップで確定する
    if (store.set.conf) {
      session.pending[id] = choice;
      render();
      return;
    }
    finalize(choice);
  }
  function finalize(choice, level) {
    const id = session.ids[session.i];
    if (id in session.answers) return;
    session.answers[id] = choice;
    if (level) session.conf[id] = level;
    delete session.pending[id];
    const ok = choice === BY_ID[id].a;
    record(id, ok, level);
    if (!ok || level === "guess") addSimilar(id);
    save();
    try { navigator.vibrate && navigator.vibrate(ok ? 12 : [18, 50, 18]); } catch (e) { /* 振動できない端末 */ }
    render();
  }
  // 間違えた(勘で当たった)問題の次に、同じ分野で用語がよく重なる問題を1問差し込む
  function addSimilar(id) {
    if (session.exam || session.review || session.similar[id]) return;
    const q = BY_ID[id];
    const mine = new Set(termsIn([q.q, ...q.c, q.ex]));
    const inSession = new Set(session.ids);
    const cands = Q.filter((x) => x.cat === q.cat && !inSession.has(x.id));
    if (!cands.length) return;
    let best = [], bestScore = -1;
    cands.forEach((x) => {
      const score = termsIn([x.q, ...x.c, x.ex]).filter((t) => mine.has(t)).length;
      if (score > bestScore) { bestScore = score; best = [x]; } else if (score === bestScore) best.push(x);
    });
    const pick = best[Math.floor(Math.random() * best.length)];
    session.ids.splice(session.i + 1, 0, pick.id);
    const idx = pick.c.map((_, i) => i);
    session.order[pick.id] = pick.src === "オリジナル" ? shuffle(idx) : idx;
    session.similar[id] = pick.id;
  }
  function setReason(id, r) {
    const prev = session.reason[id];
    if (prev) store.mist[prev] = Math.max(0, (store.mist[prev] || 0) - 1);
    if (prev === r) { delete session.reason[id]; }
    else { session.reason[id] = r; store.mist[r] = (store.mist[r] || 0) + 1; }
    const s = { ...stat(id) };
    s.reason = session.reason[id] || null;
    store.st[id] = s;
    save();
    render();
  }

  function next() {
    if (session.i < session.ids.length - 1) {
      session.i += 1;
      render();
      window.scrollTo(0, 0);
    } else if (session.review) {
      session.review = false; go("result");
    } else if (session.exam) {
      grade();
    } else {
      session.endedAt = Date.now();
      go("result");
    }
  }
  function prev() {
    if (session.i > 0) { session.i -= 1; render(); window.scrollTo(0, 0); }
  }
  function grade() {
    session.ids.forEach((id) => record(id, id in session.answers && session.answers[id] === BY_ID[id].a));
    session.graded = true;
    session.endedAt = Date.now();
    save();
    go("result");
  }
  function quit() {
    if (session && !session.exam && !session.review && Object.keys(session.answers).length) {
      session.ids = session.ids.filter((id) => id in session.answers);
      session.endedAt = Date.now();
      go("result");
    } else if (session && session.review) {
      session.review = false; go("result");
    } else {
      session = null; go(tab);
    }
  }

  // ---------- 描画の部品 ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (r) => (r == null ? "—" : Math.round(r * 100) + "%");
  const app = document.getElementById("app");

  function ring(value, size, label, sub) {
    const r = 42, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value || 0));
    return `<div class="ring" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-bg" cx="50" cy="50" r="${r}"/>
      ${v > 0 ? `<circle class="ring-fg" cx="50" cy="50" r="${r}" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/>` : ""}</svg>
      <div class="ring-in"><b>${label}</b>${sub ? `<span>${sub}</span>` : ""}</div></div>`;
  }

  function tabbar() {
    const items = [["home", "ホーム", I.home], ["cats", "分野", I.grid], ["words", "用語", I.book], ["stats", "成績", I.chart]];
    return `<nav class="tabbar" aria-label="メニュー">${items.map(([k, l, ic]) =>
      `<button data-act="tab" data-tab="${k}" ${tab === k ? 'aria-current="page"' : ""}>${ic}<span>${l}</span></button>`).join("")}</nav>`;
  }

  function render() {
    clearInterval(timerId);
    const views = { home, cats, words, stats, quiz, result };
    const tabbed = ["home", "cats", "words", "stats"].includes(screen);
    app.className = tabbed ? "has-tabs" : "";
    app.innerHTML = views[screen]() + (tabbed ? tabbar() : "");
    if (screen === "quiz" && session.exam && !session.graded) {
      tick();
      timerId = setInterval(tick, 1000);
    }
  }

  // ---------- ホーム ----------
  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? "夜ふかし中" : h < 11 ? "おはようございます" : h < 18 ? "こんにちは" : "こんばんは";
  }
  function home() {
    const t = totals();
    const w = wrongIds().length, f = flagIds().length, due = dueIds().length;
    const today = todayCount(), streak = streakDays(), goal = store.set.goal;
    const d = new Date();
    const weak = weakest();
    const left = daysLeft();
    const goalMet = today >= goal;
    const tile = (attrs, icon, title, sub, count, disabled) =>
      `<button class="tile" ${attrs} ${disabled ? "disabled" : ""}>
        <span class="tile-icon">${icon}</span><strong>${title}</strong><span class="tile-sub">${sub}</span>${count != null && !/^0問/.test(count) ? `<em>${count}</em>` : ""}</button>`;
    const cta = due
      ? `<button class="cta" data-act="start" data-kind="due">
          <span class="cta-icon">${I.redo}</span>
          <span class="cta-text"><strong>今日の復習 ${Math.min(due, DUE_MAX)}問</strong><span>忘れかけた頃の問題をもう一度</span></span>
          <span class="cta-go">${I.arrow}</span></button>
         <button class="row-btn" data-act="start" data-kind="random">${I.bolt}<span>新しく10問解く</span>${I.arrow}</button>`
      : `<button class="cta" data-act="start" data-kind="random">
          <span class="cta-icon">${I.bolt}</span>
          <span class="cta-text"><strong>今日の10問</strong><span>科目Aの全分野からランダム・解説付き</span></span>
          <span class="cta-go">${I.arrow}</span></button>`;
    return `<header class="appbar"><p class="eyebrow">${greeting()}・${d.getMonth() + 1}月${d.getDate()}日</p><h1>FEドリル</h1></header>
    <main class="page">
      <section class="hero" aria-label="学習状況">
        ${ring(t.mast / t.total, 112, t.n ? pct(t.mast / t.total) : "—", "習得")}
        <div class="hero-stats">
          <div><b>${t.seen}<small>/${t.total}</small></b><span>解いた問題</span></div>
          <div><b>${pct(t.rate)}</b><span>正答率</span></div>
          <div class="pills">
            <span class="pill ${goalMet ? "done" : ""}">${I.check}今日 ${today}/${goal}問</span>
            <span class="pill ${streak ? "hot" : ""}">${I.fire}${streak}日連続</span>
            ${left != null ? `<span class="pill ${left <= 14 && left >= 0 ? "soon" : ""}">${I.calendar}${left > 0 ? `試験まで${left}日` : left === 0 ? "今日が試験日" : "試験日を過ぎました"}</span>` : ""}
          </div>
        </div>
        <div class="goal-bar" aria-label="今日の目標 ${today}/${goal}問"><i style="width:${Math.min(1, today / goal) * 100}%"></i></div>
      </section>

      ${cta}

      <div class="tiles">
        ${tile('data-act="start" data-kind="wrong"', I.redo, "苦手を復習", "直近で間違えた問題", `${w}問`, !w)}
        ${tile('data-act="start" data-kind="flag"', I.flag, "チェック", "印をつけた問題", `${f}問`, !f)}
        ${tile('data-act="start" data-kind="exam"', I.timer, "模擬試験", `科目A ${EXAM_LEN}問・${EXAM_MIN}分`, null, false)}
        ${tile('data-act="start" data-kind="b"', I.code, "科目B", "擬似言語・セキュリティ(模試は分野タブ)", `${B_IDS.length}問`, false)}
      </div>

      ${SETS.length ? `<button class="row-btn" data-act="tab" data-tab="cats">${I.book}<span>IPA過去問 ${SETS.length}回分(${SETS.reduce((a, x) => a + x.count, 0)}問)・本番形式も</span>${I.arrow}</button>` : ""}
      ${weak ? `<button class="notice" data-act="start" data-kind="cat" data-arg="${esc(weak.cat)}">
        <span><small>いちばん苦手な分野</small><strong>${esc(weak.cat)}</strong></span><span class="notice-rate">${pct(weak.rate)}</span>${I.arrow}</button>` : ""}
      ${left == null ? `<button class="row-btn subtle" data-act="tab" data-tab="stats">${I.calendar}<span>試験日を設定すると、あと何日かが出ます</span>${I.arrow}</button>` : ""}

      <p class="foot">科目A ${A_IDS.length}問・科目B ${B_IDS.length}問(うちIPA過去問・公開問題 ${Q.length - ORIG_COUNT}問)。過去問以外はFEドリルのオリジナル問題です。記録はこの端末に保存されます。</p>
    </main>`;
  }

  // ---------- 分野 ----------
  function cats() {
    const groups = GROUPS.map((f) => {
      const ft = totals(idsOfField(f));
      const rows = f.cats.map((c) => {
        const t = totals(idsOfCat(c));
        const left = pool(idsOfCat(c)).length;
        return `<button class="row" data-act="start" data-kind="cat" data-arg="${esc(c)}" ${left ? "" : "disabled"}>
          <span class="row-main"><strong>${esc(c)}</strong>
            <span class="row-sub">${t.n ? `${t.mast}/${t.total}問 習得・正答率 ${pct(t.rate)}` : `${t.total}問・まだ解いていません`}</span>
            <span class="bar"><i style="width:${(t.mast / t.total) * 100}%"></i></span></span>
          <span class="row-go">${I.arrow}</span></button>`;
      }).join("");
      return `<section class="group"><div class="group-head"><h2>${f.field}<small>${ft.mast ? `${ft.mast}/${ft.total}` : `${ft.total}問`}</small></h2>
        <span class="head-btns">${f.field === "科目B" ? `<button class="text-btn" data-act="start" data-kind="examB">模試 20問・${B_EXAM_MIN}分</button>` : ""}<button class="text-btn" data-act="start" data-kind="field" data-arg="${esc(f.field)}">まとめて解く</button></span></div>
        <div class="list">${rows}</div></section>`;
    }).join("");
    const past = SETS.length ? `<section class="group"><div class="group-head"><h2>IPA 過去問<small>${SETS.reduce((a, x) => a + x.count, 0)}問</small></h2></div>
      <div class="list">${SETS.map((st) => {
        const t = totals(idsOfSet(st.id));
        return `<div class="set-row">
          <button class="row" data-act="start" data-kind="set" data-arg="${esc(st.id)}">
            <span class="row-main"><strong>${esc(st.label)}</strong>
              <span class="row-sub">${t.n ? `${t.seen}/${t.total}問 解いた・正答率 ${pct(t.rate)}` : `${t.total}問・問1から順に解説付きで`}</span>
              <span class="bar"><i style="width:${(t.seen / t.total) * 100}%"></i></span></span>
            <span class="row-go">${I.arrow}</span></button>
          <button class="set-exam" data-act="start" data-kind="setExam" data-arg="${esc(st.id)}">${I.timer}本番形式で解く(${st.count}問・${st.minutes}分)</button>
        </div>`;
      }).join("")}</div>
      <p class="foot">出典：IPA 基本情報技術者試験 過去問題・公開問題。正解は IPA 公表の解答例、解説は FEドリルのオリジナルです。</p></section>` : "";
    return `<header class="appbar"><h1>分野</h1></header>
    <main class="page">${store.set.skip ? `<p class="hint">習得済みの問題は出題しない設定です(成績タブで変更)。</p>` : ""}${past}${groups}</main>`;
  }

  // ---------- 用語 ----------
  function wordList() {
    const q = wordQuery.trim().toLowerCase();
    const hit = G.filter((g) => !q || [g.t, g.r || "", (g.al || []).join(" "), g.d].join(" ").toLowerCase().includes(q));
    if (!hit.length) return `<p class="empty">「${esc(wordQuery)}」に当てはまる用語はありません。</p>`;
    return hit.map((g) => `<button class="row word" data-term="${esc(g.t)}"><span class="row-main"><strong>${esc(g.t)}${store.known[g.t] ? `<span class="known">${I.check}覚えた</span>` : ""}</strong>${g.al ? `<small>${esc(g.al.join("・"))}</small>` : ""}<span class="row-sub clamp">${esc(g.d)}</span></span></button>`).join("");
  }
  function buildDeck() {
    deck = shuffle(G.filter((g) => cardsAll || !store.known[g.t]).map((g) => g.t));
    // 逆向きのときは、説明の中に用語そのものが出てこないカードだけにする(答えが見えてしまうため)
    if (cardDir === "rev") deck = deck.filter((t) => maskTerm(BY_T[t]) !== null);
    di = 0;
    flipped = false;
  }
  // 説明文の中の用語名・別名を伏せ字にする。伏せても答えが分かってしまう場合は null
  function maskTerm(g) {
    let d = g.d;
    [g.t].concat(g.al || []).sort((a, b) => b.length - a.length).forEach((k) => {
      d = d.split(k).join("〇〇");
    });
    return d.replace(/〇〇/g, "").trim().length < 8 ? null : d;
  }
  function cardView() {
    const known = G.filter((g) => store.known[g.t]).length;
    const head = `<div class="card-meta"><span>覚えた ${known}/${G.length}語</span>
      <button class="dir-btn" data-act="card-dir">${I.swap}${cardDir === "fwd" ? "用語→意味" : "意味→用語"}</button>
      <label class="mini-toggle" for="cards-all"><input type="checkbox" id="cards-all" class="switch small" data-act="cards-all" ${cardsAll ? "checked" : ""}>覚えた語も出す</label></div>`;
    if (di >= deck.length) {
      return `${head}<section class="card done-card">
        ${ring(known / G.length, 120, pct(known / G.length), "覚えた")}
        <h2>${deck.length ? "このセットは終わりです" : "出せるカードがありません"}</h2>
        <p>${deck.length ? "「まだ」にしたカードは、次のセットでまた出てきます。" : "すべて覚えました。「覚えた語も出す」をオンにすると、全部をもう一度確認できます。"}</p>
        <button class="btn primary" data-act="cards-restart">${I.redo}もう一度</button></section>`;
    }
    const g = BY_T[deck[di]];
    return `${head}
      <div class="flash-wrap">
        <button class="flash ${flipped ? "flipped" : ""}" id="flash" data-act="card-flip" aria-label="${flipped ? "用語に戻す" : "意味を見る"}">
          ${cardDir === "fwd"
            ? `<span class="face front"><small>${di + 1} / ${deck.length}</small><strong>${esc(g.t)}</strong>${g.r ? `<span class="yomi">${esc(g.r)}</span>` : ""}<span class="tap">タップで意味を見る</span></span>
               <span class="face back"><small>${esc(g.t)}</small><span class="def">${esc(g.d)}</span>${g.al ? `<span class="yomi">別名・略称：${esc(g.al.join("、"))}</span>` : ""}</span>`
            : `<span class="face front rev"><small>${di + 1} / ${deck.length}</small><span class="q-label">この用語は？</span><span class="def">${esc(maskTerm(g))}</span><span class="tap">タップで答えを見る</span></span>
               <span class="face back"><small>答え</small><strong class="answer-term">${esc(g.t)}</strong>${g.r ? `<span class="yomi">${esc(g.r)}</span>` : ""}${g.al ? `<span class="yomi">別名・略称：${esc(g.al.join("、"))}</span>` : ""}</span>`}
        </button>
      </div>
      <div class="btns card-btns">
        <button class="btn again" data-act="card-again">${I.close}まだ</button>
        <button class="btn know" data-act="card-know">${I.check}覚えた</button>
      </div>
      <p class="foot center">左右にスワイプしても答えられます(右で覚えた・左でまだ)</p>`;
  }
  function formulaView() {
    return GROUPS.map((grp) => {
      const fs = FORMULAS.filter((f) => grp.cats.includes(f.cats[0]));
      if (!fs.length) return "";
      return `<section class="group"><div class="group-head"><h2>${grp.field}<small>${fs.length}</small></h2></div><div class="fcards">${fs.map(formulaCard).join("")}</div></section>`;
    }).join("");
  }
  function words() {
    const seg = `<div class="seg" role="tablist">
      <button role="tab" aria-selected="${wordMode === "list"}" data-act="wmode" data-mode="list">${I.search}一覧</button>
      <button role="tab" aria-selected="${wordMode === "cards"}" data-act="wmode" data-mode="cards">${I.cards}カード</button>
      <button role="tab" aria-selected="${wordMode === "formulas"}" data-act="wmode" data-mode="formulas">${I.formula}公式</button></div>`;
    return `<header class="appbar"><h1>用語・公式</h1><p class="eyebrow">用語${G.length}語・公式と覚え方${FORMULAS.length}件</p></header>
    <main class="page">${seg}
      ${wordMode === "list"
        ? `<label class="search">${I.search}<input id="word-search" type="search" placeholder="用語・略語・読みで検索" value="${esc(wordQuery)}" autocomplete="off"></label>
           <div class="list" id="word-list">${wordList()}</div>`
        : wordMode === "cards" ? cardView() : formulaView()}
    </main>`;
  }

  // ---------- 成績 ----------
  function backupText() {
    return JSON.stringify({ app: "fe-drill", v: 1, at: new Date().toISOString(), data: store });
  }
  function restoreFrom(text) {
    let obj;
    try { obj = JSON.parse(String(text).trim()); } catch (e) { obj = null; }
    if (!obj || obj.app !== "fe-drill" || !obj.data || typeof obj.data.st !== "object") {
      backupMsg = "読み込めませんでした。FEドリルで書き出した記録を、そのまま全部貼り付けてください。";
      render();
      return;
    }
    const d = obj.data;
    store = { ...blank(), ...d, set: { ...blank().set, ...(d.set || {}) }, days: d.days || {}, known: d.known || {}, fl: d.fl || {}, mist: d.mist || {} };
    save();
    backupMsg = `復元しました(${Object.keys(store.st).length}問分の記録)。`;
    render();
  }
  function mistakes() {
    const lucky = Q.filter((q) => stat(q.id).last === "guess").length;
    const rows = REASONS.map(([k, l]) => [l, store.mist[k] || 0]);
    const total = rows.reduce((a, [, n]) => a + n, 0);
    if (!total && !lucky) return "";
    const max = Math.max(1, ...rows.map(([, n]) => n));
    const top = rows.slice().sort((a, b) => b[1] - a[1])[0];
    const advice = { "知らなかった": "用語カードと公式まとめで、知識を先に入れましょう。", "勘違い": "似た用語の違い(例：差分と増分)を、解説の選択肢ごとの説明で確認しましょう。", "計算ミス": "単位(ビットとバイトなど)をそろえてから計算する習慣を。公式まとめの例も確認を。", "読み違い": "「適切でないもの」「最も」など、問題文の条件に印をつけて読みましょう。" };
    return `<section class="group"><div class="group-head"><h2>ミスの傾向<small>${total}回</small></h2></div>
      <div class="card">${rows.map(([l, n]) => `<div class="srow"><span class="srow-name">${l}</span><span class="srow-num">${n}回</span>
        <span class="bar"><i class="low" style="width:${(n / max) * 100}%"></i></span></div>`).join("")}
        ${lucky ? `<div class="srow"><span class="srow-name">勘で正解した問題(復習待ち)</span><span class="srow-num">${lucky}問</span></div>` : ""}
      </div>
      ${total && top[1] ? `<p class="hint">いちばん多いのは「${top[0]}」。${advice[top[0]]}</p>` : ""}</section>`;
  }
  function stats() {
    const t = totals();
    const week = Array.from({ length: 7 }, (_, i) => { const d = daysAgo(6 - i); return { d, n: store.days[dayKey(d)] || 0 }; });
    const max = Math.max(store.set.goal, ...week.map((x) => x.n));
    const wd = ["日", "月", "火", "水", "木", "金", "土"];
    const bars = week.map((x, i) => `<div class="col ${i === 6 ? "today" : ""} ${x.n >= store.set.goal ? "met" : ""}"><span class="col-n">${x.n || ""}</span><i style="height:${(x.n / max) * 100}%"></i><span class="col-d">${i === 6 ? "今日" : wd[x.d.getDay()]}</span></div>`).join("");

    const groups = GROUPS.map((f) => {
      const rows = f.cats.map((c) => {
        const ct = totals(idsOfCat(c));
        const r = ct.rate;
        const tone = r == null ? "" : r < PASS ? "low" : r < 0.8 ? "mid" : "high";
        return `<div class="srow"><span class="srow-name">${esc(c)}</span><span class="srow-num">${ct.n ? pct(r) : "未着手"}</span>
          <span class="bar"><i class="${tone}" style="width:${r == null ? 0 : r * 100}%"></i></span></div>`;
      }).join("");
      const ft = totals(idsOfField(f));
      return `<section class="group"><div class="group-head"><h2>${f.field}<small>${pct(ft.rate)}</small></h2></div><div class="card">${rows}</div></section>`;
    }).join("");

    const reset = confirmReset
      ? `<div class="confirm"><p>正答数・チェック・学習日・覚えた用語など、すべての記録を消します。元には戻せません。</p>
         <div class="btns"><button class="btn" data-act="reset-cancel">やめる</button><button class="btn danger-fill" data-act="reset-do">記録を消す</button></div></div>`
      : `<button class="row danger" data-act="reset-ask"><span class="row-main"><strong>学習記録をリセット</strong></span></button>`;

    const backup = backupOpen
      ? `<div class="panel">
          <p>学習記録(${Object.keys(store.st).length}問分・覚えた用語${Object.keys(store.known).length}語)を書き出して、別の端末やブラウザで読み込めます。</p>
          <div class="btns">
            <button class="btn" data-act="backup-copy">${I.copy}記録をコピー</button>
            ${canDownload ? `<button class="btn" data-act="backup-save">${I.download}ファイルに保存</button>` : ""}
          </div>
          <label class="btn file-btn" for="backup-file">${I.upload}ファイルから復元<input type="file" id="backup-file" accept=".json,application/json,text/plain"></label>
          <textarea id="backup-text" rows="3" placeholder="コピーした記録をここに貼り付け"></textarea>
          <button class="btn primary" data-act="backup-restore">貼り付けた記録で復元する</button>
          <p class="foot">復元すると、この端末の今の記録は書き出した記録で置き換わります。</p>
          ${backupMsg ? `<p class="msg" role="status">${esc(backupMsg)}</p>` : ""}
        </div>`
      : "";

    return `<header class="appbar"><h1>成績</h1></header>
    <main class="page">
      <section class="card big-stats">
        <div><b>${t.n}</b><span>回答した数</span></div>
        <div><b>${pct(t.rate)}</b><span>正答率</span></div>
        <div><b>${t.mast}</b><span>習得済み</span></div>
      </section>
      <section class="group"><div class="group-head"><h2>この7日間<small>${week.reduce((a, x) => a + x.n, 0)}問・緑は目標(${store.set.goal}問)達成</small></h2></div>
        <div class="card week" role="img" aria-label="直近7日間の回答数。目標は1日${store.set.goal}問">${bars}</div></section>
      ${mistakes()}
      ${groups}
      <p class="foot">赤は6割未満、青は8割未満、緑は8割以上。</p>
      <section class="group"><div class="group-head"><h2>設定</h2></div>
        <div class="list">
          <label class="row" for="exam-date"><span class="row-main"><strong>試験日</strong><span class="row-sub">ホームに試験まであと何日かを表示します</span></span>
            <input type="date" id="exam-date" class="field" value="${esc(store.set.exam || "")}"></label>
          <label class="row" for="goal"><span class="row-main"><strong>1日の目標</strong><span class="row-sub">ホームとグラフに表示します</span></span>
            <select id="goal" class="field">${GOALS.map((g) => `<option value="${g}" ${g === store.set.goal ? "selected" : ""}>${g}問</option>`).join("")}</select></label>
          <label class="row toggle" for="conf-on"><span class="row-main"><strong>答えるときに自信を選ぶ</strong><span class="row-sub">勘で当たった問題は正解でも翌日に出し直します</span></span>
            <input type="checkbox" id="conf-on" class="switch" data-act="conf-on" ${store.set.conf ? "checked" : ""}></label>
          <label class="row toggle" for="hide-on"><span class="row-main"><strong>選択肢を隠して先に考える</strong><span class="row-sub">問題文だけで答えを思い出してから選択肢を見ます</span></span>
            <input type="checkbox" id="hide-on" class="switch" data-act="hide-on" ${store.set.hide ? "checked" : ""}></label>
          <label class="row toggle" for="skip"><span class="row-main"><strong>習得済みの問題を出さない</strong><span class="row-sub">2回連続で正解した問題を出題から外します</span></span>
            <input type="checkbox" id="skip" class="switch" data-act="skip" ${store.set.skip ? "checked" : ""}></label>
          <button class="row" data-act="backup-toggle" aria-expanded="${backupOpen}"><span class="row-main"><strong>記録のバックアップ・引き継ぎ</strong><span class="row-sub">機種変更やブラウザを変えるときに</span></span><span class="row-go">${backupOpen ? I.up : I.arrow}</span></button>
          ${backup}
          ${reset}
        </div></section>
      <p class="foot">復習の間隔：正解するたびに 1日 → 3日 → 7日 → 14日 → 30日後に出し直し、間違えたら翌日に出します。模擬試験は本番の目安(テクノロジ41・マネジメント7・ストラテジ12)の配分で出題します。</p>
    </main>`;
  }

  // ---------- 問題 ----------
  function quiz() {
    const id = session.ids[session.i];
    const q = BY_ID[id];
    const ord = orderOf(id);
    const chosen = session.answers[id];
    const practice = !session.exam && !session.review;
    const showAnswer = session.review || (!session.exam && chosen !== undefined);
    const pending = practice && chosen === undefined ? session.pending[id] : undefined;
    // 選択肢を隠して先に考える(練習のときだけ)
    const hidden = practice && store.set.hide && chosen === undefined && pending === undefined && !session.revealed[id];
    const s = stat(id);
    const total = session.ids.length;
    const done = session.i + (showAnswer || (session.exam && chosen !== undefined) ? 1 : 0);
    const used = new Set();
    const qHtml = linkify(q.q, used);
    const level = session.conf[id];

    const choices = hidden
      ? `<button class="reveal" data-act="reveal">${I.eye}<span><strong>選択肢を見る</strong><small>まず答えを頭の中で思い浮かべてから</small></span></button>`
      : `<div class="choices">${ord.map((i, pos) => {
        const text = q.c[i];
        let cls = "choice";
        if (showAnswer) {
          if (i === q.a) cls += " right";
          else if (i === chosen) cls += " wrong";
          else cls += " dim";
        } else if (i === chosen || i === pending) cls += " picked";
        const note = showAnswer ? `<span class="note">${linkify(q.why[i], used)}</span>` : "";
        return `<button class="${cls}" data-act="answer" data-i="${pos}" ${showAnswer ? 'aria-disabled="true"' : ""}>
          <span class="oval">${KANA[pos]}</span><span class="body">${showAnswer ? linkify(text, used) : esc(text)}${note}</span></button>`;
      }).join("")}</div>`;

    const hasFormula = FORMULAS.some((f) => f.cats.includes(q.cat));
    let below = "";
    if (!showAnswer) {
      // 選択肢を隠している間は、選択肢の中の用語は出さない(答えのヒントになるため)
      const pre = termsIn(hidden ? [q.q] : [q.q, ...q.c]);
      if (pre.length) below = `<div class="pre-terms"><span>わからない用語は</span>${pre.map((w) => `<button class="chip" data-term="${esc(w)}">${esc(w)}</button>`).join("")}</div>`;
    } else {
      below = `<section class="explain"><h3>解説</h3><p>${linkify(q.ex, used)}</p></section>`;
      if (q.trace) {
        below += `<section class="explain"><h3>トレース表</h3><div class="table-wrap"><table class="trace">
          <thead><tr>${q.trace.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
          <tbody>${q.trace.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
          ${q.trace.note ? `<p class="trace-note">${esc(q.trace.note)}</p>` : ""}</section>`;
      }
      const fs = FORMULAS.filter((f) => f.cats.includes(q.cat));
      if (fs.length) below += `<section class="explain"><h3>この分野の公式・覚え方</h3><div class="chips">${fs.map((f) => `<button class="chip formula-chip" data-act="formula" data-t="${esc(f.t)}">${I.formula}${esc(f.t)}</button>`).join("")}</div></section>`;
      const words = termsIn([q.q, ...q.c, q.ex, ...q.why]);
      if (words.length) below += `<section class="explain"><h3>この問題の用語</h3><div class="chips">${words.map((w) => `<button class="chip" data-term="${esc(w)}">${esc(w)}</button>`).join("")}</div></section>`;
    }

    const history = s.n ? `${s.ok}/${s.n}回正解${s.streak >= MASTER_STREAK ? "・習得済み" : ""}` : "はじめて";
    const flagged = !!store.fl[id];
    const isLast = session.i === total - 1;

    let dock = "";
    if (session.exam && !session.graded) {
      const answered = Object.keys(session.answers).length;
      dock = `<div class="dock"><div class="btns">
        <button class="btn" data-act="prev" ${session.i ? "" : "disabled"}>${I.back}前へ</button>
        ${isLast ? `<button class="btn primary" data-act="grade">採点する<small>${answered}/${total}</small></button>` : `<button class="btn primary" data-act="next">次へ${I.arrow}</button>`}
      </div></div>`;
    } else if (pending !== undefined) {
      dock = `<div class="dock conf-dock"><p class="dock-q"><strong>${KANA[ord.indexOf(pending)]}</strong> で答えます。自信は？</p>
        <div class="btns conf">${CONF.map(([k, l]) => `<button class="btn conf-${k}" data-act="conf" data-level="${k}">${l}</button>`).join("")}</div></div>`;
    } else if (showAnswer) {
      const ok = chosen === q.a;
      const lucky = ok && level === "guess";
      const head = chosen === undefined ? "未回答" : lucky ? "正解(勘)" : ok ? "正解！" : "不正解";
      const right = KANA[ord.indexOf(q.a)];
      const nextLabel = session.review ? (isLast ? "結果に戻る" : "次へ") : isLast ? "結果を見る" : "次の問題";
      const sub = !ok ? `<span>正解は ${right}</span>`
        : lucky ? "<span>まぐれかもしれないので、明日もう一度出します</span>"
        : level === "maybe" ? "<span>あやふやなので、3日以内にもう一度出します</span>" : "";
      const sim = practice && session.similar[id] ? `<p class="sim-note">${I.redo}次に、似た問題を1問出します</p>` : "";
      const reasons = practice && !ok && chosen !== undefined
        ? `<div class="reasons" role="group" aria-label="間違えた理由"><span>理由は？</span>${REASONS.map(([k, l]) => `<button class="chip ${session.reason[id] === k ? "on" : ""}" data-act="reason" data-r="${k}" aria-pressed="${session.reason[id] === k}">${l}</button>`).join("")}</div>` : "";
      dock = `<div class="dock feedback ${ok && !lucky ? "ok" : lucky ? "warn" : "ng"}">
        <div class="fb-head"><span class="fb-icon">${ok ? I.check : I.close}</span><div><strong>${head}</strong>${sub}</div></div>
        ${reasons}${sim}
        <div class="btns">${session.review ? `<button class="btn" data-act="prev" ${session.i ? "" : "disabled"}>${I.back}前へ</button>` : ""}
        <button class="btn ${ok && !lucky ? "go-ok" : lucky ? "go-warn" : "go-ng"}" data-act="next">${nextLabel}</button></div></div>`;
    }

    const timer = session.exam && !session.graded ? `<span class="timer" id="timer">${I.timer}<span>--:--</span></span>` : "";
    return `<div class="quiz ${dock ? "with-dock" : ""}">
      <header class="qbar">
        <button class="icon-btn" data-act="quit" aria-label="${session.review ? "結果に戻る" : "やめる"}">${I.close}</button>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><i style="width:${(done / total) * 100}%"></i></div>
        <span class="count">${session.i + 1}/${total}</span>${timer}
      </header>
      <main class="qbody">
        <div class="meta">${q.part === "B" ? `<span class="cat-chip b">科目B</span>` : ""}<span class="cat-chip">${esc(q.cat)}</span><span>${esc(q.src)}</span><span class="dot">${history}</span>
          <span class="meta-btns">
          ${hasFormula && !(session.exam && !session.graded) ? `<button class="icon-btn" data-act="formula" data-cat="${esc(q.cat)}" aria-label="この分野の公式・覚え方">${I.formula}</button>` : ""}
          <button class="icon-btn flag ${flagged ? "on" : ""}" data-act="flag" aria-pressed="${flagged}" aria-label="あとで見直す">${I.flag}</button></span></div>
        <p class="question">${qHtml}</p>
        ${q.code ? `<div class="code" role="region" aria-label="プログラム"><ol>${q.code.map((l) => `<li><code>${esc(l) || " "}</code></li>`).join("")}</ol></div>` : ""}
        ${choices}
        ${q.credit ? `<p class="credit">${esc(q.credit)}</p>` : ""}
        ${below}
      </main>
      ${dock}
    </div>`;
  }

  // ---------- 結果 ----------
  function result() {
    const ids = session.ids;
    const okCount = ids.filter((id) => session.answers[id] === BY_ID[id].a).length;
    const answered = ids.filter((id) => id in session.answers).length;
    const rate = ids.length ? okCount / ids.length : 0;
    const mins = session.endedAt ? Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000)) : 0;
    const cells = ids.map((id, i) => {
      const ok = session.answers[id] === BY_ID[id].a;
      return `<button class="cell ${ok ? "ok" : "ng"}" data-act="review" data-i="${i}" aria-label="${i + 1}問目 ${ok ? "正解" : "不正解"}"><span>${i + 1}</span>${ok ? I.check : I.close}</button>`;
    }).join("");
    const byCat = {};
    ids.forEach((id) => {
      const c = BY_ID[id].cat;
      byCat[c] = byCat[c] || [0, 0];
      byCat[c][1] += 1;
      if (session.answers[id] === BY_ID[id].a) byCat[c][0] += 1;
    });
    const weak = Object.entries(byCat).filter(([, [o, n]]) => o / n < PASS).map(([c]) => c);
    const message = rate >= 0.9 ? "すばらしい！" : rate >= 0.8 ? "いい調子です" : rate >= PASS ? "合格ラインを超えました" : "復習して、もう一度";
    const passLine = session.exam
      ? `<span class="pill ${rate >= PASS ? "pass" : "fail"}">${rate >= PASS ? "合格ライン(6割)到達" : `合格ラインまであと${Math.max(0, Math.ceil(ids.length * PASS) - okCount)}問`}</span>` : "";
    const hasWrong = ids.some((id) => session.answers[id] !== BY_ID[id].a);

    return `<div class="quiz">
      <header class="qbar"><button class="icon-btn" data-act="done" aria-label="閉じる">${I.close}</button><span class="qbar-title">${esc(session.title)}の結果</span></header>
      <main class="qbody result">
        <section class="result-hero">
          ${ring(rate, 148, `${okCount}<small>/${ids.length}</small>`, "正解")}
          <h2>${message}</h2>
          <p>正答率 ${pct(rate)}・${mins}分</p>
          ${passLine}
        </section>
        ${session.exam && answered < ids.length ? `<p class="hint">未回答の ${ids.length - answered}問は不正解として記録しました。</p>` : ""}
        ${weak.length ? `<p class="hint">6割を切った分野：${weak.map(esc).join("、")}</p>` : ""}
        <section class="group"><div class="group-head"><h2>答え合わせ<small>タップで解説</small></h2></div><div class="cells">${cells}</div></section>
      </main>
      <div class="dock"><div class="btns">
        ${hasWrong ? `<button class="btn" data-act="retry-wrong">${I.redo}間違いだけ</button>` : ""}
        <button class="btn primary" data-act="done">ホームへ</button>
      </div></div>
    </div>`;
  }

  function tick() {
    const el = document.querySelector("#timer span");
    if (!el || !session) return;
    const sec = Math.floor((Date.now() - session.startedAt) / 1000);
    const left = (session.minutes || EXAM_MIN) * 60 - sec;
    const a = Math.abs(left);
    el.textContent = (left < 0 ? "+" : "") + String(Math.floor(a / 60)).padStart(2, "0") + ":" + String(a % 60).padStart(2, "0");
    el.parentElement.classList.toggle("over", left < 0);
  }

  // ---------- 用語の説明シート ----------
  const sheet = document.createElement("div");
  sheet.className = "sheet-wrap";
  sheet.hidden = true;
  document.body.appendChild(sheet);
  let lastFocus = null;
  function openTerm(t) {
    const g = BY_T[t];
    if (!g) return;
    if (sheet.hidden) lastFocus = document.activeElement;
    sheet.innerHTML = `<div class="sheet-back" data-close="1"></div>
      <div class="term-sheet" role="dialog" aria-modal="true" aria-labelledby="term-title">
        <div class="grabber" aria-hidden="true"></div>
        <div class="term-head"><div><h2 id="term-title">${esc(g.t)}</h2>${g.r ? `<small>${esc(g.r)}</small>` : ""}</div>
        <button class="icon-btn" data-close="1" id="term-close" aria-label="閉じる">${I.close}</button></div>
        ${g.al ? `<p class="term-al">別名・略称：${esc(g.al.join("、"))}</p>` : ""}
        <p class="term-def">${linkify(g.d, new Set(), g)}</p>
      </div>`;
    sheet.hidden = false;
    document.getElementById("term-close").focus();
  }
  function formulaCard(f) {
    return `<article class="fcard" id="f-${esc(f.t)}"><h3>${esc(f.t)}</h3>
      <ul>${f.f.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
      ${f.ex ? `<p class="fex"><b>例</b>${esc(f.ex)}</p>` : ""}
      ${f.tip ? `<p class="ftip">${I.bolt}<span>${esc(f.tip)}</span></p>` : ""}</article>`;
  }
  function openFormulas(cat, t) {
    const list = t ? FORMULAS.filter((f) => f.t === t) : FORMULAS.filter((f) => f.cats.includes(cat));
    if (!list.length) return;
    if (sheet.hidden) lastFocus = document.activeElement;
    sheet.innerHTML = `<div class="sheet-back" data-close="1"></div>
      <div class="term-sheet" role="dialog" aria-modal="true" aria-labelledby="term-title">
        <div class="grabber" aria-hidden="true"></div>
        <div class="term-head"><div><h2 id="term-title">${t ? "公式・覚え方" : `${esc(cat)}の公式・覚え方`}</h2></div>
        <button class="icon-btn" data-close="1" id="term-close" aria-label="閉じる">${I.close}</button></div>
        <div class="fcards">${list.map(formulaCard).join("")}</div>
      </div>`;
    sheet.hidden = false;
    document.getElementById("term-close").focus();
  }
  function closeTerm() {
    sheet.hidden = true;
    sheet.innerHTML = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  sheet.addEventListener("click", (e) => {
    const t = e.target.closest("[data-term]");
    if (t) { openTerm(t.dataset.term); return; }
    if (e.target.closest("[data-close]")) closeTerm();
  });

  // ---------- 暗記カード ----------
  let suppressFlip = false;
  function cardAnswer(know) {
    const t = deck[di];
    if (!t) return;
    if (know) store.known[t] = 1; else delete store.known[t];
    save();
    di += 1;
    flipped = false;
    render();
  }
  // カードを左右にスワイプして答える
  let drag = null;
  app.addEventListener("pointerdown", (e) => {
    const f = e.target.closest("#flash");
    if (!f) return;
    drag = { x: e.clientX, y: e.clientY, el: f, moved: false };
  });
  app.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 8) {
      drag.moved = true;
      drag.el.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
      drag.el.dataset.lean = dx > 0 ? "know" : "again";
    }
  });
  const endDrag = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const d = drag; drag = null;
    if (d.moved) {
      suppressFlip = true;
      setTimeout(() => { suppressFlip = false; }, 50);
      if (Math.abs(dx) > 80) { cardAnswer(dx > 0); return; }
      d.el.style.transform = "";
      delete d.el.dataset.lean;
    }
  };
  app.addEventListener("pointerup", endDrag);
  app.addEventListener("pointercancel", endDrag);

  // ---------- 操作 ----------
  app.addEventListener("click", (e) => {
    const term = e.target.closest("[data-term]");
    if (term) { e.preventDefault(); openTerm(term.dataset.term); return; }
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    switch (el.dataset.act) {
      case "tab": confirmReset = false; if (el.dataset.tab === "words") wordQuery = ""; go(el.dataset.tab); break;
      case "start": start(el.dataset.kind, el.dataset.arg); break;
      case "answer": answer(Number(el.dataset.i)); break;
      case "next": next(); break;
      case "prev": prev(); break;
      case "grade": grade(); break;
      case "quit": quit(); break;
      case "done": session = null; go("home"); break;
      case "flag": {
        const id = session.ids[session.i];
        if (store.fl[id]) delete store.fl[id]; else store.fl[id] = 1;
        save(); render(); break;
      }
      case "review": session.review = true; session.i = Number(el.dataset.i); go("quiz"); break;
      case "retry-wrong": {
        const ids = session.ids.filter((id) => session.answers[id] !== BY_ID[id].a);
        begin("間違えた問題", shuffle(ids));
        break;
      }
      case "reset-ask": confirmReset = true; render(); break;
      case "reset-cancel": confirmReset = false; render(); break;
      case "reset-do": store = blank(); save(); confirmReset = false; backupOpen = false; backupMsg = ""; go("home"); break;
      case "wmode":
        wordMode = el.dataset.mode;
        if (wordMode === "cards") buildDeck();
        render(); break;
      case "card-flip":
        if (suppressFlip) { suppressFlip = false; break; }
        flipped = !flipped; render(); break;
      case "card-know": cardAnswer(true); break;
      case "card-dir": cardDir = cardDir === "fwd" ? "rev" : "fwd"; buildDeck(); render(); break;
      case "reveal": session.revealed[session.ids[session.i]] = true; render(); break;
      case "conf": {
        const id = session.ids[session.i];
        if (session.pending[id] !== undefined) finalize(session.pending[id], el.dataset.level);
        break;
      }
      case "reason": setReason(session.ids[session.i], el.dataset.r); break;
      case "formula": openFormulas(el.dataset.cat, el.dataset.t); break;
      case "card-again": cardAnswer(false); break;
      case "cards-restart": buildDeck(); render(); break;
      case "backup-toggle": backupOpen = !backupOpen; backupMsg = ""; render(); break;
      case "backup-copy": {
        const text = backupText();
        const fallback = () => {
          const ta = document.getElementById("backup-text");
          ta.value = text; ta.focus(); ta.select();
          backupMsg = "下の欄に記録を出しました。全部を選んでコピーしてください。";
          const m = document.querySelector(".panel .msg");
          if (m) m.textContent = backupMsg; else ta.insertAdjacentHTML("afterend", `<p class="msg" role="status">${backupMsg}</p>`);
        };
        try {
          navigator.clipboard.writeText(text).then(() => { backupMsg = "コピーしました。メモアプリなどに貼り付けて保管してください。"; render(); }, fallback);
        } catch (err) { fallback(); }
        break;
      }
      case "backup-save": {
        const blob = new Blob([backupText()], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `fe-drill-backup-${dayKey()}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        backupMsg = "ファイルを保存しました。"; render(); break;
      }
      case "backup-restore": restoreFrom(document.getElementById("backup-text").value); break;
    }
  });
  app.addEventListener("input", (e) => {
    if (e.target.id === "word-search") {
      wordQuery = e.target.value;
      document.getElementById("word-list").innerHTML = wordList();
    }
  });
  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.act === "skip") { store.set.skip = t.checked; save(); render(); }
    else if (t.dataset.act === "cards-all") { cardsAll = t.checked; buildDeck(); render(); }
    else if (t.dataset.act === "conf-on") { store.set.conf = t.checked; save(); render(); }
    else if (t.dataset.act === "hide-on") { store.set.hide = t.checked; save(); render(); }
    else if (t.id === "exam-date") { store.set.exam = t.value; save(); render(); }
    else if (t.id === "goal") { store.set.goal = Number(t.value) || 20; save(); render(); }
    else if (t.id === "backup-file" && t.files && t.files[0]) {
      const r = new FileReader();
      r.onload = () => restoreFrom(r.result);
      r.readAsText(t.files[0]);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (!sheet.hidden) { if (e.key === "Escape") closeTerm(); return; }
    if (e.target.classList && e.target.classList.contains("term") && (e.key === "Enter" || e.key === " ")) {
      openTerm(e.target.dataset.term); e.preventDefault(); return;
    }
    if (screen !== "quiz" || e.metaKey || e.ctrlKey || e.altKey || e.target.tagName === "INPUT") return;
    const cur = session.ids[session.i];
    if (!session.exam && !session.review && store.set.hide && !session.revealed[cur] && !(cur in session.answers) && session.pending[cur] === undefined) {
      if (e.key === " " || e.key === "Enter") { session.revealed[cur] = true; render(); e.preventDefault(); }
      return;
    }
    if (session.pending[cur] !== undefined && !(cur in session.answers)) {
      const lv = { s: "sure", m: "maybe", g: "guess" }[e.key];
      if (lv) { finalize(session.pending[cur], lv); e.preventDefault(); return; }
    }
    const map = { "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7, "9": 8, "0": 9, a: 0, b: 1, c: 2, d: 3 };
    if (e.key in map) { answer(map[e.key]); e.preventDefault(); }
    else if (e.key === "Enter" || e.key === "ArrowRight") {
      const id = session.ids[session.i];
      if (session.exam || session.review || id in session.answers) { next(); e.preventDefault(); }
    } else if (e.key === "ArrowLeft" && (session.exam || session.review)) { prev(); e.preventDefault(); }
    else if (e.key === "Escape") quit();
  });

  // ホーム画面に追加したとき、オフラインでも開けるようにする(公開サイトでのみ有効)
  if ("serviceWorker" in navigator && location.protocol === "https:" && document.querySelector('link[rel="manifest"]')) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }

  render();
})();
