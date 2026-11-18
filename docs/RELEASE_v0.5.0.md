v0.5.0 — 适配 DSH 0.2.2-rc.3：只接管推理强度
---
## 变更（0.5.0）

- **只接管推理强度**：DSH 0.2.2-rc.3 起，内置模型菜单包含「模型 / 推理等级 / 启用智能体团队协作」；0.5.0 不再遮蔽整个模型菜单，只把推理强度 chip 注册到 `conversation.input.right`，渲染在内置模型按钮左侧。
- **保持内置模型菜单完整**：模型选择、推理等级行与「启用智能体团队协作」开关均保留（此前遮蔽整个 seat 会导致该开关消失）。
- 其余能力不变：自适应档位滑块、拖动吸附、Shift+Tab 循环、轨道与输入框描边随档位变色（含绿→蓝过渡柔化）、更新失败回滚。

## 验证

- DSH 桌面版 0.2.2-rc.3 实测：推理强度 chip 出现在模型按钮左侧；内置模型菜单展开后仍含「启用智能体团队协作」。
- `node --check lib/client.js`、tarball 冒烟解包与 `dsh.bundle` / `dsh.client` 元数据校验通过。

## 安装

```bash
dsh plugin --profile desktop add dsh-composer-model-controls
```

或使用附件 tarball：

```bash
dsh plugin --profile desktop add ./dsh-composer-model-controls.tgz
```

## 附件

- `dsh-composer-model-controls.tgz`（138,748 B，sha256 `b85d68c9fecf4ad10ca8844b1a499c53e04715a85f66937e4aa7fb1f1b693925`）
- npm: https://www.npmjs.com/package/dsh-composer-model-controls
