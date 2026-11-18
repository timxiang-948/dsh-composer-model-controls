/**
 * dsh-composer-model-controls — browser half.
 *
 * A pure-UI DSH plugin that lifts only the reasoning-effort selector out of the
 * model menu (the model menu itself keeps DSH's built-in model picker, including
 * the "启用智能体团队协作" option that lives in its options child slot) and
 * renders the effort control inside the composer tool row, immediately left of
 * the built-in model chip and the send button (`conversation.input.right`).
 *
 * The effort chip opens a Codex-style effort slider: the stops are exactly the
 * current model's catalog `reasoning.efforts` (count, names and order come from
 * the model). Dragging or clicking the track snaps to the nearest stop on
 * release, and Shift+Tab cycles the effort from low to high anywhere in the
 * client. The slider fill carries a per-level tone plus a stardust texture, and
 * the composer card ring follows the level color (off = neutral, low = green,
 * high = blue, max = orange).
 *
 * The control writes the same per-session `ModelDirectory` as the `/model`
 * command, so the two stay in sync; a failed update reloads the directory and
 * therefore rolls the UI back to the last confirmed level.
 *
 * Bundled by hand in the DSH browser module format: the factory only registers
 * the plugin; `apply`/`inject` are the cordis plugin faces.
 */
window.__ModuleLoader__.load({
	id: "dsh-composer-model-controls",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var React = require("react");
		var ReactDOM = require("react-dom");
		var primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		var IconGaugeOutlineRegular = primitives.IconGaugeOutlineRegular;
		var IconChevronDownOutlineRegular = primitives.IconChevronDownOutlineRegular;

		var h = React.createElement;
		var NS = "composerModelControls";
		var STYLE_ID = "dsh-composer-model-controls-style";
		var CARD_SELECTOR = "[data-composer-card]";

		var zh = {
			model: "模型",
			effort: "推理等级",
			providerDefault: "默认",
			selectModel: "选择模型",
			loading: "加载中…",
			selectModelAria: "选择模型",
			effortAria: "选择推理等级",
			groupAria: "推理强度控件",
			failed: "切换失败",
			cycleEffort: "循环切换推理等级",
			effortTitle: "推理强度",
			guideTitle: "当前模型未声明推理档位",
			guideBody: "该模型的 provider 没有在模型目录里公开 reasoning.efforts。在自定义 provider 的模型声明中加入 reasoningEfforts 即可出现档位滑块（键为档位名，值为发送给接口的参数，off 可留空）：",
			guideTip: "档位名用于界面显示；键 off / low / medium / high 可映射到不同强度。修改后重启或在插件页重载配置生效。",
			copy: "复制 YAML",
			copied: "已复制",
			off: "关闭",
			waiting: "等待模型目录…"
		};
		var en = {
			model: "Model",
			effort: "Reasoning",
			providerDefault: "Default",
			selectModel: "Select model",
			loading: "Loading…",
			selectModelAria: "Select model",
			effortAria: "Select reasoning effort",
			groupAria: "Reasoning effort control",
			failed: "Switch failed",
			cycleEffort: "Cycle reasoning effort",
			effortTitle: "Reasoning effort",
			guideTitle: "This model declares no reasoning levels",
			guideBody: "Its provider has no reasoning.efforts in the model catalog. Add reasoningEfforts to the model entry of a custom provider to get the slider (keys are level names, values are what gets sent, off may stay empty):",
			guideTip: "Keys off / low / medium / high map to different intensities. Reload the config after editing.",
			copy: "Copy YAML",
			copied: "Copied",
			off: "Off",
			waiting: "Waiting for the model catalog…"
		};

		var YAML_SAMPLE = [
			"      my-provider:",
			"        displayName: My Provider",
			"        apiKeyEnv: MY_PROVIDER_API_KEY",
			"        api: openai-completions",
			"        baseURL: https://example.com/v1",
			"        models:",
			"          - id: my-model",
			"            name: My Model",
			"            reasoningEfforts:",
			"              off:            # 关闭推理",
			"              low: low        # 低",
			"              medium: medium  # 中",
			"              high: high      # 高"
		].join("\n");

		var CSS = `
.dsh-mec-row{display:inline-flex;align-items:center;gap:2px;min-width:0;max-width:100%}
.dsh-mec-chip{border-radius:var(--dsw-radius-sm);min-height:26px;max-width:240px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;align-items:center;gap:4px;padding:0 6px;font-family:inherit;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}
.dsh-mec-chip:not(:disabled):hover,.dsh-mec-chip[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-mec-chip:disabled{opacity:.55;cursor:default}
.dsh-mec-chip-icon,.dsh-mec-chip-chev{flex:none;color:var(--dsw-alias-label-tertiary)}
.dsh-mec-chip-text{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}

.dsh-mec-pop{position:fixed;z-index:2147483000;width:320px;box-sizing:border-box;padding:12px 14px 12px;border-radius:14px;background:var(--dsw-specific-menu,#1e1f24);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.25));box-shadow:var(--dsw-elevation-panel,0 16px 40px rgba(0,0,0,.35));font-family:inherit;font-size:13px;line-height:20px;backdrop-filter:none;isolation:isolate}
.dsh-mec-pop-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:10px}
.dsh-mec-pop-title{font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-tertiary)}
.dsh-mec-pop-value{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dsh-mec-slider{position:relative;padding:8px 0 2px;outline:none}
.dsh-mec-slider-inner{position:relative;height:26px;margin:0 8px;touch-action:none;user-select:none;cursor:pointer}
.dsh-mec-track{position:absolute;left:0;right:0;top:9px;height:8px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.18));overflow:hidden}
.dsh-mec-fill{position:absolute;left:0;top:9px;height:8px;border-radius:999px;overflow:hidden;pointer-events:none}
.dsh-mec-stars{position:absolute;left:0;top:9px;height:8px;border-radius:999px;overflow:hidden;pointer-events:none;mix-blend-mode:screen}
.dsh-mec-stars:before{content:"";position:absolute;inset:0;background-image:radial-gradient(1.6px 1.6px at 10% 30%,rgba(255,255,255,.95),transparent 62%),radial-gradient(1px 1px at 26% 72%,rgba(255,255,255,.7),transparent 62%),radial-gradient(1.3px 1.3px at 43% 38%,rgba(255,255,255,.85),transparent 62%),radial-gradient(1px 1px at 61% 66%,rgba(255,255,255,.65),transparent 62%),radial-gradient(1.2px 1.2px at 78% 32%,rgba(255,255,255,.8),transparent 62%),radial-gradient(1px 1px at 92% 62%,rgba(255,255,255,.6),transparent 62%);background-repeat:repeat-x;background-size:118px 100%;animation:dsh-mec-twinkle 2.4s linear infinite}
@keyframes dsh-mec-twinkle{from{background-position:118px 0}to{background-position:0 0}}
.dsh-mec-knob{position:absolute;top:5px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.18),0 2px 6px rgba(0,0,0,.35),0 0 0 4px var(--mec-halo,rgba(128,128,128,.25));pointer-events:none}
.dsh-mec-slider:focus-visible .dsh-mec-knob{outline:2px solid var(--dsw-alias-state-business-primary,#4d8dff);outline-offset:3px}
.dsh-mec-stops{position:relative;height:16px;margin:4px 8px 0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);user-select:none}
.dsh-mec-stop{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap;cursor:pointer}
.dsh-mec-stop[data-active=true]{color:var(--dsw-alias-label-primary);font-weight:600}
.dsh-mec-guide-title{font-size:13px;font-weight:600;margin:2px 0 6px}
.dsh-mec-guide-body{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dsh-mec-guide pre{margin:10px 0 8px;padding:10px;border-radius:10px;background:rgba(128,128,128,.10);border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.18));font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:16px;overflow:auto;max-height:220px;white-space:pre;color:var(--dsw-alias-label-primary)}
.dsh-mec-guide-actions{display:flex;align-items:center;gap:8px}
.dsh-mec-copy{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 10px;font:inherit;font-size:12px;cursor:pointer}
.dsh-mec-copy:hover{filter:brightness(1.08)}
.dsh-mec-guide-tip{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);margin-top:6px}
.dsh-mec-error{color:var(--dsw-alias-label-caption);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;

		function ensureStyles() {
			if (typeof document === "undefined") return;
			if (document.getElementById(STYLE_ID) !== null) return;
			var style = document.createElement("style");
			style.id = STYLE_ID;
			style.textContent = CSS;
			document.head.appendChild(style);
		}

		function removeStyles() {
			if (typeof document === "undefined") return;
			var style = document.getElementById(STYLE_ID);
			if (style !== null) style.remove();
		}

		// #region effort visuals -------------------------------------------------

		function hexToRgb(hex) {
			var value = String(hex || "").replace("#", "");
			if (value.length === 3) {
				value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
			}
			var number = parseInt(value, 16);
			return {
				r: (number >> 16) & 255,
				g: (number >> 8) & 255,
				b: number & 255
			};
		}

		function mix(from, to, t) {
			var a = hexToRgb(from);
			var b = hexToRgb(to);
			function channel(x, y) {
				return Math.round(x + (y - x) * t);
			}
			return (
				"rgb(" +
				channel(a.r, b.r) + "," +
				channel(a.g, b.g) + "," +
				channel(a.b, b.b) +
				")"
			);
		}


		/** HSL helpers: the stop-to-stop transition runs along the hue wheel. */
		function rgbToHsl(r, g, b) {
			r = r / 255; g = g / 255; b = b / 255;
			var max = Math.max(r, g, b);
			var min = Math.min(r, g, b);
			var h = 0;
			var s = 0;
			var l = (max + min) / 2;
			if (max !== min) {
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				else if (max === g) h = ((b - r) / d + 2) / 6;
				else h = ((r - g) / d + 4) / 6;
			}
			return [h * 360, s, l];
		}

		function hslToRgb(h, s, l) {
			h = ((((h % 360) + 360) % 360) / 360);
			var r;
			var g;
			var b;
			if (s === 0) {
				r = g = b = l;
			} else {
				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				function hueToChannel(pp, qq, tt) {
					var t = tt;
					if (t < 0) t += 1;
					if (t > 1) t -= 1;
					if (t < 1 / 6) return pp + (qq - pp) * 6 * t;
					if (t < 1 / 2) return qq;
					if (t < 2 / 3) return pp + (qq - pp) * (2 / 3 - t) * 6;
					return pp;
				}
				r = hueToChannel(p, q, h + 1 / 3);
				g = hueToChannel(p, q, h);
				b = hueToChannel(p, q, h - 1 / 3);
			}
			return [r * 255, g * 255, b * 255];
		}

		/**
		 * Long hue spans are muted at mid-transition: hue still travels clockwise
		 * (blue → orange through magenta), but saturation drops and lightness rises
		 * so the sweep never flashes a vivid pure red.
		 */
		var LONG_SPAN_DEG = 100;
		var MID_DESAT = 0.55;
		var MID_LIGHT = 0.66;
		var MID_LIFT = 0.6;

		/**
		 * Shorter spans (green → blue, orange → ...) also pass through hues that are
		 * brighter than both endpoints (green → blue goes through vivid cyan). They
		 * get a gentler mid-transition mute plus a cyan-band cap, both scaled by the
		 * sine envelope so the exact stop colours at t=0/1 are untouched.
		 */
		var SHORT_SPAN_DEG = 24;
		var SHORT_DESAT = 0.34;
		var SHORT_LIFT = 0.35;
		var SHORT_LIGHT = 0.5;
		var CYAN_BAND_MIN = 165;
		var CYAN_BAND_MAX = 200;
		var CYAN_SAT_CAP = 0.46;

		/**
		 * Interpolate two stop tones along the hue wheel in the increasing
		 * (clockwise) direction, so blue → orange passes through magenta/purple
		 * instead of turning muddy. Neutral stops with almost no saturation
		 * fall back to a plain RGB blend.
		 */
		function mixTone(from, to, t) {
			var a = hexToRgb(from);
			var b = hexToRgb(to);
			if (a === null || b === null) return from || NEUTRAL;
			var hslA = rgbToHsl(a.r, a.g, a.b);
			var hslB = rgbToHsl(b.r, b.g, b.b);
			if (hslA[1] < 0.12 || hslB[1] < 0.12) return mix(from, to, t);
			var delta = ((hslB[0] - hslA[0]) % 360 + 360) % 360;
			var hue = (hslA[0] + delta * t) % 360;
			var sat = hslA[1] + (hslB[1] - hslA[1]) * t;
			var light = hslA[2] + (hslB[2] - hslA[2]) * t;
			var bell = Math.sin(Math.PI * t);
			if (delta > LONG_SPAN_DEG) {
				sat = sat * (1 - MID_DESAT * Math.pow(bell, 1.2));
				light = light + (MID_LIGHT - light) * MID_LIFT * bell;
				// Near the red phase the muted envelope alone is not enough: cap the
				// chroma and keep the tone light so it never out-shouts the orange stop.
				if (hue >= 340 || hue <= 15) {
					sat = Math.min(sat, 0.55);
					light = Math.max(light, 0.62);
				}
			} else if (delta >= SHORT_SPAN_DEG) {
				sat = sat * (1 - SHORT_DESAT * bell);
				light = light + (SHORT_LIGHT - light) * SHORT_LIFT * bell;
			}
			// Cyan / teal is the brightest hue region between green and blue: cap its
			// chroma so the drag passes through a muted teal, not a neon cyan. The bell
			// factor keeps the exact stop colours untouched at both ends.
			if (bell > 0.02 && hue >= CYAN_BAND_MIN && hue <= CYAN_BAND_MAX) {
				sat = sat + (Math.min(sat, CYAN_SAT_CAP) - sat) * bell;
				light = light + (Math.min(light, 0.54) - light) * 0.5 * bell;
			}
			sat = Math.min(1, Math.max(0, sat));
			light = Math.min(1, Math.max(0, light));
			var rgb = hslToRgb(hue, sat, light);
			return "rgb(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ")";
		}
		function rgba(hex, alpha) {
			var c = hexToRgb(hex);
			return "rgba(" + c.r + "," + c.g + "," + c.b + "," + alpha + ")";
		}

		/** Same as rgba() but also accepts the "rgb(r,g,b)" strings that mixTone returns. */
		function toneAlpha(color, alpha) {
			if (typeof color === "string" && color.indexOf("rgb") === 0) {
				var match = color.match(/rgba?\(([^)]+)\)/);
				if (match !== null) {
					var parts = match[1].split(",");
					return (
						"rgba(" +
						String(parts[0]).trim() + "," +
						String(parts[1]).trim() + "," +
						String(parts[2]).trim() + "," +
						alpha +
						")"
					);
				}
			}
			return rgba(color, alpha);
		}

		var GREEN = "#2fbf71";
		var BLUE = "#3b82f6";
		var ORANGE = "#f97316";
		/** Neutral tone used for the "off" stop and unknown levels. */
		var NEUTRAL = "#5b6270";

		/** Known effort ids map to the requested color language. */
		var LEVEL_COLORS = {
			off: null,
			none: null,
			disabled: null,
			minimal: "#84cc16",
			min: "#84cc16",
			low: GREEN,
			lite: "#22c55e",
			light: "#22c55e",
			medium: "#22d3ee",
			mid: "#22d3ee",
			normal: BLUE,
			high: BLUE,
			higher: BLUE,
			xhigh: ORANGE,
			"extra-high": ORANGE,
			extra: ORANGE,
			max: ORANGE,
			maximum: ORANGE,
			ultra: "#ef4444",
			highest: "#ef4444"
		};

		function fallbackColor(index, total) {
			if (total <= 1) return BLUE;
			var t = index / (total - 1);
			if (t <= 0.5) return mix(GREEN, BLUE, t / 0.5);
			return mix(BLUE, ORANGE, (t - 0.5) / 0.5);
		}

		/** Resolve the accent color for one effort stop (null = no effect). */
		function effortColor(effort, index, total) {
			var id = String(effort && effort.id !== undefined ? effort.id : "").toLowerCase();
			var name = String(effort && effort.name !== undefined ? effort.name : "").toLowerCase();
			if (Object.prototype.hasOwnProperty.call(LEVEL_COLORS, id)) return LEVEL_COLORS[id];
			for (var key in LEVEL_COLORS) {
				if (name.indexOf(key) !== -1) return LEVEL_COLORS[key];
			}
			if (id === "off" || id === "none") return null;
			return fallbackColor(index, total);
		}


		// #endregion

		// #region shared bits ---------------------------------------------------

		function Chip(label, options) {
			return h(
				"button",
				{
					ref: options.buttonRef,
					type: "button",
					className: "dsh-mec-chip",
					"data-mec-chip": options.name,
					disabled: options.disabled === true,
					"aria-label": options.ariaLabel,
					"aria-haspopup": options.hasPopup,
					"aria-expanded": options.open === true,
					title: options.title,
					onClick: options.onClick,
					onMouseDown: function (event) {
						if (options.keepFocus !== true) event.preventDefault();
					}
				},
				options.icon !== undefined ? h(options.icon, { size: 16, className: "dsh-mec-chip-icon" }) : null,
				h("span", { className: "dsh-mec-chip-text" }, label),
				options.chevron === false
					? null
					: h(IconChevronDownOutlineRegular, { size: 12, className: "dsh-mec-chip-chev" })
			);
		}

		function copyText(text) {
			try {
				if (navigator.clipboard !== undefined && navigator.clipboard.writeText !== undefined) {
					return navigator.clipboard.writeText(text);
				}
			} catch (failure) {
				/* fall through */
			}
			try {
				var area = document.createElement("textarea");
				area.value = text;
				area.setAttribute("readonly", "readonly");
				area.style.position = "fixed";
				area.style.opacity = "0";
				document.body.appendChild(area);
				area.select();
				document.execCommand("copy");
				area.remove();
			} catch (failure) {
				/* ignore */
			}
			return Promise.resolve();
		}

		// #endregion

		// #region effort popover ------------------------------------------------

		function EffortSlider(props) {
			var efforts = props.efforts;
			var colors = props.colors;
			var selectedIndex = props.index;
			var disabled = props.disabled;
			var onSelect = props.onSelect;
			var onTone = props.onTone;
			var t = props.t;

			var trackRef = React.useRef(null);
			var dragRef = React.useRef(null);
			var dragRectRef = React.useRef(null);
			var stateDrag = React.useState(null);
			var drag = stateDrag[0];
			var setDrag = stateDrag[1];
			var stateFocus = React.useState(false);
			var focused = stateFocus[0];
			var setFocused = stateFocus[1];

			var count = efforts.length;
			var safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
			var selectedPosition = count <= 1 ? 0 : safeIndex / (count - 1);
			var position = drag === null ? selectedPosition : drag;
			var percent = Math.round(position * 1000) / 10;
			var trackColor = toneAt(position);
			var haloColor = toneAlpha(trackColor, focused ? 0.5 : 0.32);
			var knobGlow = toneAlpha(trackColor, 0.42);

			/**
			 * The whole track takes a single tone. While dragging, the tone is
			 * interpolated between the two neighbouring stops, so it continuously
			 * blends while moving and lands exactly on a stop's colour when snapped.
			 */
			function toneAt(ratio) {
				if (count <= 1) return colors[0] || NEUTRAL;
				var scaled = Math.min(1, Math.max(0, ratio)) * (count - 1);
				var left = Math.floor(scaled);
				var right = Math.min(count - 1, left + 1);
				var fraction = scaled - left;
				var from = colors[left] || NEUTRAL;
				var to = colors[right] || NEUTRAL;
				if (fraction <= 0) return from;
				if (fraction >= 1) return to;
				return mixTone(from, to, fraction);
			}

			function ratioAt(clientX) {
				var rect = dragRectRef.current;
				if (rect === null || rect === undefined) {
					var node = trackRef.current;
					if (node === null) return 0;
					rect = node.getBoundingClientRect();
				}
				if (rect.width <= 0) return 0;
				return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
			}

			React.useEffect(function () {
				if (typeof onTone !== "function") return undefined;
				onTone(drag === null ? null : trackColor);
				return function () {
					onTone(null);
				};
			}, [drag, trackColor, onTone]);

			function nearestIndex(ratio) {
				if (count <= 1) return 0;
				return Math.round(ratio * (count - 1));
			}

			function commit(index) {
				if (index < 0 || index >= count) return;
				if (index === safeIndex) return;
				onSelect(efforts[index], index);
			}

			function handlePointerDown(event) {
				if (disabled) return;
				if (event.button !== undefined && event.button !== 0) return;
				event.preventDefault();
				var node = trackRef.current;
				if (node === null) return;
				try {
					node.setPointerCapture(event.pointerId);
				} catch (failure) {
					/* ignore */
				}
				try {
					var liveRect = node.getBoundingClientRect();
					dragRectRef.current = { left: liveRect.left, width: liveRect.width };
				} catch (failure) {
					dragRectRef.current = null;
				}
				setFocused(true);
				dragRef.current = ratioAt(event.clientX);
				setDrag(dragRef.current);
			}

			function handlePointerMove(event) {
				if (dragRef.current === null) return;
				dragRef.current = ratioAt(event.clientX);
				setDrag(dragRef.current);
			}

			function handlePointerUp(event) {
				if (dragRef.current === null) return;
				var ratio = ratioAt(event.clientX);
				dragRef.current = null;
				dragRectRef.current = null;
				setDrag(null);
				commit(nearestIndex(ratio));
			}

			function handlePointerCancel() {
				dragRef.current = null;
				dragRectRef.current = null;
				setDrag(null);
			}

			var stopNodes = efforts.map(function (effort, index) {
				return h(
					"div",
					{
						key: effort.id !== undefined ? effort.id : "stop-" + index,
						className: "dsh-mec-stop",
						"data-active": index === safeIndex,
						role: "presentation",
						style: { left: (count <= 1 ? 0 : (index / (count - 1)) * 100) + "%" },
						onClick: function () {
							if (!disabled) commit(index);
						}
					},
					effort.name !== undefined && effort.name !== null && effort.name !== ""
						? effort.name
						: effort.id
				);
			});

			return h(
				"div",
				{ className: "dsh-mec-slider" },
				h(
					"div",
					{
						ref: trackRef,
						className: "dsh-mec-slider-inner",
						role: "slider",
						tabIndex: disabled ? -1 : 0,
						"aria-label": t("effortTitle"),
						"aria-valuemin": 0,
						"aria-valuemax": Math.max(0, count - 1),
						"aria-valuenow": safeIndex,
						"aria-valuetext": efforts[safeIndex] !== undefined ? String(efforts[safeIndex].name || efforts[safeIndex].id) : "",
						"aria-disabled": disabled === true,
						onPointerDown: handlePointerDown,
						onPointerMove: handlePointerMove,
						onPointerUp: handlePointerUp,
						onPointerCancel: handlePointerCancel,
						onLostPointerCapture: handlePointerCancel,
						onFocus: function () { setFocused(true); },
						onBlur: function () { setFocused(false); },
						style: { "--mec-halo": haloColor }
					},
					h("div", { className: "dsh-mec-track" }),
					h("div", { className: "dsh-mec-fill", style: { width: percent + "%", background: trackColor } }),
					h("div", { className: "dsh-mec-stars", style: { width: percent + "%" } }),
					h("div", {
						className: "dsh-mec-knob",
						style: {
							left: percent + "%",
							boxShadow:
								"0 0 0 2px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.35), 0 0 0 4px " +
								haloColor +
								", 0 0 18px " +
								knobGlow
						}
					})
				),
				h("div", { className: "dsh-mec-stops" }, stopNodes)
			);
		}

		function EffortPopover(props) {
			var t = props.t;
			var efforts = props.efforts;
			var colors = props.colors;
			var index = props.index;
			var onSelect = props.onSelect;
			var onClose = props.onClose;
			var rect = props.rect;
			var disabled = props.disabled;
			var onTone = props.onTone;
			var stateCopied = React.useState(false);
			var copied = stateCopied[0];
			var setCopied = stateCopied[1];
			var ref = React.useRef(null);

			React.useEffect(function () {
				function onPointerDown(event) {
					var node = ref.current;
					if (node !== null && node.contains(event.target)) return;
					var chip = event.target !== null && event.target.closest !== undefined
						? event.target.closest("[data-mec-chip]")
						: null;
					if (chip !== null) return;
					onClose();
				}
				function onKey(event) {
					if (event.key === "Escape") {
						event.preventDefault();
						onClose();
					}
				}
				document.addEventListener("pointerdown", onPointerDown, true);
				document.addEventListener("keydown", onKey, true);
				return function () {
					document.removeEventListener("pointerdown", onPointerDown, true);
					document.removeEventListener("keydown", onKey, true);
				};
			}, [onClose]);

			// Theme menu surfaces can be translucent; composite an opaque equivalent on
			// mount so the transcript never shines through the panel.
			React.useEffect(function () {
				var node = ref.current;
				if (node === null) return;
				var computed = window.getComputedStyle(node).backgroundColor;
				var match = /rgba?\(([^)]+)\)/.exec(computed || "");
				if (match === null) return;
				var parts = match[1].split(",");
				var alpha = parts.length > 3 ? Number(parts[3]) : 1;
				if (alpha >= 0.999) return;
				var base = [255, 255, 255];
				var behind = window.getComputedStyle(document.body).backgroundColor;
				var behindMatch = /rgba?\(([^)]+)\)/.exec(behind || "");
				if (behindMatch !== null) {
					var behindParts = behindMatch[1].split(",");
					var behindAlpha = behindParts.length > 3 ? Number(behindParts[3]) : 1;
					if (behindAlpha >= 0.999) {
						base = [Number(behindParts[0]), Number(behindParts[1]), Number(behindParts[2])];
					}
				}
				node.style.backgroundColor =
					"rgb(" +
					Math.round(Number(parts[0]) * alpha + base[0] * (1 - alpha)) + ", " +
					Math.round(Number(parts[1]) * alpha + base[1] * (1 - alpha)) + ", " +
					Math.round(Number(parts[2]) * alpha + base[2] * (1 - alpha)) +
					")";
			}, []);

			if (rect === null || rect === undefined) return null;

			var width = 320;
			var viewportWidth = window.innerWidth;
			var viewportHeight = window.innerHeight;
			var left = Math.min(Math.max(8, rect.right - width), Math.max(8, viewportWidth - width - 8));
			// The composer sits at the bottom of the window, so the panel normally opens
			// upward; near the top of the viewport (or in short windows) it opens downward.
			var spaceBelow = viewportHeight - rect.bottom;
			var opensDownward = rect.top < 260 && spaceBelow > 220;
			var style = { left: left + "px" };
			if (opensDownward) style.top = Math.round(rect.bottom + 8) + "px";
			else style.bottom = Math.round(Math.max(8, viewportHeight - rect.top + 8)) + "px";

			var hasLevels = efforts.length > 0;
			var currentName = hasLevels
				? (efforts[index] !== undefined ? String(efforts[index].name || efforts[index].id) : "")
				: "";

			var head = h(
				"div",
				{ className: "dsh-mec-pop-head" },
				h("span", { className: "dsh-mec-pop-title" }, t("effortTitle")),
				hasLevels ? h("span", { className: "dsh-mec-pop-value" }, currentName) : null
			);

			var body;
			if (hasLevels) {
				body = h(EffortSlider, {
					efforts: efforts,
					colors: colors,
					index: index,
					disabled: disabled,
					onSelect: onSelect,
					onTone: onTone,
					t: t
				});
			} else {
				body = h(
					"div",
					{ className: "dsh-mec-guide" },
					h("div", { className: "dsh-mec-guide-title" }, t("guideTitle")),
					h("div", { className: "dsh-mec-guide-body" }, t("guideBody")),
					h("pre", null, YAML_SAMPLE),
					h(
						"div",
						{ className: "dsh-mec-guide-actions" },
						h(
							"button",
							{
								type: "button",
								className: "dsh-mec-copy",
								onClick: function () {
									copyText(YAML_SAMPLE);
									setCopied(true);
									setTimeout(function () { setCopied(false); }, 1600);
								}
							},
							copied ? t("copied") : t("copy")
						)
					),
					h("div", { className: "dsh-mec-guide-tip" }, t("guideTip"))
				);
			}

			return ReactDOM.createPortal(
				h("div", { ref: ref, className: "dsh-mec-pop", style: style, role: "dialog", "aria-label": t("effortTitle") }, head, body),
				document.body
			);
		}

		// #endregion

		// #region controls body -------------------------------------------------

		/** Cross-instance hook used by the Shift+Tab shortcut command. */
		var cycleRef = { current: null };

		/** Reasoning-effort chip + slider; registered in the composer control row. */
		function ControlsBody(props) {
			var directory = props.directory;
			var select = props.select;
			var load = props.load;
			var t = props.t;

			var state = React.useSyncExternalStore(
				function (onStoreChange) { return directory.subscribe(onStoreChange); },
				function () { return directory.getSnapshot(); }
			);

			React.useEffect(function () {
				load();
			}, [directory]);

			var effortOpenPair = React.useState(false);
			var effortOpen = effortOpenPair[0];
			var setEffortOpen = effortOpenPair[1];
			var effortRectPair = React.useState(null);
			var effortRect = effortRectPair[0];
			var setEffortRect = effortRectPair[1];
			var liveTonePair = React.useState(null);
			var liveTone = liveTonePair[0];
			var setLiveTone = liveTonePair[1];
			// Optimistic stop while a select() is in flight so the knob does not jump
			// back to the previous level before the directory confirms the new one.
			var pendingEffortPair = React.useState(null);
			var pendingEffort = pendingEffortPair[0];
			var setPendingEffort = pendingEffortPair[1];

			React.useEffect(function () {
				if (pendingEffort === null) return undefined;
				var current = state.current;
				if (
					current !== null &&
					current !== undefined &&
					current.provider === pendingEffort.provider &&
					current.model === pendingEffort.model
				) {
					var confirmed = current.reasoningEffort === undefined ? null : current.reasoningEffort;
					if (confirmed === pendingEffort.value) {
						setPendingEffort(null);
						return undefined;
					}
				}
				// Safety net: if the directory never reports the optimistic level back
				// (a failed/ignored select), drop the optimistic state after a while.
				var timer = setTimeout(function () { setPendingEffort(null); }, 2500);
				return function () { clearTimeout(timer); };
			}, [pendingEffort, state]);
			var errorPair = React.useState(null);
			var error = errorPair[0];
			var setError = errorPair[1];

			var rowRef = React.useRef(null);
			var effortChipRef = React.useRef(null);

			var groups = state.groups || [];
			var busy = state.pending !== null || state.status === "selecting";

			var currentChoice = null;
			if (state.current !== null && state.current !== undefined) {
				for (var gi = 0; gi < groups.length; gi++) {
					var group = groups[gi];
					for (var mi = 0; mi < group.models.length; mi++) {
						var model = group.models[mi];
						if (group.id === state.current.provider && model.id === state.current.model) {
							currentChoice = { group: group, model: model };
							break;
						}
					}
					if (currentChoice !== null) break;
				}
			}

			var reasoning = currentChoice !== null ? currentChoice.model.reasoning : undefined;
			var efforts = reasoning !== undefined && reasoning.efforts !== undefined ? reasoning.efforts : [];
			var effortColors = [];
			for (var ei = 0; ei < efforts.length; ei++) {
				effortColors.push(effortColor(efforts[ei], ei, efforts.length));
			}

			var effectiveEffort;
			if (state.current !== null && state.current !== undefined && state.current.reasoningEffort !== undefined) {
				effectiveEffort = state.current.reasoningEffort;
			} else if (reasoning !== undefined && reasoning.defaultEffort !== undefined) {
				effectiveEffort = reasoning.defaultEffort;
			}

			var selectedIndex = -1;
			for (var si = 0; si < efforts.length; si++) {
				if (efforts[si].id === effectiveEffort) {
					selectedIndex = si;
					break;
				}
			}

			var displayIndex = selectedIndex;
			if (pendingEffort !== null) {
				displayIndex = -1;
				if (pendingEffort.value !== null && pendingEffort.value !== undefined) {
					for (var di = 0; di < efforts.length; di++) {
						if (efforts[di].id === pendingEffort.value) {
							displayIndex = di;
							break;
						}
					}
				}
			}

			var effortLabel;
			if (currentChoice !== null) {
				if (reasoning === undefined) {
					effortLabel = state.retainedEffort;
				} else if (effectiveEffort === undefined) {
					effortLabel = t("providerDefault");
				} else {
					effortLabel = effectiveEffort;
					for (var li = 0; li < efforts.length; li++) {
						if (efforts[li].id === effectiveEffort) effortLabel = efforts[li].name || efforts[li].id;
					}
				}
			}
			if (effortLabel === undefined || effortLabel === null || effortLabel === "") {
				effortLabel = t("providerDefault");
			}
			if (pendingEffort !== null) {
				effortLabel = pendingEffort.value === null || pendingEffort.value === undefined ? t("providerDefault") : pendingEffort.value;
				for (var pl = 0; pl < efforts.length; pl++) {
					if (efforts[pl].id === pendingEffort.value) effortLabel = efforts[pl].name || efforts[pl].id;
				}
			}

			var effortDisabled = busy || currentChoice === null;

			function submit(selection) {
				try {
					var result = select(selection);
					if (result !== null && result !== undefined && typeof result.then === "function") {
						result.then(
							function (outcome) {
								if (outcome !== null && outcome !== undefined && outcome.error !== undefined && outcome.error !== null) {
									setPendingEffort(null);
									setError(String(outcome.error));
									load();
								}
							},
							function (failure) {
								setPendingEffort(null);
								setError(String(failure));
								load();
							}
						);
					}
				} catch (failure) {
					setPendingEffort(null);
					setError(String(failure));
					load();
				}
			}

			function applyEffort(effortId) {
				if (state.current === null || state.current === undefined) return;
				var wanted = effortId === undefined ? null : effortId;
				if (pendingEffort !== null && pendingEffort.value === wanted) return;
				if (pendingEffort === null && effectiveEffort === effortId) return;
				var selection = { provider: state.current.provider, model: state.current.model };
				if (effortId !== undefined) selection.reasoningEffort = effortId;
				setPendingEffort({
					provider: state.current.provider,
					model: state.current.model,
					value: wanted
				});
				setError(null);
				submit(selection);
			}

			function selectEffort(effort, index) {
				applyEffort(effort.id);
			}

			var cycle = React.useCallback(
				function () {
					if (busy || pendingEffort !== null || efforts.length === 0) return;
					// Cycle the active stops only (skip the "off" level): low → high → low…
					var active = [];
					for (var i = 0; i < efforts.length; i += 1) {
						var id = String(efforts[i].id || "");
						var name = String(efforts[i].name || "");
						if (id.toLowerCase() === "off" || name.toLowerCase() === "off") continue;
						active.push(i);
					}
					if (active.length === 0) active = efforts.map(function (_, index) { return index; });
					var next = active[0];
					for (var j = 0; j < active.length; j += 1) {
						if (active[j] > displayIndex) { next = active[j]; break; }
					}
					applyEffort(efforts[next].id);
				},
				[busy, efforts, displayIndex, effectiveEffort, state.current, pendingEffort]
			);

			React.useEffect(function () {
				cycleRef.current = cycle;
				return function () {
					if (cycleRef.current === cycle) cycleRef.current = null;
				};
			}, [cycle]);

			// Composer border follows the effort (optimistic while selecting), and while
			// dragging it follows the tone the track is currently showing.
			var hasLevels = efforts.length > 0;
			var accent = null;
			if (hasLevels) {
				accent = displayIndex >= 0 ? effortColors[displayIndex] || NEUTRAL : NEUTRAL;
			}
			var borderTone = liveTone !== null && liveTone !== undefined ? liveTone : accent;
			var borderKey = borderTone === null || borderTone === undefined ? "none" : borderTone;
			React.useEffect(function () {
				var row = rowRef.current;
				if (row === null) return undefined;
				var card = row.closest !== undefined ? row.closest(CARD_SELECTOR) : null;
				if (card === null) return undefined;
				// The composer card uses `border:0` plus an elevation box-shadow, so a real
				// CSS border would never render. Draw a 1px inset ring instead: it does not
				// change layout, and pair it with a soft outer glow.
				var previousShadow = card.style.boxShadow;
				var base = previousShadow;
				if (base === "" || base === undefined) {
					try {
						base = window.getComputedStyle(card).boxShadow;
					} catch (failure) {
						base = "";
					}
				}
				if (base === "none" || base === undefined) base = "";
				if (borderKey === "none") {
					card.style.boxShadow = previousShadow;
				} else {
					// 1px coloured inset border + soft outer glow; both stay as long as a
					// level is selected (including `off`, which uses the neutral tone).
					var solid = toneAlpha(borderKey, 0.9);
					var glow = toneAlpha(borderKey, 0.32);
					var ring = "inset 0 0 0 1px " + solid + ", 0 0 22px " + glow;
					card.style.boxShadow = base === "" ? ring : ring + ", " + base;
				}
				return function () {
					card.style.boxShadow = previousShadow;
				};
			}, [borderKey]);

			function openEffortPopover() {
				var node = effortChipRef.current;
				if (node !== null && node.getBoundingClientRect !== undefined) {
					setEffortRect(node.getBoundingClientRect());
				}
				setEffortOpen(true);
			}

			var effortChip = Chip(effortLabel, {
				name: "effort",
				icon: IconGaugeOutlineRegular,
				ariaLabel: t("effortAria"),
				hasPopup: "dialog",
				open: effortOpen,
				disabled: effortDisabled,
				buttonRef: effortChipRef,
				title: t("effort") + ": " + effortLabel,
				onClick: function () {
					if (effortDisabled) return;
					if (effortOpen) setEffortOpen(false);
					else openEffortPopover();
				}
			});

			var children = [effortChip];

			if (effortOpen) {
				children.push(
					h(EffortPopover, {
						key: "effort-popover",
						t: t,
						efforts: efforts,
						colors: effortColors,
						index: displayIndex,
						disabled: busy,
						onSelect: selectEffort,
						onClose: function () { setEffortOpen(false); setLiveTone(null); },
						onTone: setLiveTone,
						rect: effortRect
					})
				);
			}

			var errorNode =
				error !== null
					? h("span", { key: "error", className: "dsh-mec-error", role: "status" }, t("failed"))
					: null;

			return h(
				"div",
				{
					ref: rowRef,
					className: "dsh-mec-row",
					role: "group",
					"aria-label": t("groupAria")
				},
				children.concat([errorNode])
			);
		}

		function ReasoningEffortControl(props) {
			if (props.available !== true || props.directory === undefined) return null;
			return h(ControlsBody, props);
		}

		// #endregion

		function apply(ctx) {
			var t = ctx.locale.bind(NS);

			ctx.effect(
				function () {
					return ctx.locale.register(NS, { zh: zh, en: en });
				},
				"composer-model-controls: dictionaries"
			);

			ctx.effect(
				function () {
					ensureStyles();
					return function () { removeStyles(); };
				},
				"composer-model-controls: styles"
			);

			ctx.inject(["slots", "modelDirectories", "sessions"], function (scope) {
				var slots = scope.slots;
				var modelDirectories = scope.modelDirectories;
				var sessions = scope.sessions;

				function makeInject(sessionId) {
					try {
						if (sessions.subagentAddress(sessionId) !== undefined) return { available: false };
						var directory = modelDirectories.directoryFor(sessionId);
						return {
							available: true,
							directory: directory.store,
							load: function () {
								directory.load().catch(function () {});
							},
							select: function (selection) {
								return directory.select(selection);
							}
						};
					} catch (failure) {
						return { available: false };
					}
				}

				// The reasoning-effort chip lives in the composer's compact-controls
				// row (`conversation.input.right`), which DSH renders immediately
				// before the built-in model seat and the submit button. We do NOT
				// shadow `conversation.input.model`: keeping the built-in model
				// menu intact preserves its child options (e.g. the
				// "启用智能体团队协作" toggle registered by dsh-client-ui-agent-team).
				slots.inject("conversation.input.right", function () {
					return slots.register(
						{
							name: "conversation.input.right",
							id: "reasoning-effort-controls",
							order: 10,
							locale: NS,
							inject: makeInject
						},
						ReasoningEffortControl
					);
				});
			});

			// Shift+Tab cycles the reasoning effort from low to high.
			ctx.inject(["shortcuts"], function (scope) {
				var registered = false;
				try {
					ctx.effect(
						function () {
							return scope.shortcuts.register({
								id: "composer.effort.cycle",
								label: function () { return t("cycleEffort"); },
								aliases: ["cycle reasoning effort", "切换推理等级"],
								regions: ["page", "editable", "terminal"],
								modals: [],
								defaults: {
									"desktop:windows": { code: "Tab", modifiers: ["shift"] },
									"desktop:macos": { code: "Tab", modifiers: ["shift"] },
									"desktop:linux": { code: "Tab", modifiers: ["shift"] }
								},
								resolve: function () {
									var handler = cycleRef.current;
									if (handler === null) return { status: "pass" };
									return {
										status: "handled",
										run: function () { handler(); }
									};
								}
							});
						},
						"composer-model-controls: shortcut"
					);
					registered = true;
				} catch (failure) {
					registered = false;
				}
				if (!registered) {
					// Fallback for shells without the shortcuts service or when the
					// binding collides: capture Shift+Tab on the document.
					ctx.effect(
						function () {
							function onKeyDown(event) {
								if (event.key !== "Tab" || !event.shiftKey) return;
								if (event.ctrlKey || event.metaKey || event.altKey) return;
								var handler = cycleRef.current;
								if (handler === null) return;
								event.preventDefault();
								event.stopPropagation();
								handler();
							}
							document.addEventListener("keydown", onKeyDown, true);
							return function () {
								document.removeEventListener("keydown", onKeyDown, true);
							};
						},
						"composer-model-controls: shift-tab fallback"
					);
				}
			});
		}

		exports.apply = apply;
		exports.inject = ["locale", "slots", "modelDirectories", "sessions"];
		return module.exports;
	}
});
