# 发布流程（npm / GitHub / 插件市场）

本文件记录 `dsh-composer-model-controls` **0.5.0 首次公开发布实际走通的路径**：Windows + npm + GitHub 网页操作，不依赖 pnpm 与 gh CLI。

真实身份：GitHub 账号 `timxiang-948`，npm 账号 `timxiang`（两者不同，靠 `package.json` 的 `repository` 字段关联，属正常）。

## 0. 一次性准备

| 项目 | 本仓库的实际情况 |
| --- | --- |
| npm 账号 | `timxiang <timxiang_948@163.com>`，已发布 `0.5.0` |
| GitHub 仓库 | `https://github.com/timxiang-948/dsh-composer-model-controls`，公开 |
| 仓库 topic | `dsh-plugin`（**单数**，市场 CI 精确匹配；写成 `dsh-plugins` 不认） |
| 仓库年龄 | 市场要求创建满 1 天，按 `created_at`（UTC）计算 |
| git 身份 | 仅在本仓库设置：`timxiang-948` / `timxiang-948@users.noreply.github.com` |
| 工具链 | node ≥ 20、npm 10.x；**无 pnpm、无 gh** |

### 0.1 复核身份残留

历史版本里有一批占位符（形如 `GITHUB_<字段>`），现已全部替换为 `timxiang-948`。发布前复核：

```powershell
cd D:\MyProjects\harness\deepseekharness\dsh-composer-model-controls
git grep -n "GITHUB_"     # 只应命中本文件里这处说明；其余位置应已全部替换
```

以下几处必须指向真实仓库，否则市场 CI 无法把 npm 包与仓库条目匹配：

- `package.json`：`author.name` / `author.url` / `repository.url` / `homepage` / `bugs.url`
- `LICENSE` 第 3 行：`Copyright (c) 2026 timxiang-948`
- `docs/market/timxiang-948__dsh-composer-model-controls.yml`（文件名本身也含 owner）

### 0.2 Windows 工具链的三个坑

1. **PowerShell 禁止运行 `npm.ps1`**
   报错形如「无法加载文件 …\npm.ps1，因为在此系统上禁止运行脚本」。这是执行策略（默认 Restricted）拦的，不是 npm 坏了。临时解法（只影响当前窗口）：

   ```powershell
   Set-Alias -Name npm -Value npm.cmd
   npm --version      # 应输出 10.9.8 之类
   ```

   或 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`。不建议永久改 CurrentUser。

2. **默认 registry 是镜像站**
   本机默认指向 `https://registry.npmmirror.com/`（只读镜像）。所有登录、发布、核对命令都必须显式带官方源：

   ```
   --registry https://registry.npmjs.org
   ```

   连通性自检：`npm ping --registry https://registry.npmjs.org`（约 1–2 秒返回 PONG）。

3. **npm 是 `.cmd` 批处理，不是可执行文件**
   `spawnSync('npm', …, {shell:false})` 在 Windows 上会 `ENOENT` / `status null`。`scripts/package.mjs` 已修（Windows 自动走 shell）。若再遇到 `failed with status null`，先 `Get-Command npm -All` 看是否存在 `npm.exe`——通常只有 `npm.ps1` / `npm.cmd`。

## 1. 打包与自检

```powershell
node scripts/package.mjs --pnpm npm
```

预期输出：

```
package: dsh-composer-model-controls@X.Y.Z
layout/syntax checks: ok
```

产物（`dist/`，已 gitignore，不进 npm 包）：

| 文件 | 用途 |
| --- | --- |
| `dsh-composer-model-controls-<version>.tgz` | 可安装的包，与将发布的内容一致 |
| `dsh-composer-model-controls.tgz` | 版本无关副本，**GitHub Release 附件专用**（市场 `tarball:` 字段指向它） |
| `CONTENTS.txt` | 包内文件清单，应为 13 行，且**不含** `tools/`、`docs/`、`dist/`、`scripts/` |
| `SHA256SUMS` | 校验和 |

核对包内容（PATH 缺 `System32` 时用绝对路径调 tar）：

```powershell
C:\Windows\System32\tar.exe -tzf dist\dsh-composer-model-controls.tgz
```

`files` 白名单只含：`lib`、`assets`、`cordis.patch.yml`、`README.md`、`CHANGELOG.md`、`LICENSE`、`screenshots.json`。

## 2. 发布到 npm

```powershell
npm login --registry https://registry.npmjs.org
npm whoami  --registry https://registry.npmjs.org     # 应为 timxiang
npm publish --registry https://registry.npmjs.org
```

`package.json` 已含 `publishConfig.access: public`，无需再加 `--access`。

### 2.1 两种 403，含义完全不同

| 报错 | 含义 | 处理 |
| --- | --- | --- |
| `Two-factor authentication or granular access token with bypass 2fa enabled is required` | npm 对写操作强制 2FA | 把 2FA 设为 **Authorization and Publishing**，或创建 Granular Access Token 并勾选 Bypass 2FA；然后 `logout` → `login` → `publish` |
| `You cannot publish over the previously published versions: X.Y.Z` | 这个版本**已经发布成功**，这次是重复提交 | 去 registry 核对，不要重发、不要升版本「修」它 |

第二种情况常被误判成失败。核对命令：

```powershell
npm view dsh-composer-model-controls version --registry https://registry.npmjs.org
npm view dsh-composer-model-controls versions --json --registry https://registry.npmjs.org
```

### 2.2 关于 `0.0.0-stage`

2FA 拦截过一次发布后，npm 会给包名打一个占位版本 `0.0.0-stage`（描述为 `Temporary package placeholder for staged publishing`，仅 2 个文件）。这是 npm 替你占名，**不要 unpublish**；真包发布后 `dist-tags.latest` 会指向真版本，占位版不影响任何安装行为。

### 2.3 版本号不可变

同一版本号发布后内容永久冻结，只能升版本重发或 `npm deprecate` 标记。所以第 1 节的打包自检要在 publish 之前做完。

### 2.4 发布后核对

```powershell
npm view dsh-composer-model-controls --registry https://registry.npmjs.org
```

重点看四项：`dist-tags.latest`、`repository.url`（必须指回 GitHub 仓库）、`fileCount`（13）、`shasum`（与打包时打印的一致）。

## 3. GitHub 仓库与 tag

首次建库走网页：New repository → 名称 `dsh-composer-model-controls` → Public → **不要**勾 README / .gitignore / license（本地已有，勾了会冲突）。

```powershell
git remote add origin https://github.com/timxiang-948/dsh-composer-model-controls.git
git branch -M main
git push -u origin main
git push origin v0.5.0          # 标签必须单独推
```

**不要用 `git push --tags`**：它会把从未公开发布的历史标签（如 `v0.4.4`）一起推上去。

`git push -u origin main` 首次会弹浏览器授权（Git Credential Manager），授权后凭据存入 Windows 凭据管理器，后续不用再输。

核对远程实际状态：

```powershell
git ls-remote origin
```

应看到 `refs/heads/main` 与 `refs/tags/vX.Y.Z`（以及 `refs/tags/vX.Y.Z^{}` 解引用行），两者指向同一个 commit。

## 4. GitHub Release

入口：`https://github.com/timxiang-948/dsh-composer-model-controls/releases/new`

1. **Choose a tag**：选已存在的 `vX.Y.Z`，不要新建；
2. **Release title**：`vX.Y.Z`；
3. **Describe**：安装命令 + 变更摘要；
4. **Attach binaries**：上传 `dist/dsh-composer-model-controls.tgz`——**文件名必须无版本号**；
5. 不勾 `Set as a pre-release`；
6. Publish release。

为什么必须是这个名字：市场条目用

```
https://github.com/timxiang-948/dsh-composer-model-controls/releases/latest/download/dsh-composer-model-controls.tgz
```

这个 URL 只在请求时解析 `latest`，**文件名照字面取**。附件若叫 `…-0.5.0.tgz`，该链接当场 404；下次发版换附件内容即可，链接不用改。

核对（期望 200 且大小与本地 tgz 一致）：

```powershell
$ProgressPreference='SilentlyContinue'
$u="https://github.com/timxiang-948/dsh-composer-model-controls/releases/latest/download/dsh-composer-model-controls.tgz"
$r=Invoke-WebRequest -Uri $u -Method Head -TimeoutSec 15
"$($r.StatusCode) / $($r.Headers['Content-Length'])"
```

## 5. 提交插件市场（awesome-dsh-plugin）

市场 = 一个 GitHub 仓库（<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>），一个插件一个 yml。

### 5.1 硬规则

| 规则 | 说明 |
| --- | --- |
| 一个 PR 一个文件（≤3 条） | 这就是全部投稿 |
| `package.json` 声明 `dsh.bundle` | 只声明 `dsh.client` 是最常见被拒原因 |
| 仓库 topic = `dsh-plugin`（单数） | CI 精确匹配 |
| 仓库创建满 1 天 | CI 读 `created_at`，过期结论会自动重跑 |
| `icon` 必须是 GitHub 托管位图 | png/jpg/jpeg/webp；SVG 与第三方图床拒收 |
| `tarball` 必须是 Release 托管的 https `.tgz` | 文件名不带版本号 |
| 禁止手写 `npm:` 字段 | npm 映射由 `repository` 自动采集 |
| 禁止手改市场 README | README 由脚本从 `data/plugins/*.yml` 生成，CI 会比对 |

合法 `category` 含 `ui`；描述必须与代码相符、无营销词。

### 5.2 条目内容

文件名：`data/plugins/timxiang-948__dsh-composer-model-controls.yml`（owner 与 repo 之间是**双下划线**）

```yaml
url: https://github.com/timxiang-948/dsh-composer-model-controls
name: timxiang-948/dsh-composer-model-controls
category: ui
description:
  en: Model and reasoning-effort controls in the DSH composer tool row, with a Pi-Harness-inspired effort slider whose track and composer border tint with the level, plus Shift+Tab cycling.
  zh: 把模型与推理强度控件放进 DSH 输入框工具行：参考 Pi Harness 配色的自适应推理强度滑块，轨道与输入框描边随档位渐变，支持 Shift+Tab 快捷切换。
icon: https://raw.githubusercontent.com/timxiang-948/dsh-composer-model-controls/main/assets/icon-180.png
tarball: https://github.com/timxiang-948/dsh-composer-model-controls/releases/latest/download/dsh-composer-model-controls.tgz
```

本仓库 `docs/market/` 下的同名文件即此定稿（不含注释）。

### 5.3 操作流程

1. **Fork** 上游仓库到自己账号；
2. **Sync fork**：fork 落后上游时先点 `Update branch`。CI 第一项 `Stale-fork guard` 会检查 fork 是否过期；
3. 在 `data/plugins/` 下 **Create new file**，文件名见 5.2，内容粘贴上面 8 行（`en`/`zh` 前为两个空格，不能用 Tab；不要带入代码块标记）；
4. 提交时选 **Create a new branch for this commit and start a pull request**，分支名如 `add-dsh-composer-model-controls`；
5. **在「上游仓库」开 PR**，不要在自己的 fork 里开。最稳的方式是直接打开跨仓库比较页：

   ```
   https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/compare/main...timxiang-948:add-dsh-composer-model-controls?expand=1
   ```

   页面顶部必须是：base repository = `awesome-dsh-plugin/awesome-dsh-plugin`、base = `main`、head repository = `timxiang-948/awesome-dsh-plugin`、compare = 你的分支。

   > 判断 PR 是否正确：地址形如 `github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/N`。若是 `github.com/timxiang-948/…/pull/N`，那是「自己合并自己」，上游收不到，CI 也不会跑。

6. 标题 `Add dsh-composer-model-controls (UI controls)`；正文按市场仓库根目录 `pr-body.md` 的清单填写，勾选 `Allow edits by maintainers`。

### 5.4 CI 实际检查项

一个 `check` job + 一个 `Submission gate` job，顺序大致为：

```
Stale-fork guard
Every entry file ends in .yml
Entry files live in data/plugins/
A generated README row that lists nothing is not a submission
READMEs match data/plugins
awesome-lint
Added-date regression tests
Capability-disclosure tests
Discussion-adoption tests
Entry-path tests
Build (locale parity, date derivation, templates)
```

`Build` 最慢（要处理上万条条目），几分钟到十几分钟。红了点 `Details` 看日志定位到具体条目。

### 5.5 合并与后续

- 维护者一般用 squash 合并，作者署名仍是你；
- 被要求修改时打 `held: author`：在同一分支追加提交，PR 自动更新，改完留**一条**评论，不要刷屏；
- **不要重复推送空提交**：仓库年龄结论过期时 CI 会自动重跑。

合并后市场站点自动重建，详情页地址形如：

```
https://awesome-dsh-plugin.com/p/timxiang-948/dsh-composer-model-controls/
```

首页按下载量排序，新插件不会出现在前排，搜名字即可。

## 6. 版本升级清单

1. 改代码与 `README.md`；
2. `CHANGELOG.md` 顶部加新版本段（Keep a Changelog；语义化版本）；
3. `docs/iterations.zh.md` 追加迭代记录；
4. `package.json` 版本号 +1；
5. `node scripts/package.mjs --pnpm npm`，核对 `dist/CONTENTS.txt` 与体积；
6. `git commit -m "release vX.Y.Z"`；
7. `git tag -a vX.Y.Z -m "vX.Y.Z"`；
8. `git push origin main`，再 `git push origin vX.Y.Z`（**不要 `--tags`**）；
9. `npm publish --registry https://registry.npmjs.org`；
10. 建 Release，附件仍用 `dist/dsh-composer-model-controls.tgz`（同名覆盖，链接不变）；
11. 市场条目**无需改动**（`tarball` 指向 `latest/download`）；只有改描述、图标、分类时才需要再开一个 PR。

## 7. 回滚

- npm：`npm deprecate dsh-composer-model-controls@X.Y.Z "原因"`，再发修复版；不要 `unpublish` 已被安装的版本（会破坏 lockfile）；
- GitHub：Release 标记为 pre-release 或删除附件，保留 tag 历史；
- 市场：改条目需再开 PR；被暂缓时按 `held: author` 流程处理；
- 运行时：`dsh plugin --profile desktop add dsh-composer-model-controls@<旧版本>`。

## 8. 验收

- `npm view dsh-composer-model-controls version --registry https://registry.npmjs.org` 返回目标版本；
- `dsh plugin --profile desktop add dsh-composer-model-controls`，刷新页面后输入框底行出现两个 chip（模型 chip、推理强度 chip），点开滑块可拖动，`Shift+Tab` 可循环切档；
- Release 附件 URL 返回 200，大小与本地 tgz 一致；
- 市场详情页可访问，图标与描述正常显示。
