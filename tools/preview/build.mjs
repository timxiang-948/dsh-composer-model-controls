// Builds standalone preview HTML pages that load the real lib/client.js bundle
// against a mocked DSH client context, for headless screenshot verification.
//
// Usage: node tools/preview/build.mjs
// Pages are written to tools/preview/out/. The "clean-*" pages omit the mock
// composer chrome and diagnostics so they can be captured as marketplace shots.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.resolve(here, "..", "..");
const bundle = fs.readFileSync(path.join(pluginDir, "lib", "client.js"), "utf8");
const outDir = path.join(here, "out");
const vendorDir = path.join(here, "vendor");
fs.mkdirSync(outDir, { recursive: true });

const REACT_UMD = {
  "react.development.js": "https://unpkg.com/react@18.3.1/umd/react.development.js",
  "react-dom.development.js": "https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js",
};

function ensureReact() {
  for (const [name, url] of Object.entries(REACT_UMD)) {
    const target = path.join(vendorDir, name);
    if (fs.existsSync(target)) continue;
    console.log("downloading " + name + " ...");
    execFileSync("curl.exe", ["-fsSL", "-o", target, url], { stdio: "inherit" });
  }
}

ensureReact();

const zh = {
  model: "\u6a21\u578b",
  effort: "\u63a8\u7406\u7b49\u7ea7",
  providerDefault: "\u9ed8\u8ba4",
  selectModel: "\u9009\u62e9\u6a21\u578b",
  loading: "\u52a0\u8f7d\u4e2d\u2026",
  selectModelAria: "\u9009\u62e9\u6a21\u578b",
  effortAria: "\u9009\u62e9\u63a8\u7406\u7b49\u7ea7",
  groupAria: "\u4f9b\u5e94\u5546",
  failed: "\u66f4\u65b0\u5931\u8d25",
  cycleEffort: "\u5faa\u73af\u5207\u6362\u63a8\u7406\u5f3a\u5ea6",
  effortTitle: "\u63a8\u7406\u5f3a\u5ea6",
  effortHint: "\u62d6\u52a8\u6216\u70b9\u51fb\u8f68\u9053\uff0c\u677e\u624b\u5438\u9644\u5230\u6700\u8fd1\u6863\u4f4d",
  effortKeys: "\u65b9\u5411\u952e\u5207\u6362 \u00b7 Shift+Tab \u5faa\u73af",
  guideTitle: "\u5f53\u524d\u6a21\u578b\u672a\u58f0\u660e\u63a8\u7406\u6863\u4f4d",
  guideBody: "\u5728 cordis.patch.yml \u7684 provider models \u4e2d\u58f0\u660e reasoningEfforts\uff1a",
  guideTip: "\u5efa\u8bae\u6863\u4f4d\uff1aoff \u2192 low \u2192 high\uff08\u9009\u586b medium/max\uff09",
  copy: "\u590d\u5236 YAML",
  copied: "\u5df2\u590d\u5236",
  off: "\u65e0",
  waiting: "\u52a0\u8f7d\u4e2d",
};

const pre = `
(function () {
  var React = window.React;
  function svg(children, size) {
    return React.createElement("svg", {
      width: size || 14, height: size || 14, viewBox: "0 0 16 16",
      fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round",
      style: { opacity: 0.6 }
    }, children);
  }
  function IconDataOutlineRegular() {
    return svg([
      React.createElement("rect", { key: "a", x: 2.5, y: 3, width: 11, height: 10, rx: 2 }),
      React.createElement("path", { key: "b", d: "M2.5 6.5h11" }),
      React.createElement("path", { key: "c", d: "M5.5 3v10" })
    ]);
  }
  function IconGaugeOutlineRegular() {
    return svg([
      React.createElement("circle", { key: "a", cx: 8, cy: 8, r: 5.2 }),
      React.createElement("path", { key: "b", d: "M8 8l3-2.4" })
    ]);
  }
  function IconChevronDownOutlineRegular() {
    return svg([React.createElement("path", { key: "a", d: "M4.5 6.2L8 9.7l3.5-3.5" })], 12);
  }
  function Menu(props) {
    var panel = null;
    if (props.open) {
      var rows = (props.items || []).map(function (it) {
        if (it.type === "label") return React.createElement("div", { key: it.id, style: { color: "#8b93a1", fontSize: 11, padding: "5px 10px 3px" } }, it.text);
        if (it.type === "separator") return React.createElement("div", { key: it.id, style: { height: 1, background: "#eceff3", margin: "4px 6px" } });
        return React.createElement("div", {
          key: it.id,
          onClick: function () { if (props.onSelect) props.onSelect(it.id); },
          style: { padding: "7px 10px", margin: "1px 4px", borderRadius: 8, cursor: "pointer", fontSize: 13, background: it.id === props.selectedId ? "#eef4ff" : "transparent", color: "#1f2937" }
        }, it.label, it.id === props.selectedId ? "  \u2713" : "");
      });
      panel = React.createElement("div", {
        style: { position: "absolute", bottom: "calc(100% + 8px)", right: 0, minWidth: 260, background: "#fff", border: "1px solid #e3e8ef", borderRadius: 12, padding: 6, boxShadow: "0 12px 34px rgba(15,23,42,.14)", zIndex: 60 }
      }, rows);
    }
    return React.createElement("span", { style: { position: "relative", display: "inline-flex" } }, props.anchor, panel);
  }
  window.__ModuleLoader__ = {
    load: function (meta) {
      var factory = meta.factory;
      var exports = factory(function (name) {
        if (name === "react" || name === "react/jsx-runtime") return window.React;
        if (name === "react-dom") return window.ReactDOM;
        if (name.indexOf("dsh-client-ui-primitives") >= 0) {
          return {
            Menu: Menu,
            IconDataOutlineRegular: IconDataOutlineRegular,
            IconGaugeOutlineRegular: IconGaugeOutlineRegular,
            IconChevronDownOutlineRegular: IconChevronDownOutlineRegular
          };
        }
        throw new Error("unexpected require: " + name);
      });
      window.__pluginExports = exports;
    }
  };
})();
`;

const post = `
(function () {
  var React = window.React;
  var ReactDOM = window.ReactDOM;
  var dict = __DICT__;
  var t = function (k) { return dict[k] || k; };
  var listeners = [];
  var state = {
    current: __CURRENT__,
    retainedEffort: undefined,
    routable: true,
    groups: [
      { id: "deepseek-account", name: "DeepSeek Account", models: [
        { id: "deepseek-v4.1-flash", name: "DeepSeek-V4.1-Flash", reasoning: { defaultEffort: "high", efforts: [
          { id: "off", name: "Off" }, { id: "low", name: "Low" }, { id: "high", name: "High" }, { id: "max", name: "Max" }
        ] } },
        { id: "deepseek-v4-pro", name: "DeepSeek-V4-Pro" }
      ] },
      { id: "deepseek-account-vision", name: "DeepSeek Account (modlens vision)", models: [
        { id: "deepseek-v4-pro-vision", name: "DeepSeek-V4-Pro (modlens vision)" }
      ] }
    ],
    failures: [],
    status: "ready",
    pending: null,
    error: null
  };
  function emit() { listeners.slice().forEach(function (fn) { fn(); }); }
  var store = {
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },
    getSnapshot: function () { return state; }
  };
  var seatComponent = null;
  window.__selectCalls = [];
  var directory = {
    store: store,
    load: function () { return Promise.resolve(state); },
    select: function (sel) {
      window.__selectCalls.push(sel);
      var delay = window.__selectDelay || 0;
      function commit() {
        state = Object.assign({}, state, { current: Object.assign({}, state.current, sel) });
        emit();
      }
      if (delay > 0) { setTimeout(commit, delay); } else { commit(); }
      return Promise.resolve({ ok: true });
    }
  };
  var scope = {
    effect: function (fn) { return fn(); },
    slots: {
      inject: function (name, fn) { return fn(); },
      register: function (opts, component) {
        if (opts && (opts.name === "conversation.input.model" || opts.name === "conversation.hero.options")) seatComponent = component;
        return { dispose: function () {} };
      }
    },
    modelDirectories: { directoryFor: function () { return directory; } },
    sessions: { subagentAddress: function () { return undefined; } },
    shortcuts: { register: function () { __SHORTCUT_BODY__ }, registerFixed: function () { return function () {}; } }
  };
  var ctx = {
    locale: { bind: function () { return t; }, register: function () { return function () {}; }, resolveText: function (s) { return s; } },
    effect: function (fn) { return fn(); },
    inject: function (deps, cb) { return cb(scope); }
  };
  window.__mecDebug = [];
  window.__err = null;
  window.onerror = function (m, s, l) { window.__err = String(m) + "@" + l; };
  var mod = window.__pluginExports;
  if (!mod || typeof mod.apply !== "function") { document.body.insertAdjacentHTML("afterbegin", "<pre>apply() missing</pre>"); return; }
  mod.apply(ctx);
  if (!seatComponent) { document.body.insertAdjacentHTML("afterbegin", "<pre>seat component not registered</pre>"); return; }
  ReactDOM.createRoot(document.getElementById("seat")).render(
    React.createElement(seatComponent, {
      available: true,
      directory: store,
      load: function () {},
      select: function (sel) { return directory.select(sel); },
      t: t,
      sessionId: "s"
    })
  );
  window.__previewReady = true;
  __AUTO_OPEN__
})();
`;

function buildPage({ name, autoOpen, shortcutMode, current, clean }) {
  const currentJson = JSON.stringify(current || { provider: "deepseek-account", model: "deepseek-v4.1-flash", reasoningEffort: "high" });
  const shortcutBody = shortcutMode === "throwing" ? 'throw new Error("missing shortcuts service");' : 'return function () {};';
  const cleanPage = clean === true;
  const stagePadding = cleanPage ? "56px 80px 40px" : "90px 120px 40px";
  const autoOpenJs = typeof autoOpen === "string" ? autoOpen : autoOpen
    ? `window.__clickLog = [];
  document.addEventListener("click", function (e) { window.__clickLog.push((e.target.getAttribute && e.target.getAttribute("aria-label")) || e.target.tagName); }, true);
  function tryOpen() {
    var buttons = document.querySelectorAll("button[aria-label]");
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].getAttribute("aria-label") === ${JSON.stringify("选择推理等级")}) { buttons[i].click(); return true; }
    }
    return false;
  }
  setTimeout(tryOpen, 700);
  setTimeout(function () {
    var labels = [];
    var buttonInfo = [];
    var nodes = document.querySelectorAll("[aria-label]");
    for (var j = 0; j < nodes.length; j++) {
      labels.push(nodes[j].getAttribute("aria-label"));
      buttonInfo.push(nodes[j].tagName + ":" + nodes[j].getAttribute("aria-label") + ":dis=" + nodes[j].disabled + ":exp=" + nodes[j].getAttribute("aria-expanded"));
    }
    var pop = document.querySelector(".dsh-mec-pop");
    var classes = [];
    var allNodes = document.querySelectorAll("*");
    for (var k = 0; k < allNodes.length && k < 400; k++) { var cn = allNodes[k].className; if (typeof cn === "string" && cn.indexOf("mec") >= 0) classes.push(allNodes[k].tagName + "." + cn); }
    var portalType = typeof (window.ReactDOM && window.ReactDOM.createPortal);
    var info = "none";
    if (pop) {
      var r = pop.getBoundingClientRect();
      var cs = window.getComputedStyle(pop);
      info = JSON.stringify({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), pos: cs.position, vis: cs.visibility, op: cs.opacity, disp: cs.display, bg: cs.backgroundColor, z: cs.zIndex });
    }
    var diag = document.createElement("pre");
    diag.style.cssText = "position:fixed;left:14px;bottom:14px;margin:0;font-size:11px;line-height:1.5;color:#334;background:#fff;border:1px solid #dde;border-radius:8px;padding:8px 10px;max-width:1100px;white-space:pre-wrap;z-index:999999";
    diag.textContent = "labels=" + labels.join(" | ") + "\\npopInfo=" + info + "\\nclicks=" + JSON.stringify(window.__clickLog) + "\\nbuttons=" + buttonInfo.join(" ; ") + "\\nerr=" + window.__err + " portal=" + portalType + "\\nmec=" + classes.join(",") + "\\ndbg=" + JSON.stringify(window.__mecDebug);
    document.body.appendChild(diag);
  }, 2600);`
    : "";
  const html = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>composer model controls preview</title>
<style>
  body { margin: 0; background: #eef1f5; font-family: "Segoe UI", "Microsoft YaHei", sans-serif; }
  .stage { padding: ${stagePadding}; }
  .card { background: #fff; border: 1px solid #d9dee6; border-radius: 16px; padding: 14px 16px 12px; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
  .input-line { font-size: 14px; color: #9aa3af; padding: 8px 2px 26px; }
  .row { display: flex; align-items: center; gap: 10px; }
  .perm { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #5b6472; padding: 4px 8px; border-radius: 8px; }
  .spacer { flex: 1; }
  .send { width: 32px; height: 32px; border-radius: 50%; background: #2f6fed; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; }
  .hint { margin: 16px 4px; font-size: 12px; color: #7b8492; }
</style>
</head>
<body>
<div class="stage">
  <div class="card" data-composer-card>
    <div class="input-line">描述你想要构建的内容，/ 调用指令，@ 文件或对话</div>
    <div class="row">
      <span class="perm">✚</span>
      <span class="perm">自动审查 ▾</span>
      <span class="spacer"></span>
      <span id="seat"></span>
      <span class="send">↑</span>
    </div>
  </div>
  ${cleanPage ? "" : '<div class="hint">独立预览（mock ModelDirectory）：DeepSeek-V4.1-Flash 的档位为 Off / Low / High / Max</div>'}
</div>
<script src="../vendor/react.development.js"></script>
<script src="../vendor/react-dom.development.js"></script>
<script>${pre}</script>
<script id="plugin-bundle">${bundle}</script>
<script>${post.replace("__DICT__", JSON.stringify(zh)).replace("__AUTO_OPEN__", autoOpenJs).replace("__SHORTCUT_BODY__", shortcutBody).replace("__CURRENT__", currentJson)}</script>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, name), html, "utf8");
  console.log("wrote " + name + " (" + html.length + " chars)");
}

buildPage({ name: "preview-closed.html", autoOpen: false });
const interactJs = `setTimeout(function () {
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) { if (bs[i].getAttribute("aria-label") === "选择推理等级") { bs[i].click(); break; } }
}, 600);
setTimeout(function () {
  var slider = document.querySelector("[role=slider]") || document.querySelector(".dsh-mec-slider");
  if (slider) slider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", code: "ArrowLeft", bubbles: true }));
}, 1300);
setTimeout(function () {
  var chip = null;
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) { if (bs[i].getAttribute("aria-label") === "选择推理等级") chip = bs[i]; }
  var card = document.querySelector("[data-composer-card]");
  var pop = document.querySelector(".dsh-mec-pop");
  var diag = document.createElement("pre");
  diag.style.cssText = "position:fixed;left:14px;bottom:14px;margin:0;font-size:11px;line-height:1.5;color:#334;background:#fff;border:1px solid #dde;border-radius:8px;padding:8px 10px;max-width:1100px;white-space:pre-wrap;z-index:999999";
  diag.textContent = "chipText=" + (chip ? chip.textContent : "none") + "\\ncalls=" + JSON.stringify(window.__selectCalls || []) + "\\nborder=" + (card ? card.style.borderColor : "n/a") + "\\nshadow=" + (card ? card.style.boxShadow : "n/a") + "\\npopOpen=" + (pop !== null);
  document.body.appendChild(diag);
}, 2400);`;
const cycleJs = `window.__cycleLog = [];
setTimeout(function () {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", code: "Tab", shiftKey: true, bubbles: true }));
}, 900);
setTimeout(function () {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", code: "Tab", shiftKey: true, bubbles: true }));
}, 1400);
setTimeout(function () {
  var chip = null;
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) { if (bs[i].getAttribute("aria-label") === "选择推理等级") chip = bs[i]; }
  var card = document.querySelector("[data-composer-card]");
  var diag = document.createElement("pre");
  diag.style.cssText = "position:fixed;left:14px;bottom:14px;margin:0;font-size:11px;line-height:1.5;color:#334;background:#fff;border:1px solid #dde;border-radius:8px;padding:8px 10px;max-width:1100px;white-space:pre-wrap;z-index:999999";
  diag.textContent = "Shift+Tab fallback test\\nchipText=" + (chip ? chip.textContent : "none") + "\\ncalls=" + JSON.stringify(window.__selectCalls || []) + "\\nborder=" + (card ? card.style.borderColor : "n/a");
  document.body.appendChild(diag);
}, 2600);`;
buildPage({ name: "preview-interact.html", autoOpen: interactJs, shortcutMode: "normal" });
buildPage({ name: "preview-cycle.html", autoOpen: cycleJs, shortcutMode: "throwing" });
buildPage({ name: "preview-open.html", autoOpen: true });
const dragJs = `setTimeout(function () {
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) { if (bs[i].getAttribute("aria-label") === "选择推理等级") { bs[i].click(); break; } }
}, 500);
setTimeout(function () {
  var el = document.querySelector("[role=slider]");
  if (!el) { return; }
  var r = el.getBoundingClientRect();
  var x = r.left + r.width * 0.92;
  var y = r.top + r.height / 2;
  function pe(type, cx) { el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: y, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: type === "pointerup" ? 0 : 1 })); }
  pe("pointerdown", x); pe("pointermove", x); pe("pointerup", x);
}, 800);
setTimeout(function () {
  var chip = null;
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) { if (bs[i].getAttribute("aria-label") === "选择推理等级") chip = bs[i]; }
  var card = document.querySelector("[data-composer-card]");
  var diag = document.createElement("pre");
  diag.style.cssText = "position:fixed;left:14px;bottom:14px;margin:0;font-size:11px;line-height:1.5;color:#334;background:#fff;border:1px solid #dde;border-radius:8px;padding:8px 10px;max-width:1100px;white-space:pre-wrap;z-index:999999";
  diag.textContent = "drag-to-right test\\nchipText=" + (chip ? chip.textContent : "none") + "\\ncalls=" + JSON.stringify(window.__selectCalls || []) + "\\nborder=" + (card ? card.style.borderColor : "n/a");
  document.body.appendChild(diag);
}, 2200);`;
const guideJs = `setTimeout(function () {
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) { if (bs[i].getAttribute("aria-label") === "选择推理等级") { bs[i].click(); break; } }
}, 600);
setTimeout(function () {
  var guide = document.querySelector(".dsh-mec-guide");
  var pop = document.querySelector(".dsh-mec-pop");
  var copyBtn = document.querySelector(".dsh-mec-copy");
  var diag = document.createElement("pre");
  diag.style.cssText = "position:fixed;left:14px;bottom:14px;margin:0;font-size:11px;line-height:1.5;color:#334;background:#fff;border:1px solid #dde;border-radius:8px;padding:8px 10px;max-width:1100px;white-space:pre-wrap;z-index:999999";
  diag.textContent = "custom-provider guidance test\\npopOpen=" + (pop !== null) + " guide=" + (guide !== null) + " copyBtn=" + (copyBtn !== null) + "\\nguideText=" + (guide ? guide.textContent.slice(0, 220) : "none");
  document.body.appendChild(diag);
}, 1900);`;
const dragMidJs = `setTimeout(function () {
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) { if (bs[i].getAttribute("aria-label") === "选择推理等级") { bs[i].click(); break; } }
}, 500);
setTimeout(function () {
  var el = document.querySelector("[role=slider]");
  if (!el) { return; }
  var r = el.getBoundingClientRect();
  var y = r.top + r.height / 2;
  function pe(type, cx) { el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: y, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 1 })); }
  pe("pointerdown", r.left + r.width * 0.4);
  pe("pointermove", r.left + r.width * 0.15);
}, 1100);
setTimeout(function () {
  var fill = document.querySelector(".dsh-mec-fill");
  var knob = document.querySelector(".dsh-mec-knob");
  var chip = null;
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) { if (bs[i].getAttribute("aria-label") === "选择推理等级") chip = bs[i]; }
  var diag = document.createElement("pre");
  diag.style.cssText = "position:fixed;left:14px;bottom:14px;margin:0;font-size:11px;line-height:1.5;color:#334;background:#fff;border:1px solid #dde;border-radius:8px;padding:8px 10px;max-width:1100px;white-space:pre-wrap;z-index:999999";
  var card = document.querySelector("[data-composer-card]");
  diag.textContent = "mid-drag test (no release, 15%)\\nfillBg=" + (fill ? getComputedStyle(fill).backgroundColor : "none") + "\\nknobLeft=" + (knob ? knob.style.left : "none") + "\\nchipText=" + (chip ? chip.textContent : "none") + "\\ncalls=" + JSON.stringify(window.__selectCalls || []) + "\\nring=" + (card ? card.style.boxShadow : "n/a") + "\\ncardH=" + (card ? Math.round(card.getBoundingClientRect().height) : "n/a");
  document.body.appendChild(diag);
}, 2100);`;
buildPage({ name: "preview-dragmid.html", autoOpen: dragMidJs });
var dragMaxJs = dragMidJs
  .replace('pe("pointerdown", r.left + r.width * 0.4);', 'pe("pointerdown", r.left + r.width * 0.6);')
  .replace('pe("pointermove", r.left + r.width * 0.15);', 'pe("pointermove", r.left + r.width * 0.83);')
  .replace('mid-drag test (no release, 15%)', 'mid-drag test (no release, 83%)');
buildPage({ name: "preview-dragmax.html", autoOpen: dragMaxJs });
var dragMid70 = dragMidJs.replace('pe("pointerdown", r.left + r.width * 0.4);', 'pe("pointerdown", r.left + r.width * 0.5);').replace('pe("pointermove", r.left + r.width * 0.15);', 'pe("pointermove", r.left + r.width * 0.70);').replace('mid-drag test (no release, 15%)', 'mid-drag test (no release, 70%)');
var dragMid95 = dragMidJs.replace('pe("pointerdown", r.left + r.width * 0.4);', 'pe("pointerdown", r.left + r.width * 0.9);').replace('pe("pointermove", r.left + r.width * 0.15);', 'pe("pointermove", r.left + r.width * 0.95);').replace('mid-drag test (no release, 15%)', 'mid-drag test (no release, 95%)');
buildPage({ name: "preview-dragmax70.html", autoOpen: dragMid70 });
buildPage({ name: "preview-dragmax95.html", autoOpen: dragMid95 });
buildPage({ name: "preview-off.html", autoOpen: false, current: { provider: "deepseek-account", model: "deepseek-v4.1-flash", reasoningEffort: "off" } });
buildPage({ name: "preview-drag.html", autoOpen: dragJs });
buildPage({ name: "preview-guide.html", autoOpen: guideJs, current: { provider: "deepseek-account", model: "deepseek-v4-pro" } });
console.log("bundle size " + bundle.length);

var snapJs = `
setTimeout(function () {
  window.__selectDelay = 1500;
  var chip = document.querySelector('button[aria-label="选择推理等级"]');
  if (chip) { chip.click(); }
  setTimeout(function () {
    var slider = document.querySelector('[role=slider]');
    if (!slider) return;
    var rect = slider.getBoundingClientRect();
    function fire(type, ratio) {
      var ev = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX: rect.left + rect.width * ratio, clientY: rect.top + 8 });
      slider.dispatchEvent(ev);
    }
    fire('pointerdown', 0.2);
    setTimeout(function () { fire('pointermove', 0.95); }, 60);
    setTimeout(function () { fire('pointerup', 0.95); }, 140);
  }, 400);
  window.__snapLog = [];
  function snap(label) {
    var knob = document.querySelector('.dsh-mec-knob');
    var chip = document.querySelector('button[aria-label="选择推理等级"]');
    var card = document.querySelector('.card') || document.querySelector('[data-composer-card]');
    window.__snapLog.push(label + ' knob=' + (knob ? knob.style.left : 'none') + ' chip=' + (chip ? chip.textContent : 'none') + ' calls=' + (window.__selectCalls || []).length + ' ring=' + (card ? String(card.style.boxShadow).slice(0, 90) : 'n/a'));
  }
  setTimeout(function () { snap('mid(1200ms)'); }, 1200);
  setTimeout(function () { snap('settled(3400ms)'); }, 3400);
  setTimeout(function () {
    var pre = document.createElement('pre');
    pre.style.cssText = "position:fixed;left:14px;top:14px;margin:0;font-size:11px;line-height:1.6;color:#334;background:#fff;border:1px solid #dde;border-radius:8px;padding:8px 10px;max-width:1150px;white-space:pre-wrap;z-index:999999";
    pre.textContent = 'snap test (select delay 1500ms)\\n' + (window.__snapLog || []).join('\\n');
    document.body.appendChild(pre);
  }, 3800);
}, 500);
`;
buildPage({ name: "preview-snap.html", autoOpen: snapJs });
// ---------------------------------------------------------------------------
// Clean pages: same bundle/mock, no diagnostics or preview hint. These are the
// pages captured with headless Edge into assets/screenshot-*.png.
// ---------------------------------------------------------------------------
const clickEffort = `function clickEffort() {
  var bs = document.querySelectorAll("button[aria-label]");
  for (var i = 0; i < bs.length; i++) {
    if (bs[i].getAttribute("aria-label") === "选择推理等级") { bs[i].click(); return true; }
  }
  return false;
}`;

const cleanHighJs = `${clickEffort}
setTimeout(clickEffort, 700);`;

const cleanDragMidJs = `${clickEffort}
setTimeout(clickEffort, 500);
setTimeout(function () {
  var el = document.querySelector("[role=slider]");
  if (!el) { return; }
  var r = el.getBoundingClientRect();
  var y = r.top + r.height / 2;
  function pe(type, cx) {
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: y, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 1 }));
  }
  pe("pointerdown", r.left + r.width * 0.4);
  pe("pointermove", r.left + r.width * 0.15);
}, 1100);`;

const cleanMaxJs = `${clickEffort}
setTimeout(clickEffort, 500);
setTimeout(function () {
  var el = document.querySelector("[role=slider]");
  if (!el) { return; }
  var r = el.getBoundingClientRect();
  var y = r.top + r.height / 2;
  function pe(type, cx) {
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: y, pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: type === "pointerup" ? 0 : 1 }));
  }
  pe("pointerdown", r.left + r.width * 0.9);
  pe("pointermove", r.left + r.width * 0.95);
  pe("pointerup", r.left + r.width * 0.95);
}, 800);`;

buildPage({ name: "clean-high.html", autoOpen: cleanHighJs, clean: true });
buildPage({ name: "clean-dragmid.html", autoOpen: cleanDragMidJs, clean: true });
buildPage({ name: "clean-max.html", autoOpen: cleanMaxJs, clean: true });
buildPage({
  name: "clean-off.html",
  autoOpen: cleanHighJs,
  clean: true,
  current: { provider: "deepseek-account", model: "deepseek-v4.1-flash", reasoningEffort: "off" },
});
