# Changelog

本文件记录 `dsh-composer-model-controls` 的版本迭代，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

> 说明：`0.1.0` – `0.4.4` 是插件在本地开发、实机验证期间的迭代版本，未公开发布；`0.4.5` 是首个公开发布版本；`0.5.0` 适配 DSH `0.2.2-rc.3` 的输入框布局，是当前最新版本。

## [0.5.0] - 2026-11-18

### Changed

- **只接管推理强度，不再替换内置模型 chip**：DSH `0.2.2-rc.3` 的模型菜单新增「启用智能体团队协作」等选项（注册在 `conversation.input.model.options` 插槽）。插件此前用 `priority: -1` 阴影整个 `conversation.input.model` 座位，导致这些子插槽不再声明、团队协作开关消失。
- 推理强度控件改为注册在 `conversation.input.right`（`id: reasoning-effort-controls`，`order: 10`），渲染在内置模型 chip 左侧、发送按钮之前；删除对 `conversation.input.model` 的阴影注册与 `conversation.hero.options` 注册。
- 代码同步精简：移除模型 chip、`Menu` 模型列表、模型选择状态与文案（保留模型目录查询仅用于读取当前模型的 `reasoning.efforts`），组件更名为 `ReasoningEffortControl`。

### Verification

- DSH `0.2.2-rc.3` 实机：UIA 可见 `选择推理等级`（我们）与 `选择模型，当前 DeepSeek-V4.1-Flash，推理等级 High`（内置），两者同一行且推理强度在左；打开内置模型菜单可见 `模型与推理等级`，菜单内 `启用智能体团队协作` 文本/开关仍在。
- 独立预览 `tools/preview`：mock 行改为「推理强度 chip + 内置模型 chip + 发送」，`clean-high/dragmid/off/max` 重新出图并替换 `assets/screenshot-1..4.png`。

### Docs

- README 中英文改为“只接管推理强度、内置模型菜单保持不变”，更新位置说明、兼容性（已在 rc.3 验证）、验证记录与市场截图。

## [0.4.5] - 2026-11-10

### Fixed

- **绿→蓝过渡经过荧光青**：`Low` 绿到 `High` 蓝的短跨度（约 68°）此前只按色相插值，中点落在高饱和、高亮度的青色（`rgb(45,219,226)`），比两端的蓝色更抢眼。现在对所有较短跨度（≥ `SHORT_SPAN_DEG = 24`）增加温和的中段柔化，并对过渡中进入青/蓝绿区间（`CYAN_BAND_MIN..MAX = 165..200`）的颜色做色度上限（`CYAN_SAT_CAP = 0.46`）与亮度上限；两个上限都乘以 `sin(πt)` 包络，因此**两端档位色保持精确**，只影响中间过渡。

### Verification

- 站点采样（`tools/preview` 的 `preview-shortspan.html`，`Low → High` 之间拖动）：
  - 修复前：33% `rgb(47,191,113)`、42% `rgb(41,215,173)`、50% `rgb(45,219,226)`、56% `rgb(50,188,234)`；
  - 修复后：33% `rgb(47,191,113)`（不变）、42% `rgb(61,188,159)`、50% `rgb(77,185,189)`、56% `rgb(61,166,194)`，峰值通道从 226 降到 189，中点变为柔和的青灰蓝；
  - 档位端色不变（`High` 仍是 `rgb(59,130,246)`）。
- 长跨度（`High` 蓝 → `Max` 橙）不受影响：95% 采样仍为 `rgb(211,105,106)` 鲑粉、无鲜红。
- 中性色与 `Off` 的过渡仍走 RGB 混合，不经过青/红区间限幅。

### Docs

- README 中文与英文介绍补充 **Pi Harness 风格强度配色** 的说明（推理强度轨道与输入框描边随调整渐变、`Shift + Tab` 快捷切换），并同步更新 `docs/iterations.zh.md` 的目标说明与市场条目描述文案。

## [0.4.4] - 2026-11-10

### Changed

- 输入卡片彩色描边由 2px 收细为 **1px**（`inset 0 0 0 1px`），保留 22px 外柔光（`0 0 22px`）；颜色仍随轨道实时同步，`Off` 使用中性色 `#5b6270`。
- 描边继续用 `box-shadow` 的内描边实现，不触碰 DSH 卡片的 `border:0`，不改变卡片高度与布局。

### Fixed

- 澄清并处理开发期遗留问题：DSH 主窗口曾被截图自动化脚本留下的 `WS_EX_TOPMOST` 置顶，现已用 `SetWindowPos(hwnd, HWND_NOTOPMOST, …)` 清除；与插件代码无关，插件不设置任何窗口置顶属性。

### Docs

- `README.md` 补齐 v4.3 / v4.4 行为说明、验证记录与版本历史入口。
- 新增 `CHANGELOG.md`（本文件）与 `docs/iterations.zh.md`（中文迭代记录）。

### Verification

- 独立预览：`assets/screenshot-1.png`（High）、`screenshot-2.png`（拖动中）、`screenshot-3.png`（Off）、`screenshot-4.png`（Max）。
- 诊断串：`inset 0 0 0 1px rgba(tone, .9), 0 0 22px rgba(tone, .32), <原 elevation>`，卡片高度保持 113px。
- 实机（DSH 桌面版 0.2.2-rc.1）：输入卡片底行模型 / 推理强度 chip 正常，`/model` 同步。

## [0.4.3] - 2026-11-10

### Added

- **乐观档位（optimistic pending）**：`select()` 提交期间滑块旋钮、chip 文案与边框立即停在目标档位，目录确认后再转为正式状态；失败回滚并重新同步（2.5s 安全兜底）。修复了松手吸附时短暂闪回旧档位的问题。
- 滑块光晕（4px halo + 18px glow）与轨道 / 卡片 ring 共用同一实时颜色。

### Changed

- `Off` 档不再清空边框：使用中性色 `#5b6270` 的 ring + 柔光。
- 恢复输入卡片外柔光（22px），松手吸附后常驻。

## [0.4.2] - 2026-11-10

### Fixed

- **描边不可见**：DSH composer 卡片 CSS 为 `border:0`（`.uV2eVG_card`），直接设置 `borderColor/borderWidth` 不渲染；改用 `box-shadow: inset 0 0 0 2px <tone>` 内描边，并在其后追加原 elevation 阴影，卸载时恢复原值。

### Added

- 长色相跨度（`LONG_SPAN_DEG = 100`）过渡柔化：中段按 `sin(πt)` 降低饱和度（`MID_DESAT = 0.55`）、向 `MID_LIGHT = 0.66` 提亮（`MID_LIFT = 0.6`）。
- 红色相位区间限幅：`hue ∈ [340°, 15°]` 时 `sat ≤ 0.55`、`light ≥ 0.62`，避免蓝→橙途中出现比橙色更抢眼的鲜红。

## [0.4.1] - 2026-11-10

### Changed

- `Off` 档最左端由向白色淡出改为向中性色 `#5b6270` 淡出。
- 移除输入卡片外发光（0.4.3 恢复）。
- 档位间过渡改为 **HSL 色相递增（色轮顺时针）** 插值：蓝→橙经过品红/紫色，不再出现灰暗混色；中性色参与过渡时退回 RGB 混合。

## [0.4.0] - 2026-11-10

### Changed

- 只有滑块**左侧**的轨道保留颜色与星尘，右侧为空白底轨。
- 星尘粒子改为由滑块向**左**发射（`@keyframes` 背景位移反向）。
- 档位名（`Off`/`Low`/…）改为绝对定位，中心与对应档位的滑块位置对齐。
- 输入卡片彩色边框与拖动中的轨道实时同色，宽度 2px。

### Fixed

- 拖动中实时颜色为 `rgb(...)` 字符串时被 `rgba()` 按 hex 解析成黑色；新增 `toneAlpha()` 同时接受 hex 与 `rgb()`。

## [0.3.0] - 2026-11-10

### Added

- 整条轨道在档位上显示**单一档位色**（`toneAt()` 在相邻档位色间插值），拖动时连续过渡。
- 弹层不透明化：若主题菜单底色带透明度，则与页面底色合成后写入 `backgroundColor`。
- 拖动跟手优化：移除 `width/left` 的 CSS transition；`pointerdown` 时缓存轨道 `getBoundingClientRect()`，拖动中不再读布局；`dragRef` 作为同步状态源。

### Changed

- 删除方向键 / Home / End 键盘切换（保留 Shift+Tab 循环）。
- 删除面板内的操作说明文字。

## [0.2.0] - 2026-11-10

### Added

- 控件从输入框下方 dock 行移入**输入卡片工具行**（`conversation.input.model`，`priority: -1` 阴影内置 chip），位于权限 chip 右侧、发送按钮左侧；同时保留 `conversation.hero.options` 注册，新会话阶段也可用。
- 推理强度 chip 点开为 **Codex 风格滑块**：档位完全来自 `ModelDirectory` 的 `reasoning.efforts`；拖动/点击轨道，松手吸附最近档位；支持方向键（0.3.0 删除）。
- 轨道渐变 + 星尘特效；输入卡片随档位变色（后续版本改为单色 / 内描边 / 1px + 柔光）。
- 自定义 provider 指引面板：模型未声明 `reasoningEfforts` 时展示建议档位与可复制的 YAML 片段。
- `Shift + Tab` 从低到高循环推理等级（跳过 `Off`），经 `ctx.shortcuts` 注册，冲突时降级为 document 监听。
- 与 `/model` 共用同一个 `ModelDirectory`；选择失败时重新同步并保留上一个已确认档位。

### Fixed

- 组件返回输入行时遗漏了 `children` 数组，导致内置菜单与滑块弹层从未渲染（`aria-expanded` 为 true 但 DOM 里没有弹层）。通过独立预览 harness 定位并修复。

## [0.1.0] - 2026-11-09

### Added

- 首个可用版本：模型 chip 与推理等级 chip 并排渲染在输入框下方的 `conversation.composer.dock` 行，并在 `conversation.hero.options` 注册同一组控件。
- 模型菜单按供应商分组、当前项勾选；推理等级菜单列出当前模型可用档位。
- 阴影（`priority: -1`）内置 `conversation.input.model` 座位，避免双入口；`/model` 命令照常可用。
- 中英文 locale 字典；纯 UI 插件（node 半端空 `apply`），无构建步骤。
- 通过 profile `link:` 依赖安装并在 DSH 桌面版 0.2.2-rc.1 验证。

## 版本兼容

| 插件版本 | DSH | 说明 |
| --- | --- | --- |
| 0.5.0 | `>=0.2.2-rc.1 <0.3.0` | 适配 DSH 0.2.2-rc.3：只接管推理强度，保留内置模型菜单与团队协作开关；实机验证 0.2.2-rc.3 |
| 0.4.5 | `>=0.2.2-rc.1 <0.3.0` | 修复绿→蓝过渡荧光青；实机验证 0.2.2-rc.1 |
| 0.4.4 | `>=0.2.2-rc.1 <0.3.0` | 首个公开版本；实机验证 0.2.2-rc.1 |
| 0.1.0 – 0.4.3 | `0.2.2-rc.1` | 本地迭代版本，未公开发布 |

## 验证命令

```powershell
# 语法检查（Node 使用 DSH 自带的运行时即可）
node --check lib/client.js
node --check lib/index.js

# 独立预览渲染（见 tools/preview/README.md）
node tools/preview/build.mjs

# 打包并核对内容
node scripts/package.mjs
```
