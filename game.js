// 숙소 투어 게임: 평면도 그리기, 이동(키보드·버튼·탭), 방 입장 처리
(function () {
  const ROWS = MAP.length, COLS = MAP[0].length;
  const map = document.getElementById("map");
  const at = (r, c) => (MAP[r] || "")[c] || "#";
  const isRoom = (ch) => ch >= "a" && ch <= "z" && ch !== "d";
  const walkable = (ch) => ch === "." || ch === "d" || (isRoom(ch) && ch !== "v");
  const pos = { ...START };
  let visited = new Set(load());
  let vaultTries = 0, walkTimer = null, toastTimer = null, stampShown = visited.size >= TOUR.length;

  function load() { try { return JSON.parse(localStorage.getItem("visited") || "[]"); } catch (e) { return []; } }
  function save() { try { localStorage.setItem("visited", JSON.stringify([...visited])); } catch (e) { /* 저장 불가 환경 */ } }
  const pct = (n, total) => `${(n / total) * 100}%`;

  // 8x8 픽셀 캐릭터(행마다 색 기호: . 투명)
  function pixelSVG(rows, colors) {
    let rects = "";
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (colors[ch]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${colors[ch]}"/>`; }));
    return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }
  const BODY = ["..hhhh..", ".hhhhhh.", ".hffffh.", "..ffff..", ".ssssss.", "f.ssss.f", "..pppp..", "..p..p.."];
  const PLAYER = pixelSVG(BODY, { h: "#1B2238", f: "#F6D2A8", s: "#E0566B", p: "#1B2238" });
  const HOST = pixelSVG(BODY, { h: "#FFD866", f: "#F6D2A8", s: "#7FE0C2", p: "#2A3A64" });
  const DESK = pixelSVG(["...yy...", "..yyyy..", "........", "bbbbbbbb", "bwwwwwwb", "bwwwwwwb", "bwwwwwwb", "bbbbbbbb"], { y: "#FFD866", b: "#4A3424", w: "#C89B5A" });

  function place(el, r, c, w = 1, h = 1) {
    el.style.left = pct(c, COLS); el.style.top = pct(r, ROWS);
    el.style.width = pct(w, COLS); el.style.height = pct(h, ROWS);
  }

  // 방마다 장식(타일 단위 위치)
  const DECO = [
    { cls: "shelf", r: 1.1, c: 1.2, w: 3.6, h: 0.6 },
    { cls: "bench", r: 2.0, c: 6.5, w: 3, h: 0.9 },
    { cls: "screen", r: 1.15, c: 11.4, w: 3.2, h: 0.9 },
    { cls: "frames", r: 8.1, c: 1.3, w: 4.4, h: 0.5 },
    { cls: "pool", r: 8.4, c: 8.1, w: 2.6, h: 1.3 },
    { cls: "safe", r: 8.4, c: 12.6, w: 1.8, h: 1.3 },
  ];

  const labels = {}, player = document.createElement("div"), npcBubbles = {};

  function build() {
    const frag = document.createDocumentFragment();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const ch = at(r, c), d = document.createElement("div");
      d.className = "t " + ({ "#": "wall", ".": "floor", d: "door", D: "lock", H: "npc", F: "desk" }[ch] || `r-${ch}`);
      d.dataset.r = r; d.dataset.c = c;
      frag.append(d);
    }
    map.append(frag);
    DECO.forEach((o) => { const e = document.createElement("div"); e.className = `deco ${o.cls}`; place(e, o.r, o.c, o.w, o.h); map.append(e); });
    Object.keys(ROOMS).forEach((k) => {
      const cells = [];
      MAP.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === k) cells.push([r, c]); }));
      const rs = cells.map((x) => x[0]), cs = cells.map((x) => x[1]);
      const lb = document.createElement("div");
      lb.className = "label";
      lb.style.left = pct((Math.min(...cs) + Math.max(...cs) + 1) / 2, COLS);
      lb.style.top = pct((Math.min(...rs) + Math.max(...rs) + 1) / 2 + 0.25, ROWS);
      map.append(lb); labels[k] = lb;
    });
    MAP.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch !== "H" && ch !== "F") return;
      const s = document.createElement("div"); s.className = "sprite"; s.innerHTML = ch === "H" ? HOST : DESK; place(s, r, c); map.append(s);
      const b = document.createElement("div"); b.className = "bubble"; b.style.left = pct(c + 0.5, COLS); b.style.top = pct(r, ROWS); map.append(b);
      npcBubbles[ch] = b;
    }));
    player.className = "sprite"; player.innerHTML = PLAYER; map.append(player);
    draw();
  }

  function draw() { place(player, pos.r, pos.c); }

  function relabel() {
    const T = UI.t, lang = UI.lang();
    Object.entries(labels).forEach(([k, el]) => {
      el.textContent = ROOMS[k][lang][0];
      el.classList.toggle("done", visited.has(k));
    });
    npcBubbles.H.textContent = `H ${T("host")}`;
    npcBubbles.F.textContent = `F ${T("front")}`;
    document.getElementById("hint").textContent = matchMedia("(pointer: coarse)").matches ? T("hint_touch") : T("hint");
    document.getElementById("pips").innerHTML = TOUR.map((k) => `<i class="${visited.has(k) ? "on" : ""}"></i>`).join("");
    document.getElementById("vcount").textContent = `${[...visited].filter((k) => TOUR.includes(k)).length}/${TOUR.length}`;
    const jumps = [...TOUR.map((k) => [k, ROOMS[k][lang][0]]), ["H", T("host")], ["F", T("front")], ["v", ROOMS.v[lang][0]]];
    document.getElementById("jump").innerHTML = jumps.map(([k, name]) => `<button type="button" data-go="${k}" class="${visited.has(k) ? "done" : ""}">${name}</button>`).join("");
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg; el.classList.add("on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("on"), 3200);
  }

  function vault() {
    vaultTries += 1;
    map.classList.remove("shake"); void map.offsetWidth; map.classList.add("shake");
    toast(UI.t(vaultTries >= 3 ? "vault_3" : vaultTries === 2 ? "vault_2" : "vault_1"));
  }

  function interact(ch) {
    if (ch === "D" || ch === "v") return vault();
    if (ch === "H") return UI.openChat();
    if (ch === "F") return UI.openBook();
  }

  function enter(prevCh) {
    const ch = at(pos.r, pos.c);
    if (!isRoom(ch) || ch === prevCh) return false;
    if (TOUR.includes(ch) && !visited.has(ch)) { visited.add(ch); save(); relabel(); }
    UI.openRoom(ch);
    if (!stampShown && TOUR.every((k) => visited.has(k))) {
      // 방 창 뒤 지도 위에 미리 띄워 두면 창을 닫는 순간 보인다
      stampShown = true;
      document.getElementById("stamp").hidden = false;
    }
    return true;
  }

  // 한 칸 이동. 막히면 상호작용, 방에 들어가면 true(걷기 중단)
  function step(dr, dc) {
    const nr = pos.r + dr, nc = pos.c + dc, ch = at(nr, nc);
    if (!walkable(ch)) { interact(ch); return true; }
    const prev = at(pos.r, pos.c);
    pos.r = nr; pos.c = nc; draw();
    return enter(prev);
  }

  // 너비 우선 탐색으로 목표 칸(또는 그 옆 칸)까지 경로
  function path(tr, tc) {
    const goalCh = at(tr, tc), adjacentGoal = !walkable(goalCh);
    const key = (r, c) => r * COLS + c, prev = new Map([[key(pos.r, pos.c), null]]), q = [[pos.r, pos.c]];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      const [r, c] = q.shift();
      const done = adjacentGoal ? Math.abs(r - tr) + Math.abs(c - tc) === 1 : r === tr && c === tc;
      if (done) {
        const out = []; let k = key(r, c);
        while (prev.get(k) !== null) { const p = prev.get(k); out.unshift([Math.floor(k / COLS) - Math.floor(p / COLS), (k % COLS) - (p % COLS)]); k = p; }
        if (adjacentGoal) out.push([tr - r, tc - c]);
        return out;
      }
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc, k = key(nr, nc);
        if (!prev.has(k) && walkable(at(nr, nc))) { prev.set(k, key(r, c)); q.push([nr, nc]); }
      }
    }
    return null;
  }

  function walkTo(tr, tc) {
    clearInterval(walkTimer);
    const steps = path(tr, tc);
    if (!steps || !steps.length) { if (Math.abs(pos.r - tr) + Math.abs(pos.c - tc) === 1) interact(at(tr, tc)); return; }
    const fast = matchMedia("(prefers-reduced-motion: reduce)").matches;
    player.classList.add("walk");
    const run = () => {
      const s = steps.shift();
      const stop = !s || step(s[0], s[1]);
      if (stop || !steps.length) { clearInterval(walkTimer); player.classList.remove("walk"); }
    };
    if (fast) { while (steps.length && !UI.anyDialogOpen()) run(); player.classList.remove("walk"); return; }
    walkTimer = setInterval(run, 110);
  }

  // 방·인물로 갈 때의 목표 칸: 방은 문 바로 안쪽, 인물은 그 칸
  function targetOf(k) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const ch = at(r, c);
      if (k === "v" && ch === "D") return [r, c];
      if (ch === k && k === k.toUpperCase()) return [r, c];
      if (ch === k && [[1, 0], [-1, 0]].some(([dr]) => at(r + dr, c) === "d")) return [r, c];
    }
    return null;
  }

  function bind() {
    map.addEventListener("click", (e) => {
      const tile = e.target.closest(".t"); if (!tile) return;
      const r = Number(tile.dataset.r), c = Number(tile.dataset.c), ch = at(r, c);
      if (ch === "#") return;
      if (isRoom(ch) && ch !== "v") { const t = targetOf(ch); walkTo(t[0], t[1]); return; }
      if (ch === "v") { const t = targetOf("v"); walkTo(t[0], t[1]); return; }
      walkTo(r, c);
    });
    document.getElementById("jump").addEventListener("click", (e) => {
      const b = e.target.closest("[data-go]"); if (!b) return;
      const t = targetOf(b.dataset.go); if (t) walkTo(t[0], t[1]);
    });
    const DIR = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1] };
    document.addEventListener("keydown", (e) => {
      if (UI.anyDialogOpen() || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const d = DIR[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (!d) return;
      const box = map.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      e.preventDefault(); clearInterval(walkTimer); player.classList.remove("walk");
      step(d[0], d[1]);
    });
    document.querySelectorAll(".dpad [data-d]").forEach((b) => b.addEventListener("click", () => {
      if (UI.anyDialogOpen()) return;
      const d = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[b.dataset.d];
      clearInterval(walkTimer); step(d[0], d[1]);
    }));
    document.getElementById("reset").addEventListener("click", () => {
      clearInterval(walkTimer); visited = new Set(); save(); stampShown = false; vaultTries = 0;
      Object.assign(pos, START); draw(); relabel(); document.getElementById("stamp").hidden = true;
    });
    document.getElementById("toFront").addEventListener("click", () => {
      document.getElementById("stamp").hidden = true; const t = targetOf("F"); walkTo(t[0], t[1]);
    });
  }

  build(); bind(); relabel();
  window.Game = { relabel };
})();
