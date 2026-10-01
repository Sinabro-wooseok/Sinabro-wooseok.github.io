// 내용 표시, 언어 전환, 대화상자(방·채팅·예약)
const $ = (s) => document.querySelector(s);
const state = { lang: "ko", cat: "all", mode: 2, chatDone: new Set() };

// 브라우저 저장소는 막혀 있을 수 있으니 실패해도 넘어간다
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } },
};

function t(key) { return GAME_TEXT[state.lang][key] ?? TEXT[state.lang][key]; }
const L = () => state.lang;

/* ---------- 내용 조각(방과 한눈에 보기가 같이 씀) ---------- */
function reviewsHTML() {
  const cats = [{ id: "all", ko: t("all"), en: t("all") }, ...CATS];
  const chips = cats.map((c) => {
    const n = c.id === "all" ? REVIEWS.length : REVIEWS.filter((r) => r.c === c.id).length;
    return `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">${c[L()]} ${n}</button>`;
  }).join("");
  const how = L() === "ko" ? "근거 보기" : "How measured";
  const catName = (id) => CATS.find((c) => c.id === id)[L()];
  const cards = REVIEWS.filter((r) => state.cat === "all" || r.c === state.cat).map((r) => {
    const [body, detail] = r[L()];
    const link = r.link ? ` <a href="${r.link}" target="_blank" rel="noopener">${r.link.replace("https://", "")}</a>` : "";
    return `<article class="rv${r.locked ? " locked" : ""}"><div class="n">${r.n}</div><p>${body}</p>
      <div class="by"><span>${catName(r.c)}</span><button type="button" aria-expanded="false">${how}</button></div>
      <div class="how">${detail}${link}</div></article>`;
  }).join("");
  return `<div class="chips" role="group">${chips}</div><div class="reviews">${cards}</div>`;
}
function skillsHTML() {
  return `<div class="amen">${AMEN.map((a) => `<div><small>${a[L()]}</small><div>${a.v}</div></div>`).join("")}</div>`;
}
function careerHTML() {
  return `<ul class="stays">${STAYS.map((s) => {
    const [co, role, desc] = s[L()];
    return `<li><div class="when">${s.when}</div><div><div class="co">${co} <span>· ${role}</span></div><p>${desc}</p></div></li>`;
  }).join("")}</ul>`;
}
function gardenHTML() {
  return `<div class="work"><img src="assets/repause_desktop.jpg" alt="repause.co.kr desktop" loading="lazy"><img src="assets/repause_mobile.jpg" alt="repause.co.kr mobile" loading="lazy"></div>
    <p class="work-t">${t("repause")} <a href="https://repause.co.kr" target="_blank" rel="noopener">repause.co.kr</a></p>`;
}
function aiHTML() {
  const r = REVIEWS.filter((x) => x.c === "ai").map((x) => `<li><b>${x.n}</b> ${x[L()][0]}</li>`).join("");
  return `<ol class="rules">${RULES[L()].map((x) => `<li>${x}</li>`).join("")}</ol>
    <h3 style="margin-top:18px">${L() === "ko" ? "관제실 기록" : "Control room log"}</h3><ul class="rules">${r}</ul>
    <p><a href="https://github.com/Sinabro-wooseok/agent-guardrails" target="_blank" rel="noopener">github.com/Sinabro-wooseok/agent-guardrails</a></p>`;
}
const SLOT = { reviews: reviewsHTML, skills: skillsHTML, career: careerHTML, garden: gardenHTML, ai: aiHTML };

function fillSlots(root = document) {
  root.querySelectorAll("[data-slot]").forEach((el) => { el.innerHTML = SLOT[el.dataset.slot](); });
}

function renderStatic() {
  document.documentElement.lang = L();
  document.querySelectorAll("[data-i]").forEach((el) => { el.textContent = t(el.dataset.i); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === L())));
  $("#kpi").innerHTML = HERO_KPI.map((k) => `<li><b>${k.n}</b><span>${k[L()]}</span></li>`).join("");
  $("#feat").innerHTML = FEAT.map((f) => `<div><span>${f.k}</span><div><b>${f[L()][0]}</b><p>${f[L()][1]}</p></div></div>`).join("");
}

/* ---------- 시간대 ---------- */
function offsetHours(tz, now) {
  const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((local - utc) / 360000) / 10;
}
function renderTz() {
  const now = new Date();
  const you = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const fmt = (tz) => now.toLocaleTimeString(L() === "ko" ? "ko-KR" : "en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  let diff = offsetHours(you, now) - offsetHours("Asia/Seoul", now);
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  const msg = diff === 0 ? t("tz_same") : t("tz_overlap")(Math.max(0, 9 - Math.abs(diff)));
  // 서울 기준 0~24시 막대: 서울 9~18시와 상대방 9~18시
  const start = ((9 - diff) % 24 + 24) % 24;
  const pct = (h) => (h / 24) * 100;
  const youBars = start + 9 <= 24
    ? `<i class="you" style="left:${pct(start)}%;width:${pct(9)}%"></i>`
    : `<i class="you" style="left:${pct(start)}%;width:${pct(24 - start)}%"></i><i class="you" style="left:0;width:${pct(start + 9 - 24)}%"></i>`;
  $("#tz").innerHTML = `<div>${t("tz_seoul")} <b>${fmt("Asia/Seoul")}</b> · ${t("tz_you")} ${you} <b>${fmt(you)}</b></div><div>${msg}</div>
    <div class="bar">${youBars}<i class="seoul" style="left:${pct(9)}%;width:${pct(9)}%"></i></div>
    <div class="bar-l"><span>00</span><span>06</span><span>12 KST</span><span>18</span><span>24</span></div>`;
}

/* ---------- 대화상자 ---------- */
function openDlg(id) {
  const d = document.getElementById(id);
  if (d.open) return;
  if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
}
function anyDialogOpen() { return [...document.querySelectorAll("dialog")].some((d) => d.open); }

let currentRoom = null;
function openRoom(key) {
  currentRoom = key;
  const room = ROOMS[key];
  $("#roomTitle").textContent = `${room[L()][0]} · ${room[L()][1]}`;
  $("#roomBody").innerHTML = SLOT[room.id]();
  openDlg("room");
}

/* ---------- 호스트 채팅 ---------- */
function renderChatQ() {
  $("#chatQ").innerHTML = CHAT.map((c, i) => `<button type="button" data-q="${i}" ${state.chatDone.has(i) ? "disabled" : ""}>${c[L()][0]}</button>`).join("");
}
function addMsg(cls, text) {
  const m = document.createElement("div");
  m.className = `msg ${cls}`;
  m.textContent = text;
  $("#chatLog").append(m);
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
  return m;
}
function openChat() {
  if (!$("#chatLog").children.length) addMsg("host", t("chat_hello"));
  renderChatQ();
  openDlg("chat");
}
function ask(i) {
  const [q, a] = CHAT[i][L()];
  state.chatDone.add(i);
  renderChatQ();
  addMsg("me", q);
  const typing = addMsg("host typing", `${t("typing")} ...`);
  const delay = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
  setTimeout(() => { typing.remove(); addMsg("host", a); }, delay);
}

/* ---------- 예약 ---------- */
function renderForm() {
  const sel = $("#type");
  const keep = Math.max(0, sel.selectedIndex);
  sel.innerHTML = TYPES[L()].map((v, i) => `<option value="${i}">${v}</option>`).join("");
  sel.selectedIndex = keep;
  $("#mode").innerHTML = MODES[L()].map((v, i) => `<button type="button" data-mode="${i}" aria-pressed="${state.mode === i}">${v}</button>`).join("");
  $("#sum").innerHTML = `<div><span>${t("s_dev")}</span><span>${t("rate")}</span></div>
    <div><span>${t("s_agent")}</span><span>${t("s_free")}</span></div>
    <div><span>${t("s_cancel")}</span><span>${t("s_free")}</span></div>
    <div class="tot"><span>${t("s_total")}</span><span>${t("s_total_v")}</span></div>`;
}
function confirmationNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `WL-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
function submitBooking() {
  const date = $("#checkin").value;
  if (!date) { $("#err").textContent = t("err_date"); $("#checkin").focus(); return; }
  $("#err").textContent = "";
  const no = confirmationNo();
  const team = $("#team").value.trim().slice(0, 60);
  const rows = [[t("c_checkin"), date], [t("c_type"), TYPES[L()][$("#type").value]], [t("c_mode"), MODES[L()][state.mode]]];
  if (team) rows.push([t("c_team"), team]);
  const dl = $("#cdl");
  dl.replaceChildren();
  rows.forEach(([k, v]) => {
    const dt = document.createElement("dt"); dt.textContent = k;
    const dd = document.createElement("dd"); dd.textContent = v;
    dl.append(dt, dd);
  });
  $("#cno").textContent = no;
  const body = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${no}\n${t("mail_from")}`;
  $("#mail").href = `mailto:woosuk547@naver.com?subject=${encodeURIComponent(`${t("mail_subject")} ${no}`)}&body=${encodeURIComponent(body)}`;
  $("#book").close();
  openDlg("dlg");
}

/* ---------- 전체 그리기·이벤트 ---------- */
function renderAll() {
  renderStatic(); fillSlots(); renderForm(); renderTz(); renderChatQ();
  if ($("#room").open && currentRoom) openRoom(currentRoom);
  if (window.Game) window.Game.relabel();
}

function bind() {
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.lang; store.set("lang", L()); renderAll();
  }));
  // 후기 필터와 근거 펼치기는 방·한눈에 보기 어디서든 동작
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat]");
    if (chip) {
      state.cat = chip.dataset.cat; fillSlots();
      if ($("#room").open && currentRoom) $("#roomBody").innerHTML = SLOT[ROOMS[currentRoom].id]();
      return;
    }
    const how = e.target.closest(".rv .by button");
    if (how) { const open = how.closest(".rv").classList.toggle("open"); how.setAttribute("aria-expanded", String(open)); return; }
    const opener = e.target.closest("[data-open]");
    if (opener) { opener.dataset.open === "book" ? openDlg("book") : openChat(); return; }
    const closer = e.target.closest("[data-close]");
    if (closer) closer.closest("dialog").close();
  });
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
  $("#chatQ").addEventListener("click", (e) => { const b = e.target.closest("[data-q]"); if (b && !b.disabled) ask(Number(b.dataset.q)); });
  $("#mode").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) { state.mode = Number(b.dataset.mode); renderForm(); } });
  $("#form").addEventListener("submit", (e) => { e.preventDefault(); submitBooking(); });
  $("#checkin").min = new Date().toISOString().slice(0, 10);
}

state.lang = store.get("lang") || ((navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en");
window.UI = { openRoom, openChat, openBook: () => openDlg("book"), anyDialogOpen, t, lang: L };
bind();
renderAll();
setInterval(renderTz, 60000);
