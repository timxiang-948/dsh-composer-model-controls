# Market PR 说明与正文模板

## 提交前

1. 把 `docs/market/GITHUB_USERNAME__dsh-composer-model-controls.yml` 里的 `GITHUB_USERNAME` 全部替换为真实 GitHub owner，复制为 `awesome-dsh-plugin` 仓库中的 `data/plugins/<owner>__dsh-composer-model-controls.yml`。
2. 确认已满足市场 CI 的硬性条件：
   - 仓库公开、创建已满 1 天；
   - 仓库已添加 topic `dsh-plugin`；
   - 仓库根目录 `package.json` 声明了 `dsh.bundle.patch`（已满足）；
   - 仓库根目录有 `screenshots.json`（1–8 张，已满足）；
   - `repository` 字段指向本仓库（npm 映射用）。
3. 已发布 npm 包：`dsh-composer-model-controls@0.4.4`；GitHub Release 附有 `dsh-composer-model-controls.tgz`。

## PR 标题

```
Add dsh-composer-model-controls (ui)
```

## PR 正文模板

```markdown
## Plugin

- Repo: https://github.com/OWNER/dsh-composer-model-controls
- npm: dsh-composer-model-controls@0.4.4
- Category: ui

## What it does

Model and reasoning-effort controls live in the DSH composer tool row (same row as
the permission chip, left of send). The effort chip opens a Codex-style slider whose
stops come from the model's published `reasoning.efforts`; drag or click snaps to the
nearest stop on release, Shift+Tab cycles low → high (skipping Off), and the composer
border is a 1px coloured inset ring plus soft glow that follows the effort tone.

## Checklist

- [x] `dsh.bundle` declared in package.json
- [x] GitHub topic `dsh-plugin`
- [x] Repo age ≥ 1 day
- [x] `screenshots.json` with 4 screenshots
- [x] npm published, `repository` points at the listed repo
- [x] Description accurate, no marketing superlatives
- [x] Only one entry added in this PR
```

## 维护者可能问的问题

- **为什么没有 `npm:` 字段？** 市场通过 `repository` 自动映射 npm 包，手写 `npm:` 会被拒绝。
- **tarball 文件名？** `latest/download/dsh-composer-model-controls.tgz` 不带版本号，符合 “latest 按文件名取” 的要求；如需固定版本可改成 `releases/download/v0.4.4/dsh-composer-model-controls-0.4.4.tgz`。
- **档位是否写死？** 不写死；完全读取模型目录公开的 `reasoning.efforts`，没有声明档位的自定义 provider 会显示可复制的 `reasoningEfforts` YAML 指引。
- **与 `/model` 是否冲突？** 两者共用同一个 `ModelDirectory`，读同一份会话状态，任何一边切换都会同步。
