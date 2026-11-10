# 发布流程（npm / GitHub / 插件市场）

本文件是 `dsh-composer-model-controls` 的发布手册。发布前请把所有 `GITHUB_USERNAME` 占位符替换成真实的 GitHub 用户名/组织名；`npm` 包名固定为 `dsh-composer-model-controls`。

## 0. 一次性准备

| 项目 | 说明 |
| --- | --- |
| npm 账号 | 需要能发布 `dsh-composer-model-controls`（该名字在 npm 上尚未被占用） |
| GitHub 仓库 | `https://github.com/GITHUB_USERNAME/dsh-composer-model-controls`，公开仓库 |
| 仓库 topic | 在 GitHub 仓库设置里添加 `dsh-plugin`（市场 CI 会检查） |
| 仓库年龄 | 市场要求仓库创建 ≥ 1 天；新仓库需等待一天再提交 PR |
| 本机 git | 仓库内已 `git init`，提交时使用占位身份，推送前建议改成真实身份 |

本地检查：

```powershell
node --check lib/client.js
node --check lib/index.js
node scripts/package.mjs            # 校验 + 打包到 dist/
```

`scripts/package.mjs` 会生成：

- `dist/dsh-composer-model-controls-<version>.tgz` —— 可发布/可安装的包；
- `dist/dsh-composer-model-controls.tgz` —— 版本无关副本，供 GitHub Release 附件使用（市场 `tarball:` 字段用）；
- `dist/CONTENTS.txt`、`dist/SHA256SUMS` —— 内容清单与校验和。

## 1. 发布到 npm

```powershell
# 登录（浏览器授权，会写入 ~/.npmrc）
pnpm login
pnpm whoami                          # 应输出你的 npm 用户名

# 发布（package.json 已声明 publishConfig.access=public 与 dsh.bundle）
pnpm publish --access public

# 校验
npm view dsh-composer-model-controls version dist.tarball
```

说明：

- `package.json` 的 `files` 只包含 `lib/`、`assets/`、`cordis.patch.yml`、`README.md`、`CHANGELOG.md`、`LICENSE`、`screenshots.json`，不会把 `tools/`、`dist/`、`node_modules/` 带进包。
- 发布后 `repository` 字段必须指向市场条目里登记的仓库（当前指向 `GITHUB_USERNAME` 占位仓库），否则市场无法把 npm 包和仓库条目匹配起来。
- 撤回/弃用：`npm deprecate dsh-composer-model-controls@0.4.4 "message"`（不删包，仅标记）；需要真正下架时用 `npm unpublish` 并同步修正市场条目。

## 2. 发布到 GitHub Release（不依赖 npm 的安装路径）

npm 发布后 GitHub Release 仍建议做，用于：

- 市场条目的 `tarball:` 回退源（用户从市场安装时优先 npm，无 npm 时才用 tarball）；
- 给不想用 npm 的用户直接下载。

```powershell
# 首次：创建仓库并推送（用户手动执行）
git remote add origin https://github.com/GITHUB_USERNAME/dsh-composer-model-controls.git
git branch -M main
git push -u origin main
git push origin v0.4.4

# 创建 Release 并上传版本无关附件
gh release create v0.4.4 --title "v0.4.4" --notes-file CHANGELOG.md
gh release upload v0.4.4 dist/dsh-composer-model-controls.tgz
```

没有 `gh` CLI 时，在 GitHub 网页端 “Releases → Draft a new release” 选择 tag `v0.4.4`，上传 `dist/dsh-composer-model-controls.tgz` 作为附件（文件名保持无版本号）。

## 3. 提交插件市场（awesome-dsh-plugin）

市场 `dshmarket` 的条目来自 <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>；一次 PR 只加一个文件：

`data/plugins/GITHUB_USERNAME__dsh-composer-model-controls.yml`

内容见本仓库 `docs/market/` 下的同名文件（替换占位符后直接复制）。要点：

- `category: ui`；
- `package.json` 必须声明 `dsh.bundle`（已声明，否则 CI 拒绝）；
- 仓库需加 topic `dsh-plugin`，且创建满 1 天；
- 截图通过本仓库根目录的 `screenshots.json` 声明（相对路径，最多 8 张）；
- 描述按 `description.en` / `description.zh` 填写，客观、无夸张营销词；
- 最多 3 个条目/PR。

PR 流程：

1. Fork `awesome-dsh-plugin/awesome-dsh-plugin`；
2. 新建分支，添加 `data/plugins/GITHUB_USERNAME__dsh-composer-model-controls.yml`；
3. 打开 PR，按 `pr-body.md` 模板填写；
4. 等 CI（entry 数量 → `dsh.bundle` 校验 → 仓库年龄 → awesome-lint + site build）；
5. 若 24h 无回复，在 PR 里 ping 维护者一次（不要重复刷）；被要求修改时用 `held: author` 暂停队列，改完再恢复。

图标：`assets/icon-180.png` 已按 180×180 提供，条目使用 GitHub raw 地址：

`https://raw.githubusercontent.com/GITHUB_USERNAME/dsh-composer-model-controls/main/assets/icon-180.png`

## 4. 版本升级检查清单

1. 修改代码与 `README.md`；
2. 在 `CHANGELOG.md` 顶部加新版本段（Keep a Changelog；版本号遵循语义化）；
3. `docs/iterations.zh.md` 追加一节迭代记录；
4. `package.json` 版本号 +1；
5. `node scripts/package.mjs` → 检查 `dist/CONTENTS.txt` 与体积；
6. `pnpm publish --access public`；
7. `git commit -m "release vX.Y.Z" && git tag vX.Y.Z && git push origin main --tags`；
8. GitHub Release 上传版本无关 tgz；
9. 若市场条目里没有 npm 映射，确认 `tarball:` 指向最新 release；
10. 在市场 PR/条目里补变更说明（如维护者要求）。

## 5. 回滚

- npm：`npm deprecate` 标记问题版本，发布修复版本；不要直接 `unpublish` 已被安装的版本（会破坏 lockfile）。
- GitHub：删除/标记 Release 为 pre-release，保留 tag 历史。
- 市场：在 awesome-dsh-plugin 提 PR 修改条目（改 `tarball:`/移除/更新描述），或给条目加 `held: author` 暂停。
- 插件运行时回滚：profile 里 `dsh plugin --profile desktop add dsh-composer-model-controls@<上一个版本>`。

## 6. 验收

- `npm view dsh-composer-model-controls version` 返回新版本；
- 临时 profile 安装：`dsh plugin --profile scratch add dsh-composer-model-controls`，启动后输入框底行出现两个 chip；
- 市场条目 CI 通过并出现在 <https://dshmarket.com> / dsh-market 的 “已安装/发现” 列表；
- `screenshots.json` 图片在市场上正常显示（1–8 张，GitHub 托管）。
