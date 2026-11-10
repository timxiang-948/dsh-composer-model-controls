# dsh-composer-model-controls

把会话的**模型选择**与**推理强度**放在输入框里顺手的位置：和权限控件同一行、发送按钮左侧，点开是 Codex 风格的推理强度滑块。

DSH 默认把模型与推理等级收在输入框工具行的一个小 chip（`/model` 弹层）里，切换推理等级要先开菜单再进二级列表。本插件把这两项直接放到输入卡片内：

- **模型 chip**：按供应商分组列出全部模型，当前项勾选；
- **推理强度 chip**：显示当前档位，点开是滑块面板。

两者都读写 `ctx.modelDirectories` 的同一个 `ModelDirectory`，与 `/model` 共用会话状态，任何一边切换、另一边即时同步。

同时参考 Pi Harness 的思路，为对应推理强度赋予了不同的颜色：推理强度轨道和消息输入框的边框颜色可以随调整而渐变，也可以直接用 `Shift + Tab` 快捷切换推理强度。

现在对模型推理强度的查看和调整变得更加方便直观了。

## 行为细节

### 位置

- 注册在 `conversation.input.model` 插槽（`priority: -1`，阴影内置 chip），因此渲染在输入卡片底行、权限 chip 右侧、发送按钮左侧。
- 新会话 hero 阶段（还没有 dock/工具行数据时）同样的控件通过 `conversation.hero.options` 出现在 workspace/preset 选项行里。
- 子代理（subagent）会话不渲染。

### 推理强度滑块

- 档位完全来自当前模型在 DSH 模型目录中公开的 `reasoning.efforts`：档数、名称、顺序都由模型决定，不做任何硬编码。
- 点击或拖动轨道即可切换，**松手吸附到最近档位**；拖动过程中轨道颜色随位置连续过渡，到达吸附点时稳定落在目标档位颜色。
- **只有滑块左侧的轨道部分有颜色与星尘**，右侧保持空白；颜色为当前档位的单一颜色（不是从左到右的多色渐变）：`Off` 档为中性色 `#5b6270`（最左端向中性灰淡出）、`Low` 绿色、`High` 蓝色、`Max` 橙色，其它自定义档位按顺序在绿→蓝→橙之间插值。
- 两个档位之间过渡时按**色轮顺时针（色相递增）方向**插值，例如 `High` 蓝 → `Max` 橙会经过品红/紫色，而不是混合出灰暗的颜色；中性色参与过渡时退回普通 RGB 混合。
- 对**长跨度**（色相差 >100°）的过渡做柔化：中段降低饱和度并向浅色提亮，靠近红色相位时再额外压低饱和度，因此不会出现比橙色更抢眼的鲜红；短跨度（如 `Low`→`High`）也做温和柔化，进入青/蓝绿区间（165°–200°）时限制色度与亮度，避免绿→蓝途中出现荧光青。相关常量：`LONG_SPAN_DEG`/`MID_DESAT`/`MID_LIGHT`/`MID_LIFT`/`SHORT_SPAN_DEG`/`SHORT_DESAT`/`SHORT_LIFT`/`CYAN_BAND_MIN`/`CYAN_BAND_MAX`/`CYAN_SAT_CAP`。
- 星尘粒子由滑块向**左**发射，叠加在已填充的一段轨道上。
- 档位名（`Off`/`Low`/…）按目标档位在轨道上的百分比绝对定位，与对应位置的滑块中心对齐。
- **滑块光晕同步**：滑块外围的 4px 光晕与 18px 柔光使用和轨道、输入框 ring 相同的实时颜色（拖动中取过渡色，吸附后取档位色）。
- **吸附不闪回**：`select()` 提交期间保留“乐观档位”，滑块的旋钮、chip 文案与边框立即停在目标档位；目录确认后自动转为正式状态，失败则回滚并重新同步（2.5s 安全兜底）。
- **Off 也有描边**：Off 使用中性色 `#5b6270` 的 1px 内描边 + 柔光，不再出现“拉到最左边框消失”。
- **柔光常驻**：输入框 ring 外面带 22px 柔和光晕，松手吸附后保持，不再消失。
- 支持 **Shift + Tab** 从低到高循环切换推理等级（跳过 `Off`，到顶后回到最低档）。快捷键通过 `ctx.shortcuts` 注册；若该 id 已被占用或快捷键服务不可用，自动降级为 document 级 keydown 监听。
- 弹层为不透明面板（主题菜单底色若本身带透明度，会按页面底色合成成不透明色），面板内不再显示额外操作说明文字。
- 消息发送卡片显示 1px 彩色描边 + 外柔光：DSH 卡片本身是 `border:0` + 主题 elevation 阴影，直接改 border 不会渲染，因此插件用 `box-shadow: inset 0 0 0 1px <颜色 90%>, 0 0 22px <颜色 32%>` 在卡片内侧画一圈**内描边**并追加柔光（保留原有 elevation、不挤压布局）。拖动时描边颜色实时跟随轨道，松手后稳定在当前已确认档位的颜色；`Off` 使用中性色描边，不会消失。

### 自定义 provider 指引

如果当前模型在模型目录里没有声明 `reasoning.efforts`（常见于自行接入的 provider），点开推理强度 chip 会显示指引面板：说明在 `cordis.patch.yml` 的 provider `models` 里声明 `reasoningEfforts`，给出建议档位（`off → low → high`，可选 `medium/max`）以及可直接复制的 YAML 片段：

```yaml
my-provider:
  displayName: My Provider
  apiKeyEnv: MY_PROVIDER_API_KEY
  api: openai-completions
  baseURL: https://example.com/v1
  models:
    - id: my-model
      name: My Model
      reasoningEfforts:
        off:            # 关闭推理
        low: low        # 低
        medium: medium  # 中
        high: high      # 高
```

> 说明：`settings.yaml` 是旧版入口（导入后会重命名为 `settings.yaml.imported`），当前配置实际写在 profile 的 `cordis.patch.yml` 里。

### 状态同步与回滚

- 显示以 `ModelDirectory` 快照（`useSyncExternalStore`）为准；`select()` 在途时使用**乐观档位**（旋钮、chip、描边立即停在目标档位），目录确认后转为正式状态，避免吸附后闪回旧档位。
- 提交失败时记录错误、回滚乐观档位并调用 `directory.load()` 重新同步，界面回到**上一个已确认档位**，chip 与真实会话设置不会长期分叉。
- `select()` 进行中（`state.pending !== null` 或 `status === "selecting"`）两个 chip 均禁用，避免并发切换。

## 安装

纯 UI 插件（node 半端为空 `apply`，浏览器半端由 `package.json#dsh.client` 声明，由 `@deepseek-ai/dsh-client-modules` 提供）。

```powershell
# 从 npm（公开发布后）
dsh plugin --profile desktop add dsh-composer-model-controls

# 或本地路径（开发）
dsh plugin --profile desktop add D:\MyProjects\harness\deepseekharness\dsh-composer-model-controls
```

也可以在 DSH 插件管理界面用“本地路径安装”，或从插件市场安装。安装会写入 profile 的 `dependencies` 与 `dsh.profile.bundles`；HMR 会热重组，页面若未更新刷新一次即可。

## 开发

`lib/client.js` 是手写的浏览器模块包（`window.__ModuleLoader__.load({...})` 包装的 CJS 惰性工厂），只依赖 `react`、`react-dom` 与 `@deepseek-ai/dsh-client-ui-primitives` 三个平台基线模块，不需要构建步骤。

```powershell
# profile 里是 link: 依赖，改工作区文件即被监视热重组；也可强制同步一次
Copy-Item .\lib\*.js "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-composer-model-controls\lib\" -Force
```

### 独立预览（无需启动 DSH）

`tools/preview/build.mjs` 会读取真实 `lib/client.js`，用 UMD React + 假的 `ctx`（locale / effect / inject / slots / modelDirectories / sessions / shortcuts）生成 composer 卡片预览页，用于在 headless Edge 中做视觉与交互验证；首次运行会把 React UMD 下载到 `tools/preview/vendor/`：

```powershell
node tools\preview\build.mjs
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --no-first-run --window-size=1240,760 --virtual-time-budget=9000 --screenshot=preview.png "file:///D:/MyProjects/harness/deepseekharness/dsh-composer-model-controls/tools/preview/out/clean-high.html"
```

生成页面：`clean-high/dragmid/off/max`（市场截图用，无诊断框；对应 `assets/screenshot-*.png`）、`preview-closed`、`preview-open`、`preview-dragmid`、`preview-drag`、`preview-cycle`（Shift+Tab）、`preview-guide`（自定义 provider 指引）、`preview-snap`（延迟确认下的乐观吸附）等。

## 验证记录

已在 DSH 桌面版 `0.2.2-rc.1` 实机 + 独立预览中验证：

- 实机：两个 chip 位于输入卡片底行、权限 chip 右侧、发送按钮左侧；`High` 时为蓝色 1px 描边 + 柔光。
- 独立预览与截图（`assets/screenshot-1..4.png`）：
  - `screenshot-1.png`：`High` 蓝色轨道 / 描边 / 光晕；
  - `screenshot-2.png`：拖动中（15%）仅左侧着色，颜色与描边连续过渡；
  - `screenshot-3.png`：`Off` 中性色描边 + 灰色轨道；
  - `screenshot-4.png`：松手吸附 `Max`，橙色轨道 / 描边 / 光晕。
- 回归项（详见 [docs/iterations.zh.md](docs/iterations.zh.md)）：整轨单色、左侧填充、档位名对齐、蓝→橙经品红且长跨度去饱和、内描边可见（DSH 卡片 `border:0`）、Shift+Tab 跳过 `Off`、乐观吸附不闪回、光晕与轨道/描边同色、卡片高度不变。

## 版本历史

- 完整变更清单：[CHANGELOG.md](CHANGELOG.md)
- 中文迭代记录（每次改动的问题、取舍与验证）：[docs/iterations.zh.md](docs/iterations.zh.md)

## 发布

打包、npm 发布、GitHub Release 与插件市场提交流程：[docs/PUBLISHING.md](docs/PUBLISHING.md)。

## 兼容性

- 面向 DSH `0.2.2-rc.1` 的客户端插件 API（slots / locale / shortcuts / model-selection 服务）。
- 仅使用公开插槽契约与 `ctx.modelDirectories`、`ctx.shortcuts`，不修改任何内置包。
- 若宿主已有命令占用 `Shift+Tab`，插件会退回自己的 document 监听；如仍冲突可在快捷键设置里改绑。

## English

DSH keeps the model + reasoning-effort switcher inside the composer's `/model` flyout. This plugin puts both directly into the composer card tool row — same row as the permission chip, immediately left of the send button — and turns the effort chip into a Codex-style slider.

Inspired by Pi Harness, every reasoning level gets its own colour: the effort track and the composer card's border tint live while you adjust, and `Shift+Tab` cycles through the levels — so seeing and changing the model's reasoning effort is quicker and more intuitive.

Stops come from the model's published `reasoning.efforts`, drag/click snaps to the nearest stop on release, `Shift+Tab` cycles from low to high. Only the part of the track left of the knob is coloured (with stardust drifting leftward); the colour is the single current level tone — neutral `#5b6270` at `Off`, then green/blue/orange — and during a drag it interpolates along the hue wheel in the increasing direction (blue → orange passes through magenta instead of turning muddy). The composer card gets a 1px coloured inset border plus a soft outer glow drawn with `box-shadow` (DSH cards are `border:0`, so a real border would never render; the inset ring does not change layout). Both follow the track colour live while dragging, persist at every level including `Off` (neutral tone), and settle on the confirmed level afterwards. While a `select()` is in flight the slider keeps an optimistic stop, so the knob no longer jumps back to the previous level before the directory confirms; the knob halo and glow use the same tone as the track and card ring. Long hue spans are muted mid-transition (lower saturation, lifted lightness, extra red-phase clamp) so blue → orange passes through magenta without flashing vivid red; short spans such as green → blue get a gentler mute plus a cyan-band cap, so the drag never flashes neon cyan. The slider stays in sync with `/model` through the shared `ModelDirectory` (failed updates re-sync and keep the last confirmed level). Models without declared efforts get a copyable `reasoningEfforts` YAML snippet for `cordis.patch.yml`. No build step: `lib/client.js` is a hand-authored DSH browser module requiring only `react`, `react-dom` and `@deepseek-ai/dsh-client-ui-primitives`.

Install with `dsh plugin --profile desktop add dsh-composer-model-controls` (npm) or point `dsh plugin add` at the local checkout. See [CHANGELOG.md](CHANGELOG.md) for the release history and [docs/iterations.zh.md](docs/iterations.zh.md) for the detailed (Chinese) iteration notes.
