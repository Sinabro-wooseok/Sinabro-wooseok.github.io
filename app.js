// 내용 그리기, 한영 전환, 성과 필터, 목차 표시
const $ = (s) => document.querySelector(s);
const state = { lang: "ko", cat: "all" };

// 브라우저 저장소는 막혀 있을 수 있으니 실패해도 넘어간다
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } },
};
const L = () => state.lang;
const t = (k) => TEXT[L()][k];
const ext = (href, label, cls = "") => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>`;

function kpiHTML() {
  return HERO_KPI.map((k) => `<li><b>${L() === "en" && k.en_n ? k.en_n : k.n}</b><span>${k[L()]}</span></li>`).join("");
}

function expHTML() {
  return EXP.map((e) => {
    const [co, role, desc] = e[L()];
    const when = L() === "en" ? e.en_when : e.when;
    const tag = e.concurrent ? `<em>${t("concurrent")}</em>` : "";
    const tags = e.tags.length ? `<ul class="tags">${e.tags.map((x) => `<li>${x}</li>`).join("")}</ul>` : "";
    return `<li><div class="when">${when}</div><div><div class="co">${co} <span>· ${role}</span>${tag}</div><p>${desc}</p>${tags}</div></li>`;
  }).join("");
}

function projectsHTML() {
  const [dfName, dfMeta, dfDesc] = t("dockferry");
  const [rpName, rpMeta, rpDesc] = t("repause");
  const shots = ["play", "harbor", "album"].map((k) => `<img src="assets/dockferry_${L()}_${k}.jpg" alt="Dock Ferry ${k}" loading="lazy" width="303" height="540">`).join("");
  return `<article class="proj"><h3>${dfName}</h3><p class="meta">${dfMeta}</p>
      <div class="shots app">${shots}</div>
      <p class="d">${dfDesc}</p>
      <ul class="tags"><li>TypeScript</li><li>Capacitor</li><li>AdMob</li><li>In-app purchase</li></ul>
      ${ext("https://testflight.apple.com/join/9jP6rraM", `${t("dockferry_link")} ↗`, "go")}</article>
    <article class="proj"><h3>${rpName}</h3><p class="meta">${rpMeta}</p>
      <div class="shots web"><img src="assets/repause_desktop.jpg" alt="repause.co.kr desktop" loading="lazy"><img src="assets/repause_mobile.jpg" alt="repause.co.kr mobile" loading="lazy"></div>
      <p class="d">${rpDesc}</p>
      <ul class="tags"><li>Next.js</li><li>TypeScript</li><li>Tailwind</li><li>Prisma</li><li>Toss Payments</li></ul>
      ${ext("https://repause.co.kr", `${t("repause_link")} ↗`, "go")}</article>`;
}

function resultsHTML() {
  const cats = [{ id: "all", ko: t("all"), en: t("all") }, ...CATS];
  const chips = cats.map((c) => {
    const n = c.id === "all" ? REVIEWS.length : REVIEWS.filter((r) => r.c === c.id).length;
    return `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">${c[L()]} ${n}</button>`;
  }).join("");
  const catName = (id) => CATS.find((c) => c.id === id)[L()];
  const cards = REVIEWS.filter((r) => state.cat === "all" || r.c === state.cat).map((r) => {
    const [body, detail] = r[L()];
    const link = r.link ? ` ${ext(r.link, r.link.replace("https://", ""))}` : "";
    return `<article class="rv${r.locked ? " locked" : ""}"><div class="n">${r.n}</div><p>${body}</p>
      <div class="by"><span>${catName(r.c)}</span><button type="button" aria-expanded="false">${t("how_label")}</button></div>
      <div class="how">${detail}${link}</div></article>`;
  }).join("");
  return `<div class="chips" role="group">${chips}</div><div class="reviews">${cards}</div>`;
}

function render() {
  document.documentElement.lang = L();
  document.querySelectorAll("[data-i]").forEach((el) => { el.textContent = t(el.dataset.i); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === L())));
  $("#about-body").innerHTML = t("about").map((p) => `<p>${p}</p>`).join("");
  $("#kpi").innerHTML = kpiHTML();
  $("#exp").innerHTML = expHTML();
  $("#projects-body").innerHTML = projectsHTML();
  $("#results-body").innerHTML = resultsHTML();
  $("#rules").innerHTML = RULES[L()].map((x) => `<li>${x}</li>`).join("");
  $("#skill-list").innerHTML = AMEN.map((a) => `<dt>${a[L()]}</dt><dd>${a.v}</dd>`).join("");
}

function setLang(lang) {
  state.lang = lang === "en" ? "en" : "ko";
  store.set("lang", state.lang);
  render();
}

document.addEventListener("click", (e) => {
  const lang = e.target.closest("[data-lang]");
  if (lang) { setLang(lang.dataset.lang); return; }
  const chip = e.target.closest(".chip");
  if (chip) { state.cat = chip.dataset.cat; $("#results-body").innerHTML = resultsHTML(); return; }
  const how = e.target.closest(".rv .by button");
  if (how) {
    const card = how.closest(".rv");
    const open = card.classList.toggle("open");
    how.setAttribute("aria-expanded", String(open));
  }
});

// 지금 보고 있는 구역을 왼쪽 목차에 표시
function watchSections() {
  if (!("IntersectionObserver" in window)) return;
  const links = [...document.querySelectorAll(".toc a")];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === `#${en.target.id}`));
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  document.querySelectorAll("main .sec").forEach((s) => io.observe(s));
}

// 언어: 주소 ?lang= → 저장값 → 브라우저 언어 순
const q = new URLSearchParams(location.search).get("lang");
const nav = (navigator.language || "ko").toLowerCase().startsWith("ko") ? "ko" : "en";
setLang(q || store.get("lang") || nav);
watchSections();
