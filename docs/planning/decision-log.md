# Decision Log

## ADR-001：将规划过程纳入 Git 版本控制

日期：2026-10-07
状态：已确认

### 背景

用户希望后续能够持续优化，并且能够回看每一步为什么这样设计。

### 决策

需求、调研、设计、实现计划、进度、验收和复盘都作为仓库内容保存，并通过 Git 追踪。重要阶段使用可读的里程碑提交。

### 影响

- 任何关键方向变化都有历史记录。
- 后续可以从仓库恢复项目上下文，而不依赖聊天记录。
- 临时 session 文档与长期项目文档都需要保持清晰的入口。

## ADR-002：暂不从零构建完整任务管理基础设施

日期：2026-10-07
状态：候选方向，待设计阶段确认

### 背景

从零实现任务、重复规则、提醒、日历、筛选、同步、备份和移动端，会消耗大量时间，但这些不是项目真正的差异化。

### 候选决策

优先评估 `Vikunja + 个人规划层`，同时保留 `Super Productivity 插件 / 外部面板` 和“从零构建”作为对比方案。

### 未决问题

- 自托管和离线是否为硬性要求。
- 是否需要移动端。
- 是否需要与 GitHub、Jira、日历等系统同步。
- 第一版的核心衡量标准是执行效率，还是目标与复盘质量。

## ADR-003：将项目放在 Developer 目录

日期：2026-10-07
状态：已确认

### 背景

用户希望项目作为长期开发项目放在 `/Users/u.ndaniel/Developer/` 下，而不是留在 Codex 自动生成的临时工作区。

### 决策

项目正式目录为：

`/Users/u.ndaniel/Developer/work-learning-planner`

原 Codex 工作区路径保留符号链接，方便当前对话和已有工具继续访问同一个仓库，不产生第二份 Git 历史。

### 影响

- 后续开发、运行和 Git 操作以 Developer 下的目录为准。
- 当前仓库仍保持 `main` 分支和原有提交历史。
- 符号链接不属于项目内容，不会进入 Git 提交。

## ADR-004：MVP 默认技术栈候选

日期：2026-10-08
状态：候选方向，待 Stage 3 确认

### 背景

技术设计确认后，需要把路线转成可执行实现步骤。项目需要一个低运维、适合单用户私有部署、易测试的 Web 技术栈。

### 候选决策

MVP 默认采用：

- Next.js App Router + TypeScript
- SQLite + Drizzle ORM
- Zod
- Vitest + Testing Library
- Playwright
- Tailwind CSS + lucide-react

### 影响

- 单仓库即可承载页面、服务端 API、领域逻辑和测试。
- SQLite 降低首版运维成本，适合个人私有部署。
- Provider contract tests 可以隔离 Vikunja，降低外部服务对本地测试的影响。

### 未决问题

- Stage 4 开始前需要核查当时稳定版本和脚手架命令。
- 如果用户要求更强离线能力或桌面端体验，技术栈需要重新评估。

## ADR-005：产品实现采用严格 TDD

日期：2026-10-08
状态：已确认

### 背景

用户明确要求后续实现需要注意 TDD。项目计划本身已经包含 `Verify RED` / `Verify GREEN` 字段，但需要提升为 Stage 4 的硬性执行约束。

### 决策

除纯文档、机械脚手架、配置初始化等明确记录 `TDD 例外` 的步骤外，所有产品行为变更必须遵循：

```text
Failing Test
  -> Verify RED
  -> Minimal Implementation
  -> Verify GREEN
  -> Refactor After Green
```

每一步的 RED/GREEN 证据必须记录到 `progress-details.md`，并在步骤关闭时同步勾选 `implementation-plan.md` 中对应的验证项。

### 影响

- 不允许先写生产代码再补测试。
- 不允许用宽泛的全量测试通过替代目标测试从 RED 到 GREEN 的证据。
- 若某步骤不适合 TDD，必须写明例外原因、替代验证方式和例外范围。
