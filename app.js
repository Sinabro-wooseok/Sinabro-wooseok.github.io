// 화면 그리기와 예약 위젯 동작
const $ = (s) => document.querySelector(s);
const state = { lang: "ko", cat: "all", mode: 2 };

// 브라우저 저장소는 막혀 있을 수 있으니 실패해도 넘어간다
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } },
};

function t(key) { return TEXT[state.lang][key]; }

function renderStatic() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i]").forEach((el) => { el.textContent = t(el.dataset.i); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
}

function renderGallery() {
  const tiles = GALLERY.map((g) => `<a class="tile" href="#reviews-sec"><div class="n">${g.n}</div><div class="l">${g[state.lang]}</div></a>`).join("");
  $("#gallery").innerHTML = `<a class="tile photo" href="https://repause.co.kr" target="_blank" rel="noopener"><img src="assets/repause_desktop.jpg" alt="repause.co.kr"><span class="cap">repause.co.kr</span></a>${tiles}`;
}

function renderFeat() {
  $("#feat").innerHTML = FEAT.map((f) => `<div><span>${f.k}</span><div><b>${f[state.lang][0]}</b><p>${f[state.lang][1]}</p></div></div>`).join("");
}

function renderChips() {
  const cats = [{ id: "all", ko: t("all"), en: t("all") }, ...CATS];
  $("#chips").innerHTML = cats.map((c) => {
    const count = c.id === "all" ? REVIEWS.length : REVIEWS.filter((r) => r.c === c.id).length;
    return `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">${c[state.lang]} ${count}</button>`;
  }).join("");
}

function renderReviews() {
  const howLabel = state.lang === "ko" ? "근거 보기" : "How measured";
  const catName = (id) => CATS.find((c) => c.id === id)[state.lang];
  const list = REVIEWS.filter((r) => state.cat === "all" || r.c === state.cat);
  $("#reviews").innerHTML = list.map((r) => {
    const [body, how] = r[state.lang];
    const link = r.link ? ` <a href="${r.link}" target="_blank" rel="noopener">${r.link.replace("https://", "")}</a>` : "";
    return `<article class="rv${r.locked ? " locked" : ""}"><div class="n">${r.n}</div><p>${body}</p>
      <div class="by"><span>${catName(r.c)}</span><button type="button" aria-expanded="false">${howLabel}</button></div>
      <div class="how">${how}${link}</div></article>`;
  }).join("");
}

function renderLists() {
  $("#amen").innerHTML = AMEN.map((a) => `<div><small>${a[state.lang]}</small><div>${a.v}</div></div>`).join("");
  $("#stays").innerHTML = STAYS.map((s) => {
    const [co, role, desc] = s[state.lang];
    return `<li><div class="when">${s.when}</div><div><div class="co">${co} <span>· ${role}</span></div><p>${desc}</p></div></li>`;
  }).join("");
  $("#rules").innerHTML = RULES[state.lang].map((r) => `<li>${r}</li>`).join("");
}

function renderForm() {
  const sel = $("#type");
  const keep = sel.selectedIndex < 0 ? 0 : sel.selectedIndex;
  sel.innerHTML = TYPES[state.lang].map((v, i) => `<option value="${i}">${v}</option>`).join("");
  sel.selectedIndex = keep;
  $("#mode").innerHTML = MODES[state.lang].map((v, i) => `<button type="button" data-mode="${i}" aria-pressed="${state.mode === i}">${v}</button>`).join("");
  $("#sum").innerHTML = `<div><span>${t("s_dev")}</span><span>${t("rate")}</span></div>
    <div><span>${t("s_agent")}</span><span>${t("s_free")}</span></div>
    <div><span>${t("s_cancel")}</span><span>${t("s_free")}</span></div>
    <div class="tot"><span>${t("s_total")}</span><span>${t("s_total_v")}</span></div>`;
}

// 시간대 차이(시간 단위). 두 시간대의 현재 시각 차로 계산
function offsetHours(tz, now) {
  const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((local - utc) / 360000) / 10;
}

function renderTz() {
  const now = new Date();
  const you = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const fmt = (tz) => now.toLocaleTimeString(state.lang === "ko" ? "ko-KR" : "en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  let diff = offsetHours(you, now) - offsetHours("Asia/Seoul", now);
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  const overlap = Math.max(0, 9 - Math.abs(diff));
  const msg = diff === 0 ? t("tz_same") : t("tz_overlap")(overlap);
  // 서울 기준 0~24시 막대에 서울 9~18시와 상대 9~18시를 표시
  const youStart = ((9 - diff) % 24 + 24) % 24;
  const pct = (h) => (h / 24) * 100;
  const youBars = youStart + 9 <= 24
    ? `<i class="you" style="left:${pct(youStart)}%;width:${pct(9)}%"></i>`
    : `<i class="you" style="left:${pct(youStart)}%;width:${pct(24 - youStart)}%"></i><i class="you" style="left:0;width:${pct(youStart + 9 - 24)}%"></i>`;
  $("#tz").innerHTML = `<div>${t("tz_seoul")} <b>${fmt("Asia/Seoul")}</b> · ${t("tz_you")} <b>${you}</b> <b>${fmt(you)}</b></div>
    <div>${msg}</div>
    <div class="bar">${youBars}<i class="seoul" style="left:${pct(9)}%;width:${pct(9)}%"></i></div>
    <div class="bar-l"><span>00</span><span>06</span><span>12 KST</span><span>18</span><span>24</span></div>`;
}

function renderAll() {
  renderStatic(); renderGallery(); renderFeat(); renderChips(); renderReviews(); renderLists(); renderForm(); renderTz();
}

// 예약 번호: 오늘 날짜 + 임의 4자리
function confirmationNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `WL-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function openConfirm() {
  const date = $("#checkin").value;
  if (!date) { $("#err").textContent = t("err_date"); $("#checkin").focus(); return; }
  $("#err").textContent = "";
  const no = confirmationNo();
  const team = $("#team").value.trim().slice(0, 60);
  const rows = [[t("c_checkin"), date], [t("c_type"), TYPES[state.lang][$("#type").value]], [t("c_mode"), MODES[state.lang][state.mode]]];
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
  const dlg = $("#dlg");
  if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
}

function bind() {
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.lang; store.set("lang", state.lang); renderAll();
  }));
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    state.cat = b.dataset.cat; renderChips(); renderReviews();
  });
  $("#reviews").addEventListener("click", (e) => {
    const b = e.target.closest(".by button"); if (!b) return;
    const card = b.closest(".rv");
    const open = card.classList.toggle("open");
    b.setAttribute("aria-expanded", String(open));
  });
  $("#mode").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]"); if (!b) return;
    state.mode = Number(b.dataset.mode); renderForm();
  });
  $("#form").addEventListener("submit", (e) => { e.preventDefault(); openConfirm(); });
  $("#close").addEventListener("click", () => $("#dlg").close());
  $("#checkin").min = new Date().toISOString().slice(0, 10);
}

state.lang = store.get("lang") || ((navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en");
bind();
renderAll();
setInterval(renderTz, 60000);
