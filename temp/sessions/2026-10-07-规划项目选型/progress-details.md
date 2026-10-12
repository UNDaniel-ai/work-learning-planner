# 执行进度：Work & Learning Planner MVP

[← 返回 INDEX.md](./INDEX.md)

- **创建时间**: 2026-10-08 19:59 CST
- **当前路由**: Route C
- **当前阶段**: Stage 5 - Acceptance 已完成，等待 Stage 6 - Session Closeout
- **执行纪律**: TDD by default；显式 `TDD 例外` 必须记录原因和替代验证
- **当前执行游标**: Stage 5 验收后数据库隔离修复已完成，等待用户确认进入 Stage 6

## Stage 5：Acceptance

### 入口确认

- **AI 发起确认消息**：当前 Stage 4 已完成；请明确回复“确认进入验收阶段”，然后按 `acceptance.md` 逐项验收 MVP。确认前不继续修改产品代码，也不宣告整个项目完成。
- **用户确认原话**：确认进入验收阶段
- **确认时间**：2026-10-11 12:23:17 CST

### 验收执行合同

- **范围**：目标 / 学习主题 -> 周计划 -> 时间块 -> Today 实际投入 -> Review -> Settings JSON 导出。
- **质量门**：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm e2e`。
- **人工检查**：`/today`、`/weekly`、`/goals`、`/review`、`/settings`，以及无真实 Vikunja 配置时的安全失败状态。
- **证据要求**：只接受当前 Stage 5 执行窗口中的命令输出、exit code 和浏览器观察；Stage 4 的通过记录仅作为背景。
- **完成声明**：本阶段未完成前禁止宣告整个项目完成；Stage 6 仍需用户确认。

### Fresh Verification Results

- **执行窗口**：2026-10-11 12:25-12:33 CST。
- `pnpm lint`：通过，exit code 0。
- `pnpm typecheck`：通过，exit code 0。
- `pnpm test`：通过，exit code 0；24 个测试文件、56 个测试通过。
- `pnpm build`：通过，exit code 0；Next.js 16.4.0 生成 18 个 app routes。
- `pnpm e2e`：通过，exit code 0；1 个 Chromium 项目测试通过，耗时约 1.9 秒。
- `git diff --check`：通过，exit code 0。

### Browser And HTTP Acceptance

- `/today`：加载成功，显示计划投入、Today 时间块和优先任务区域。
- `/weekly`：加载成功，显示当前周计划、focus 选择、容量和时间块表单。
- `/goals`：加载成功，显示工作目标、学习主题和创建表单。
- `/review`：加载成功，显示 weekly review 表单与历史复盘。
- `/settings`：加载成功，连接状态为 `Not connected`，显示安全错误原因；点击 `Test connection` 后状态仍安全可见。
- `/api/health`：HTTP 200，报告应用健康但 `vikunjaConfigured: false`。
- `/api/vikunja/test-connection`：HTTP 503，返回 `Vikunja configuration is incomplete.`，没有凭据字段。
- `/api/export`：HTTP 200，返回 `work-learning-planner-export.json` 附件；响应体 11,109 字节，token-like 字段扫描为空。

### Stage 5 结论

- 本地 MVP 主流程通过。
- 未验证项：真实 Vikunja 实例的连接、任务读取、完成和延期。
- 验收后修复：本地 e2e 已通过 Settings 切换到 test database，不再写入个人数据库。
- 残余风险：`local.db` 里仍有修复前的 E2E 示例记录，本次未自动删除历史数据。
- Stage 5 已完成；不宣告整个项目完成，等待用户确认进入 Stage 6。

### 验收后修复：隔离 E2E 测试数据库

- 用户反馈：个人使用数据库里出现大量 E2E 回归数据，希望 Settings 增加开关区分测试库和实际使用库。
- Root cause：`getPlanningRuntime()` 只按 `DATABASE_URL` 创建全局单例；Playwright 也以 `DATABASE_URL=file:local.db` 启动，因此 E2E 与日常使用共享同一 SQLite 文件。
- Verify RED：
  - `pnpm test src/lib/config.test.ts src/app/api/settings/database/route.test.ts src/components/settings-workspace.test.tsx`：失败，配置层缺少 `testDatabaseUrl`，`/api/settings/database` 不存在，Settings UI 缺少 switch。
  - `pnpm e2e`：失败，找不到 `Use test database` switch。
- Minimal implementation：
  - 配置层新增 `TEST_DATABASE_URL`，本地 file URL 可自动派生 `.test` 数据库。
  - 新增 `planner_database_mode` cookie，personal/test 两个数据库 runtime 独立缓存。
  - 新增 `/api/settings/database`，Settings 页面新增 `Use test database` 开关。
  - 所有 planning API 和 export API 按请求 cookie 选择 active database。
  - E2E 主流程开始时先在 Settings 切到 test database。
- Debugging note：
  - 首次 e2e 修复后超时，原因是 Playwright 对 `sr-only` switch input 执行 `check()` 会等待可操作性；改为点击可见 label 文本并断言 switch checked。
  - 一次并行运行 `pnpm typecheck` 与 `pnpm build` 导致 `.next` 生成类型竞争；后续验证改为串行执行。
- Verify GREEN：
  - 聚焦测试：通过，3 个测试文件、8 个测试通过。
  - `pnpm lint`：通过，exit code 0。
  - `pnpm typecheck`：通过，exit code 0。
  - `pnpm test`：通过，25 个测试文件、60 个测试通过。
  - `pnpm build`：通过，新增 `/api/settings/database`，共生成 19 个 app routes。
  - `pnpm e2e`：通过，1 个 Chromium 项目测试通过，耗时约 1.9 秒。
  - `git diff --check`：通过，exit code 0。
- 数据隔离证据：
  - `/api/settings/database` 默认返回 `currentMode: personal`。
  - 带 `Cookie: planner_database_mode=test` 时返回 `currentMode: test`。
  - `local.db` 中 E2E goal/topic 计数保持 10/9；`local.test.db` 中 E2E goal/topic 计数为 2/2，说明新的回归数据进入测试库。

### Personal Database Cleanup

- 用户请求：清理 Personal database 中由 E2E 回归产生的数据。
- 备份：已创建 `temp/backups/local-before-e2e-clean-20261012-213622.db`。
- 清理范围：
  - 清空 `reviews`、`time_blocks`、`planning_period_focus_goals`、`planning_period_task_links`、`planning_periods`、`task_links`、`goals`、`learning_topics`、`sync_cursors`。
  - 保留默认 `areas`，即 Work / Learning。
- 验证结果：
  - `areas`: 2。
  - `goals`、`learning_topics`、`planning_periods`、`time_blocks`、`reviews`、`task_links`、`sync_cursors`: 0。
  - E2E goal/topic 计数均为 0。
  - `/api/settings/database` 返回 `currentMode: personal`。
  - `/api/planning/goals` 返回默认 areas，goals 与 learningTopics 为空。
  - `/api/planning/weekly` 返回 planningPeriods 与 timeBlocks 为空。

## 步骤 10：实现 Today 与 Review 闭环

### Step Contract

- 前置输入：
  - 步骤 9 已完成，已能创建周计划和时间块。
  - `TaskProvider` 已支持 list、complete、postpone。
  - `recordReview` 已存在，但当前只按整个 planning period 计算计划 / 实际分钟，需要补充 daily review 的日期范围语义。
- 目标行为：
  - Today 按指定日期读取当前周的关联任务和当天时间块。
  - Today 可以完成任务、延期任务、记录时间块实际投入。
  - Review 可以保存 daily / weekly review，并展示计划与实际偏差。
- TDD 分类：严格 TDD。
- 执行模式：
  - 计划标记为 `subagent candidate`。
  - capability detection：child-agent tooling 可用；但当前 slice 同时改动 use case、repository、provider API、页面容器和 route contract，存在共享状态与连续 RED/GREEN 依赖，不适合安全拆分为 disjoint write set。
  - 决策：step-scoped fallback 到主会话；不 dispatch 子代理。替代方法为 `und-test-driven-development`，由主会话执行 spec compliance review 和 controller quality checklist。
- 预期验证：
  - Today / Review 目标测试先 RED，再按切片转 GREEN。
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

### Verify RED

- 先写测试：
  - `src/app/api/planning/execution-routes.test.ts`
  - `src/components/today-workspace.test.tsx`
  - `src/components/review-workspace.test.tsx`
  - `src/components/task-execution-list.test.tsx`
  - `src/components/review-form.test.tsx`
  - 扩展 `src/domain/planning/use-cases.test.ts` 和 `src/components/time-block-grid.test.tsx`。
- 目标测试在实现前失败：
  - Today / Review 页面容器和组件尚不存在时，组件测试无法解析目标模块。
  - Today、Review API route 和 `recordTimeBlockActual` 尚不存在时，API / 领域测试无法解析目标实现。
- RED 结论：失败原因均指向步骤 10 的当前切片，不是工具链或环境失败，满足严格 TDD 的 RED 要求。

### Minimal Implementation

- 领域与仓储：
  - 新增 `recordTimeBlockActual` 和 `TIME_BLOCK_NOT_FOUND`。
  - `recordReview` 的 daily review 只统计指定日期的时间块。
  - repository 新增 `getTimeBlock`、`updateTimeBlock`。
- API：
  - 新增 `/api/planning/today`，按日期返回当前周计划、当天时间块和关联任务。
  - 新增 `/api/planning/reviews`，支持读取和保存 daily / weekly review。
  - 扩展 tasks / time-blocks PATCH，支持完成、延期和记录实际分钟。
  - 统一处理时间块不存在等 planning API 错误。
- UI：
  - Today 显示计划投入、完成任务数、时间块和优先任务。
  - 支持完成任务、选择日期延期任务和记录实际投入。
  - Review 支持 wins、misses、adjustments、review 类型和实际分钟。
  - Review 显示历史复盘与计划 / 实际偏差。

### Verify GREEN

- Step 10 聚焦回归：
  - 命令：`pnpm test src/domain/planning/use-cases.test.ts src/app/api/planning/execution-routes.test.ts src/components/time-block-grid.test.tsx src/components/task-execution-list.test.tsx src/components/review-form.test.tsx src/components/today-workspace.test.tsx src/components/review-workspace.test.tsx`
  - 结果：通过，7 个测试文件、13 个测试通过。
- 完整质量门：
  - `pnpm lint`：通过，exit code 0。
  - `pnpm typecheck`：通过，exit code 0。
  - `pnpm test`：通过，exit code 0，22 个测试文件、51 个测试通过。
  - `pnpm build`：通过，exit code 0；Next.js 成功生成 Today、Review 及 planning API 路由。
- 浏览器检查：
  - 使用 `DATABASE_URL=file:local.db pnpm dev --hostname 127.0.0.1 --port 3000` 提供本地运行环境。
  - `/today`：Today 工作区、导航、连接状态、指标区、时间块区和优先任务区均能加载。
  - `/review`：Review 工作区能加载；无当前周计划时显示“先创建周计划”的明确空状态，无运行时 API 错误。

### Refactor After Green

- 将 daily review 的日期范围判断留在领域用例，避免 UI 决定统计语义。
- 将 SQLite nullable 字段和时间块不存在错误分别收敛在 repository / API 边界。
- `TimeBlockGrid` 保持展示与实际投入编辑职责，Today 容器负责 API 编排。
- 主会话 fallback review checklist：
  - Spec compliance：Today 查询按日期过滤；任务完成 / 延期通过 `TaskProvider`；daily / weekly review 分流；复盘不修改下周计划。
  - Quality：组件不直接依赖数据库；错误通过用户可见状态呈现；完整质量门和聚焦回归均通过。

### Step Acceptance

- [x] 任务完成状态与 provider 状态一致。
- [x] 任务延期通过 provider 写入新的 due date。
- [x] 时间块实际投入可持久化并回显。
- [x] daily review 只汇总指定日期，weekly review 汇总整个 planning period。
- [x] 复盘保存不会自动修改下周计划。
- [x] `/today` 与 `/review` 浏览器检查无运行时错误。

步骤 10 已完成。下一步进入步骤 11；当前 session 仍处于 Stage 4，尚未进入最终验收，也不允许宣告整个 MVP 完成。

## 步骤 11：实现 Settings、连接测试与 JSON 导出

### Step Contract

- 前置输入：
  - 步骤 7 已有服务端 Vikunja 连接测试 route。
  - repository 已有 `exportPlanningData()`，但尚无 HTTP 导出边界。
  - Settings 页面当前只显示静态连接说明和 JSON endpoint 链接。
- 目标行为：
  - Settings 页面加载并显示 Vikunja 连接状态、任务数量或安全的失败原因。
  - 用户可以重新触发连接测试，页面不显示 API token。
  - 用户可以下载本地规划数据 JSON，导出内容不包含 Vikunja token。
- TDD 分类：严格 TDD。
- 执行模式：主会话。
- Review Contract：spec + security + quality。
- 预期验证：
  - Settings 组件测试先 RED，再 GREEN。
  - Export route 测试先 RED，再 GREEN。
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

### Verify RED

- 新增目标测试：
  - `src/components/settings-workspace.test.tsx`
  - `src/app/api/export/route.test.ts`
- 命令：`pnpm test src/components/settings-workspace.test.tsx src/app/api/export/route.test.ts`
- 结果：失败，exit code 1；2 个测试文件均无法解析目标生产模块：
  - `./settings-workspace` 尚不存在。
  - `./route`（`/api/export`）尚不存在。
- RED 结论：失败原因准确指向 Step 11 的当前实现切片，满足严格 TDD 的 RED 要求。

### Minimal Implementation

- 新增 `SettingsWorkspace`：
  - 加载 `/api/vikunja/test-connection` 并显示 Connected / Not connected。
  - 显示安全的任务数量和失败原因。
  - 支持按钮重试，不在客户端展示 API token。
- 新增 `/api/export`：
  - 读取 repository 的 `exportPlanningData()` 快照。
  - 返回 `work-learning-planner-export.json` 附件。
  - 失败时返回不泄露内部细节的 500 响应。
- 新增 `serializePlanningData`，让 JSON 序列化脱离 route，便于测试。
- 补充 `docs/development/setup.md` 和 Vikunja 的连接 / 导出边界说明。

### Verify GREEN

- Step 11 目标测试：
  - 命令：`pnpm test src/components/settings-workspace.test.tsx src/app/api/export/route.test.ts`
  - 结果：通过，2 个测试文件、3 个测试通过。
- 质量门：
  - `pnpm lint`：通过，exit code 0。
  - `pnpm typecheck`：通过，exit code 0。
  - `pnpm test`：通过，exit code 0，24 个测试文件、54 个测试通过。
  - `pnpm build`：通过，exit code 0；生成 `/api/export` 和 `/settings`。
- 浏览器 / HTTP 检查：
  - `/settings` 在 dev server 中显示 `Not connected` 和 `Vikunja configuration is incomplete.`，没有显示 token。
  - `curl http://127.0.0.1:3000/api/export` 返回 `200`、JSON attachment header 和规划快照。
  - 对实际导出文件执行 token-like 字段扫描，没有发现 `token` 或 `secret`。

### Refactor After Green

- 连接请求状态从组件事件与初始加载中抽出为共享异步状态函数，避免 React Hooks lint 的 `set-state-in-effect` 违规。
- 导出 route 不读取 `getConfig()`，只通过 repository 快照输出，缩小凭据泄露面。
- Settings 页面保持服务端布局、客户端状态交互的边界。

### Step Acceptance

- [x] 用户可以从 Settings 触发 Vikunja 连接检查。
- [x] 连接成功时显示任务数量，失败时显示安全错误原因。
- [x] 用户可以下载本地规划数据 JSON。
- [x] 导出内容不包含 API token 或环境变量。
- [x] 设置和导出相关文档已补齐。

步骤 11 已完成。下一步进入步骤 12；当前 session 仍处于 Stage 4，尚未进入最终验收，也不允许宣告整个 MVP 完成。

## 步骤 12：端到端 MVP 验收与开发文档收束

### Step Contract

- 前置输入：
  - 步骤 1-11 已完成，核心页面、API、规划领域、Vikunja adapter 和导出均存在。
  - 本地 dev server 可在没有 Vikunja 的情况下使用 memory task provider。
- 目标行为：
  - 通过一条真实浏览器路径创建目标和学习主题。
  - 建立本周计划、时间块，进入 Today 记录实际投入。
  - 进入 Review 保存复盘，并从 Settings 下载规划数据。
- TDD 分类：严格 TDD。
- 执行模式：主会话。
- Review Contract：spec + integration + quality。
- 预期验证：
  - `pnpm e2e`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

### Verify RED

- 命令：`pnpm e2e`
- 结果：失败，exit code 1，Playwright 报告 `No tests found`。
- RED 结论：仓库尚无端到端验收路径；下一步先补齐覆盖 MVP 主流程的 e2e 测试。

### Debugging Note

- 症状：第一次 e2e 可以完成时间块创建；重复运行时 POST 仍返回 201，但随后 `/today` 看不到刚创建的时间块。
- 复现证据：
  - `/api/planning/weekly` 返回同一周的多个 `planningPeriods`。
  - 最新创建的时间块挂在某个 period 上，而 `/api/planning/today` 按列表第一个 period 读取，因此返回空 `timeBlocks`。
- 根因：weekly plan 保存总是插入新 period；页面和 Today route 对重复周计划没有共同的唯一语义。
- 假设验证：同一周复用已有 period，并让时间块继续写入该 period，可消除重复运行中的 period 分叉。
- 防御性修复：新增领域回归测试，要求同一周第二次保存返回原 period 且数据库只保留一个周计划。

### Minimal Implementation

- 新增 `e2e/mvp.spec.ts`，覆盖目标、学习主题、周计划、时间块、Today、Review 和导出。
- Playwright 本地使用系统 Chrome，CI 使用 Playwright 管理的 Chromium。
- 修复同周重复保存：
  - use case 复用当前日期所属的已有周 period。
  - repository 替换 period 的 focus goals / task links。
  - Weekly UI 将刚保存的 period 放到当前选择首位。
- 补充 `docs/development/testing.md` 和 `acceptance.md` 草案。

### Verify GREEN

- `pnpm e2e`：通过，1 个测试、1 个 Chromium 项目通过；重复运行验证通过。
- `pnpm lint`：通过，exit code 0。
- `pnpm typecheck`：通过，exit code 0。
- `pnpm test`：通过，exit code 0，24 个测试文件、56 个测试通过。
- `pnpm build`：通过，exit code 0，生成 18 个 app routes。

### Refactor After Green

- e2e 为时间块选择当前日期的空闲小时，并把操作限定在唯一 note 对应的 list item，支持重复运行。
- 将重复周计划的 period 选择规则放入领域用例，避免 Today、Weekly 各自猜测“当前 period”。
- 保持 acceptance 文档为草案，等待 Stage 5 用户确认后再转正式验收结论。

### Step Acceptance

- [x] MVP 主流程可通过真实浏览器从目标走到导出。
- [x] 重复运行不会因旧时间块或旧周计划造成 period 分叉。
- [x] e2e、lint、typecheck、unit/component/API tests、build 均有 fresh evidence。
- [x] 开发运行与测试文档已补齐。

步骤 12 已完成。Stage 4 已结束；下一步唯一动作是用户确认进入 Stage 5 Acceptance。当前不允许宣告整个 MVP 完成。

## Stage 4 入口记录

- 用户确认原话：确认开始编码
- 确认时间：2026-10-08 19:59 CST
- 当前执行步骤：步骤 1 - 建立应用脚手架与基础质量门
- 执行模式：主会话
- Subagent 决策：步骤 1 在计划中标记为主会话；工具链初始化影响全局，当前不 dispatch subagent。

## 技术栈版本核查

- Node.js：v22.22.0
- npm：10.9.4
- corepack：0.34.0
- pnpm：10.30.2
- npm 一次性多包查询：只返回单个版本 `16.4.0`，证据不足，已改为逐包查询。
- 逐包查询结果：
  - Next.js：16.4.0
  - React / React DOM：19.3.0
  - TypeScript：最新为 7.0.2，但 `typescript-eslint` 当前不支持 TS 7，因此本项目暂用 6.0.3。
  - ESLint：最新为 10.12.0，但 Next / React ESLint 插件 peer range 不支持 ESLint 10，因此本项目暂用 9.39.5。
  - Vitest：5.0.3
  - Playwright：1.64.0
  - Drizzle ORM：0.45.4
  - Zod：4.6.5
  - Tailwind CSS / @tailwindcss/postcss：4.3.3
  - lucide-react：1.53.0

## 步骤 1：建立应用脚手架与基础质量门

### Step Contract

- 前置输入：
  - 当前仓库没有产品代码。
  - 技术栈采用 Next.js + TypeScript + SQLite + Drizzle。
- TDD 分类：
  - 部分 `TDD 例外`。脚手架配置本身不是业务行为，采用脚本缺失 / 质量门缺失作为 RED 证据。
  - 任何新增可观察产品行为仍需测试优先。
- 目标验证：
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`

### Verify RED

- `pnpm test`
  - 结果：失败，exit code 1。
  - 失败原因：`ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`，仓库根目录没有 `package.json`。
- `pnpm lint`
  - 结果：失败，exit code 1。
  - 失败原因：`ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`，仓库根目录没有 `package.json`。
- RED 结论：符合步骤 1 的 `TDD 例外` 预期，基础脚本和 package manifest 尚不存在。

### Minimal Implementation

- 创建 `package.json`，定义 `dev`、`build`、`lint`、`typecheck`、`test`、`e2e`、`db:generate`。
- 创建 Next.js / TypeScript / Tailwind / Vitest / Playwright / Drizzle 配置文件。
- 创建 `src/app/layout.tsx`、`src/app/page.tsx`、`src/app/globals.css`。
- 创建 Vitest setup 和 smoke test。
- 执行 `pnpm install` 生成 `pnpm-lock.yaml`。
- 安装时发现 latest TypeScript 7 与 ESLint 10 存在 peer compatibility 问题：
  - `typescript-eslint` 不支持 TypeScript 7。
  - Next / React ESLint 插件不支持 ESLint 10。
- 调整为兼容版本：
  - `typescript@6.0.3`
  - `eslint@9.39.5`
  - `@eslint/js@9.39.5`

### Verify GREEN

- `pnpm lint`
  - 结果：通过，exit code 0。
- `pnpm typecheck`
  - 结果：通过，exit code 0。
- `pnpm test`
  - 结果：通过，exit code 0，1 个测试文件、1 个测试通过。
- `pnpm build`
  - 结果：通过，exit code 0。
  - 说明：Next.js 16.4.0 使用 Turbopack 完成生产构建，并静态生成 `/`。
  - Next 自动更新 `tsconfig.json`：`jsx` 改为 `react-jsx`，`include` 增加 `.next/dev/types/**/*.ts`。

### Refactor After Green

- 将 `tsconfig.tsbuildinfo` 加入 `.gitignore`，避免提交本地增量编译缓存。
- 步骤 1 完成后未做业务逻辑重构。

## 步骤 2：建立配置、环境变量与健康检查

### Step Contract

- 前置输入：
  - 应用骨架已存在。
  - `.env` 文件不会提交到 Git。
- TDD 分类：严格 TDD。
- 目标验证：
  - `pnpm test src/lib/config.test.ts src/app/api/health/route.test.ts`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

### Verify RED

- 先写测试：
  - `src/lib/config.test.ts`
  - `src/app/api/health/route.test.ts`
- `pnpm test src/lib/config.test.ts src/app/api/health/route.test.ts`
  - 结果：失败，exit code 1。
  - 失败原因：无法解析 `./config` 和 `./route`，目标实现文件尚不存在。
- RED 结论：失败原因指向当前切片，满足 TDD RED。

### Minimal Implementation

- 新增 `.env.example`，包含 `DATABASE_URL`、`VIKUNJA_BASE_URL`、`VIKUNJA_API_TOKEN`。
- 新增 `src/lib/config.ts`：
  - 使用 Zod 校验环境变量。
  - 缺少 `DATABASE_URL` 时抛出包含字段名的错误。
  - 将空字符串 Vikunja 配置规范化为 `undefined`。
- 新增 `src/app/api/health/route.ts`：
  - 返回应用健康状态。
  - 返回 Vikunja 是否已同时配置 base URL 与 token。

### Verify GREEN

- `pnpm test src/lib/config.test.ts src/app/api/health/route.test.ts`
  - 结果：通过，exit code 0，2 个测试文件、3 个测试通过。
- 第一次回归：
  - `pnpm typecheck`：通过。
  - `pnpm test`：通过。
  - `pnpm build`：通过。
  - `pnpm lint`：失败，原因是测试 helper 使用变量名 `module` 触发 Next lint 规则。
- 修复：
  - 将测试 helper 变量名从 `module` 改为 `configModule`。
- 最终回归：
  - `pnpm lint`：通过，exit code 0。
  - `pnpm typecheck`：通过，exit code 0。
  - `pnpm test`：通过，exit code 0，3 个测试文件、4 个测试通过。
  - `pnpm build`：通过，exit code 0，生成 `/` 和 `/api/health`。

### Refactor After Green

- 将测试 helper 命名改为 `configModule`，消除 lint 风险。
- 未做额外业务重构。

## 步骤 3：定义领域模型与纯规则

### Step Contract

- 前置输入：
  - `design.md` 已定义本地保存 `area`、`goal`、`learning_topic`、`planning_period`、`time_block`、`review`、`task_link`。
  - 步骤 1 已完成，测试与类型检查可运行。
- TDD 分类：严格 TDD。
- 执行模式：
  - 计划标记为 `subagent candidate`。
  - Capability detection：multi_agent 工具可用；当前步骤是主线立即阻塞切片，没有可并行的非重叠主会话工作。
  - 决策：step-scoped fallback 到主会话，继续使用 `und-test-driven-development`。不声称使用了子代理。
- 目标验证：
  - `pnpm test src/domain/planning/rules.test.ts`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`

### Verify RED

- 先写测试：
  - `src/domain/planning/rules.test.ts`
- `pnpm test src/domain/planning/rules.test.ts`
  - 结果：失败，exit code 1。
  - 失败原因：无法解析 `./rules`，目标实现文件尚不存在。
- RED 结论：失败原因指向当前切片，满足 TDD RED。

### Minimal Implementation

- 新增 `src/domain/planning/types.ts`：
  - 定义 `Area`、`Goal`、`LearningTopic`、`PlanningPeriod`、`TimeBlock`、`Review`、`TaskLink`。
  - 定义领域枚举类型：领域类型、状态、目标周期、计划周期、复盘类型。
- 新增 `src/domain/planning/rules.ts`：
  - `createGoal`：规范化标题并创建 active 目标。
  - `createLearningTopic`：校验标题和 0-100 学习进度。
  - `createWeeklyPlanningPeriod`：根据 anchor date 创建周一到周日的计划周期。
  - `createTimeBlock`：校验起止时间并计算分钟数。
  - `addTimeBlock`：校验 period 归属、周期范围和时间块重叠。
  - `createReview`：校验计划 / 实际分钟数并计算偏差。

### Verify GREEN

- `pnpm test src/domain/planning/rules.test.ts`
  - 结果：通过，exit code 0，1 个测试文件、8 个测试通过。
- 完整回归：
  - `pnpm lint`：通过，exit code 0。
  - `pnpm typecheck`：通过，exit code 0。
  - `pnpm test`：通过，exit code 0，4 个测试文件、12 个测试通过。
  - `pnpm build`：通过，exit code 0。

### Refactor After Green

- 规则保持在 `src/domain/planning/rules.ts`，类型保持在 `src/domain/planning/types.ts`。
- 未接入 UI、数据库或 Vikunja，保持纯领域边界。

## 步骤 4：定义 TaskProvider 接口与内存实现

### Step Contract

- 前置输入：
  - 设计要求通过 `TaskProvider` 隔离 Vikunja。
  - 步骤 1 已完成，测试与类型检查可运行。
- TDD 分类：严格 TDD。
- 执行模式：
  - 计划标记为 `subagent candidate`。
  - Capability detection：multi_agent 工具可用；当前步骤是主线立即阻塞切片，没有可并行的非重叠主会话工作。
  - 决策：step-scoped fallback 到主会话，继续使用 `und-test-driven-development`。不声称使用了子代理。
- 目标验证：
  - `pnpm test src/domain/tasks/provider.contract.test.ts`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`

### Verify RED

- 先写测试：
  - `src/domain/tasks/provider.contract.test.ts`
- `pnpm test src/domain/tasks/provider.contract.test.ts`
  - 结果：失败，exit code 1。
  - 失败原因：无法解析 `../../integrations/memory/provider`，目标 provider 实现尚不存在。
- RED 结论：失败原因指向当前切片，满足 TDD RED。

### Minimal Implementation

- 新增 `src/domain/tasks/provider.ts`：
  - 定义 `TaskProvider` 接口。
  - 定义 `PlannerTask`、创建 / 更新输入、列表过滤器。
  - 定义 `TaskProviderError` 和错误码。
- 新增 `src/integrations/memory/provider.ts`：
  - 实现 `createMemoryTaskProvider`。
  - 支持 list、create、update、complete、postpone。
  - 对空标题、非法日期、缺失任务使用 typed provider error。
- 中途修复：
  - 初版 provider 方法在返回 Promise 前同步抛错，导致 `.rejects` contract 失败。
  - 将 provider 方法改为 `async`，保证 provider error 以 rejected promise 形式暴露。

### Verify GREEN

- `pnpm test src/domain/tasks/provider.contract.test.ts`
  - 结果：通过，exit code 0，1 个测试文件、6 个测试通过。
- 完整回归：
  - `pnpm lint`：通过，exit code 0。
  - `pnpm typecheck`：通过，exit code 0。
  - `pnpm test`：通过，exit code 0，5 个测试文件、18 个测试通过。
  - `pnpm build`：通过，exit code 0。

### Refactor After Green

- Provider contract 保持在 `src/domain/tasks`，内存实现保持在 `src/integrations/memory`。
- 统一 provider 错误通过 `TaskProviderError` 暴露，避免后续 UI 绑定具体实现细节。

## 步骤 5：建立 SQLite 数据库 schema 与仓储

### Step Contract

- 前置输入：
  - 领域类型已定义。
  - `DATABASE_URL` 配置已可读取。
  - `drizzle.config.ts` 已存在，但还没有实际 schema、client、仓储和迁移。
- TDD 分类：严格 TDD。
- 执行模式：
  - 计划标记为 `subagent candidate`。
  - Capability detection：multi_agent 工具可用；当前步骤会同时触碰 schema、仓储、迁移、依赖和数据模型文档，且没有明确可并行的非重叠主会话工作。
  - 决策：step-scoped fallback 到主会话，继续使用 `und-test-driven-development`。不声称使用了子代理。
- SQLite driver 决策：
  - 使用 `@libsql/client` + `drizzle-orm/libsql`。
  - 原因：与 Drizzle SQLite 适配器兼容，支持本地 `file:` SQLite URL，也避免 `better-sqlite3` 原生编译对安装环境和 VPN/网络状态的额外不确定性。
- 目标验证：
  - `pnpm test src/lib/db/repositories.test.ts`
  - `pnpm typecheck`
  - `pnpm db:generate`
  - 完整回归：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`

### Verify RED

- 先写测试：
  - `src/lib/db/repositories.test.ts`
- `pnpm test src/lib/db/repositories.test.ts`
  - 结果：失败，exit code 1。
  - 失败原因：无法解析 `./client`，目标数据库 client / schema / repository 实现尚不存在。
- RED 结论：失败原因指向当前切片，满足 TDD RED。

### Minimal Implementation

- 安装 `@libsql/client@0.18.0`：
  - 安装成功；未出现 VPN / 网络失败。
  - `pnpm` 提示跳过若干依赖 build scripts，当前测试与构建未受影响。
- 新增 `src/lib/db/schema.ts`：
  - 建立 `areas`、`goals`、`learning_topics`、`task_links`、`planning_periods`、`planning_period_focus_goals`、`planning_period_task_links`、`time_blocks`、`reviews`、`sync_cursors`。
- 新增 `src/lib/db/client.ts`：
  - 用 `@libsql/client` + `drizzle-orm/libsql` 创建 SQLite 连接。
  - 提供 `migratePlannerDatabase` 用于测试和本地初始化。
- 新增 `src/lib/db/repositories.ts`：
  - 实现本地规划数据写入、读取、规划周期 hydration、导出快照和 sync cursor upsert。
  - 在 repository 边界将 SQLite `null` 可选字段映射回领域对象的 `undefined`。
- 新增 `docs/development/data-model.md`：
  - 记录本地 SQLite 与 Vikunja 的数据边界。
- 执行 `pnpm db:generate`：
  - 结果：通过，生成 `drizzle/0000_cooing_gamma_corps.sql` 及 meta snapshot。

### Verify GREEN

- `pnpm test src/lib/db/repositories.test.ts`
  - 第一次结果：失败，exit code 1。
  - 原因：SQLite 可选字段取回为 `null`，`Area.color` 等领域对象期望 `undefined`。
  - 修复：在 repository 读取边界增加 `null -> undefined` 映射。
- `pnpm test src/lib/db/repositories.test.ts`
  - 最终结果：通过，exit code 0，1 个测试文件、2 个测试通过。
- `pnpm typecheck`
  - 第一次结果：失败，exit code 2。
  - 原因：`sync_cursors.error` 的 `null -> undefined` 映射在类型层没有收窄。
  - 修复：增加 `toSyncCursor` mapper。
- `pnpm typecheck`
  - 最终结果：通过，exit code 0。
- 完整回归：
  - `pnpm lint`：通过，exit code 0。
  - `pnpm typecheck`：通过，exit code 0。
  - `pnpm test`：通过，exit code 0，6 个测试文件、20 个测试通过。
  - `pnpm build`：通过，exit code 0。

### Refactor After Green

- 将 SQLite nullable 字段转换集中在 repository 边界，避免上层领域和用例处理数据库驱动细节。
- 仓储层保持不依赖 UI 或 Vikunja client。

## 步骤 6：实现规划用例服务

### Step Contract

- 前置输入：
  - 领域规则、仓储和 `TaskProvider` 已可用。
  - 步骤 5 已建立 SQLite / Drizzle 持久化和测试迁移。
- TDD 分类：严格 TDD。
- 执行模式：
  - 计划标记为 `subagent candidate`。
  - Capability detection：multi_agent 工具可用；当前步骤要串联领域规则、仓储和 provider，属于核心业务闭环，不适合拆出与主会话并行的独立实现。
  - 决策：step-scoped fallback 到主会话，继续使用 `und-test-driven-development`。不声称使用了子代理。
- 目标验证：
  - `pnpm test src/domain/planning/use-cases.test.ts`
  - `pnpm typecheck`
  - 完整回归：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`

### Verify RED

- 先写测试：
  - `src/domain/planning/use-cases.test.ts`
- `pnpm test src/domain/planning/use-cases.test.ts`
  - 结果：失败，exit code 1。
  - 失败原因：无法解析 `./use-cases`，目标用例服务实现尚不存在。
- RED 结论：失败原因指向当前切片，满足 TDD RED。

### Minimal Implementation

- 新增 `src/domain/planning/use-cases.ts`：
  - `createGoal`：通过领域规则创建目标并持久化。
  - `createLearningTopic`：通过领域规则创建学习主题并持久化。
  - `createWeeklyPlan`：创建外部任务、保存 `task_link`、创建周计划并关联本周重点任务。
  - `scheduleTimeBlock`：读取周期和已有时间块，复用领域规则校验周期范围与重叠，再持久化时间块。
  - `recordReview`：根据时间块汇总计划 / 实际分钟数并保存复盘。
  - provider 失败时包装为 `PlanningUseCaseError`，并在本地写入前中止。
- 更新 `src/lib/db/repositories.ts`：
  - 导出 `PlanningRepository` 类型，供用例层依赖抽象使用。

### Verify GREEN

- `pnpm test src/domain/planning/use-cases.test.ts`
  - 结果：通过，exit code 0，1 个测试文件、2 个测试通过。
- `pnpm typecheck`
  - 结果：通过，exit code 0。
- `pnpm test`
  - 结果：通过，exit code 0，7 个测试文件、22 个测试通过。
- `pnpm build`
  - 结果：通过，exit code 0。
- `pnpm lint`
  - 第一次结果：通过，exit code 0，但测试中的失败 provider 有 7 个 unused parameter warning。
  - 修复：将失败 provider 方法直接指向无参 `fail` helper。
  - 最终结果：通过，exit code 0，无 warning。

### Refactor After Green

- 失败 provider 测试替身改为无参 helper，消除 lint 噪音。
- 用例层保持为编排层，领域校验仍在 `rules.ts`，持久化细节仍在 repository。

## 步骤 7：实现 Vikunja client 与 provider 适配器

### Step Contract

- 前置输入：
  - `TaskProvider` contract 已存在。
  - 配置层已提供 `VIKUNJA_BASE_URL` 与 `VIKUNJA_API_TOKEN`。
  - 官方 OpenAPI 已核对：`GET /api/v2/tasks`、`POST /api/v2/projects/{project}/tasks`、`PATCH /api/v2/tasks/{task}`。
- TDD 分类：严格 TDD。
- 执行模式：
  - 计划标记为 `subagent candidate`。
  - Capability detection：multi_agent 工具可用；当前步骤涉及外部 API 契约、错误映射、安全边界和 route 集成，主会话执行便于同步 review。
  - 决策：step-scoped fallback 到主会话，继续使用 `und-test-driven-development`。不声称使用了子代理。
- 目标验证：
  - `pnpm test src/integrations/vikunja/provider.test.ts src/app/api/vikunja/test-connection/route.test.ts`
  - `pnpm test src/domain/tasks/provider.contract.test.ts`
  - `pnpm typecheck`
  - 完整回归：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`

### Verify RED

- 先写测试：
  - `src/integrations/vikunja/provider.test.ts`
  - `src/app/api/vikunja/test-connection/route.test.ts`
- `pnpm test src/integrations/vikunja/provider.test.ts src/app/api/vikunja/test-connection/route.test.ts`
  - 结果：失败，exit code 1。
  - 失败原因：无法解析 `./provider` 与 `./route`，目标 Vikunja provider 和连接测试 route 尚不存在。
- RED 结论：失败原因指向当前切片，满足 TDD RED。

### External API Grounding

- 通过 `https://try.vikunja.io/api/v2/openapi.json` 核对 API v2：
  - `GET /api/v2/tasks`：跨项目分页读取任务。
  - `POST /api/v2/projects/{project}/tasks`：在项目中创建任务。
  - `PATCH /api/v2/tasks/{task}`：更新、完成或延期任务。
  - 任务字段使用 `done`、`due_date`、`created`、`updated`、`labels`、`project_id` 等。
- API token 通过 `Authorization: Bearer ...` 发送，仅在服务端 provider / route 中使用。

### Minimal Implementation

- 新增 `src/integrations/vikunja/client.ts`：
  - 统一补齐 `/api/v2` base path。
  - 封装 Bearer authentication、JSON body、HTTP / network error 映射。
- 新增 `src/integrations/vikunja/schemas.ts`：
  - 用 Zod 校验任务和分页响应。
- 新增 `src/integrations/vikunja/provider.ts`：
  - 实现 `TaskProvider` 的 list、create、update、complete、postpone。
  - 映射 Vikunja numeric task ID 到内部 string ID。
  - 映射 Vikunja date-time 到内部 date-only due date。
  - 映射 `done`、labels、description、priority 和时间字段。
- 新增 `src/app/api/vikunja/test-connection/route.ts`：
  - 检查配置完整性。
  - 通过 list tasks 验证连接，并只返回连接状态和任务数量。
- 新增 `docs/development/vikunja.md`：
  - 记录环境变量、API v2 端点和 token 边界。
- 标签写入边界：
  - 本步读取并映射 Vikunja labels。
  - Vikunja v2 写入标签需要先解析 label ID，再调用专用 label endpoint；当前 MVP 暂不伪造为 task JSON 字段，后续按真实 UI 需求补齐。

### Verify GREEN

- `pnpm test src/integrations/vikunja/provider.test.ts src/app/api/vikunja/test-connection/route.test.ts`
  - 第一次结果：测试断言错误，URL 查询参数空格以 `+` 编码；生产请求没有问题。
  - 修复：改用 `URL.searchParams.get("filter")` 断言解码后的参数值。
  - 最终结果：通过，2 个测试文件、5 个测试通过。
- `pnpm test src/domain/tasks/provider.contract.test.ts`
  - 结果：通过，1 个测试文件、6 个测试通过。
- `pnpm typecheck`
  - 结果：通过，exit code 0。
- `pnpm lint`
  - 结果：通过，exit code 0。
- `pnpm test`
  - 结果：通过，exit code 0，9 个测试文件、27 个测试通过。
- `pnpm build`
  - 结果：通过，exit code 0，生成 `/api/vikunja/test-connection`。

### Refactor After Green

- 将 provider 的 HTTP、schema、领域映射分别放在 `client.ts`、`schemas.ts`、`provider.ts`。
- 连接 route 不泄露 token，也不把外部错误细节直接暴露给客户端。

## 步骤 8：搭建应用 Shell 与导航

### Step Contract

- 前置输入：
  - 应用骨架可运行。
  - MVP 页面清单已在 `design.md` 确认。
  - 领域、数据库和 TaskProvider 已具备可供后续页面接入的边界。
- TDD 分类：严格 TDD。
- 执行模式：主会话。
- Subagent 决策：计划明确要求主会话，UI 骨架需要统一控制交互和响应式视觉。
- 目标验证：
  - `pnpm test src/components/app-shell.test.tsx`
  - `pnpm lint`
  - `pnpm typecheck`
  - 完整回归：`pnpm test`、`pnpm build`

### Verify RED

- 先写测试：
  - `src/components/app-shell.test.tsx`
  - `src/app/page.test.tsx`
- `pnpm test src/components/app-shell.test.tsx`
  - 结果：失败，exit code 1。
  - 失败原因：无法解析 `/review` 等页面和 `AppShell`，目标应用框架尚不存在。
- RED 结论：失败原因指向当前切片，满足 TDD RED。

### Minimal Implementation

- 新增 `src/components/app-shell.tsx`：
  - 桌面左侧导航。
  - 移动端横向导航。
  - 当前路径 `aria-current="page"`。
- 新增 `src/components/status-banner.tsx`：
  - 展示 Vikunja 连接状态占位。
  - 提供进入连接设置的图标入口。
- 新增 `src/components/page-layout.tsx`：
  - 复用页面标题、空状态、指标条和操作链接。
- 更新 `src/app/layout.tsx`：
  - 全局包裹 `AppShell`。
- 更新 `src/app/page.tsx`：
  - 根路径跳转到 `/today`，避免继续显示脚手架说明页。
- 新增五个 MVP 页面：
  - `/today`
  - `/weekly`
  - `/goals`
  - `/review`
  - `/settings`

### Verify GREEN

- `pnpm test src/components/app-shell.test.tsx src/app/page.test.tsx`
  - 第一次结果：失败，原因是 jsdom 中桌面和移动导航同时存在，宽泛查询命中重复的 Today 链接。
  - 修复：测试限定在 `aria-label="Primary"` 的主导航内查询。
  - 最终结果：通过，2 个测试文件、3 个测试通过。
- `pnpm typecheck`
  - 结果：通过，exit code 0。
- `pnpm test`
  - 结果：通过，exit code 0，11 个测试文件、30 个测试通过。
- `pnpm lint`
  - 第一次结果：通过，exit code 0，但有 1 个未使用 lucide icon warning。
  - 修复：删除未使用 import。
  - 最终结果：通过，exit code 0。
- `pnpm build`
  - 结果：通过，exit code 0。
  - 生成页面：`/today`、`/weekly`、`/goals`、`/review`、`/settings`。
- 浏览器级检查：
  - `pnpm dev --hostname 127.0.0.1 --port 3000` 启动成功。
  - 根路径返回标准 `307 -> /today`。
  - Codex 内置浏览器打开 `/today`，桌面布局、主导航、连接状态条和空状态均可见。
  - 发现并修复全局 anchor 样式覆盖操作链接文字颜色的问题。
  - CSS 修复后，操作链接 computed color 为白色，按钮文字在截图中可见。
  - Playwright Chromium 下载因 VPN 下 CDN 长时间无进度而停止，未完成独立 Playwright 截图。

### Refactor After Green

- 抽出 `page-layout.tsx`，减少五个页面重复的标题、空状态和操作链接结构。
- 保持页面为空状态骨架，不提前实现 Step 9 / Step 10 的真实表单和数据绑定。
- 将全局 anchor 基础样式放入 Tailwind `@layer base`，确保页面级颜色 utility 可以正常覆盖。

## 步骤 9：实现 Goals & Learning 与 Weekly Plan

### Step Contract

- 前置输入：
  - 本地仓储和规划用例已通过测试。
  - App Shell 和五个页面入口已存在。
  - `TaskProvider` 已有统一接口，后续页面不直接依赖 Vikunja client。
- TDD 分类：严格 TDD。
- 执行模式：
  - 计划标记为 `subagent candidate`。
  - 当前切片同时涉及目标 / 学习主题表单、任务选择、时间块交互和页面数据边界；没有清晰的非重叠并行边界。
  - 决策：step-scoped fallback 到主会话，继续使用 `und-test-driven-development`。不声称使用了子代理。
- 目标验证：
  - `pnpm test src/components/goal-picker.test.tsx src/components/task-list.test.tsx src/components/time-block-grid.test.tsx`
  - `pnpm typecheck`
  - 完整回归：`pnpm lint`、`pnpm test`、`pnpm build`

### Verify RED

- 基础组件测试：
  - 先写 `src/components/goal-picker.test.tsx`、`src/components/task-list.test.tsx`、`src/components/time-block-grid.test.tsx`。
  - `pnpm test src/components/goal-picker.test.tsx src/components/task-list.test.tsx src/components/time-block-grid.test.tsx`
  - 结果：失败，exit code 1。
  - 失败原因：无法解析目标组件文件，当前切片实现尚不存在。
- API route 测试：
  - 先写 `src/app/api/planning/routes.test.ts`，覆盖 goals、learning topics、tasks、weekly、time blocks。
  - `pnpm test src/app/api/planning/routes.test.ts`
  - 结果：失败，exit code 1。
  - 失败原因：目标 planning API route 尚不存在。
- 页面容器测试：
  - 先写 `src/components/goals-workspace.test.tsx`、`src/components/weekly-planner.test.tsx`，并把 weekly GET 期望扩展为返回 `timeBlocks`。
  - `pnpm test src/components/goals-workspace.test.tsx src/components/weekly-planner.test.tsx src/app/api/planning/routes.test.ts`
  - 结果：失败，exit code 1。
  - 失败原因：`goals-workspace` / `weekly-planner` 组件尚不存在，weekly GET 未返回 `timeBlocks`。
- RED 结论：失败均指向 Step 9 当前切片，满足 TDD RED。

### Minimal Implementation

- 新增 planning runtime：
  - `src/lib/planning/runtime.ts` 统一初始化数据库、迁移、默认 work / learning areas 和 task provider。
  - 未配置 Vikunja 时回退到 memory provider。
- 新增 planning API：
  - `GET/POST /api/planning/goals`
  - `GET/POST /api/planning/learning-topics`
  - `GET /api/planning/tasks`
  - `GET/POST /api/planning/weekly`
  - `POST /api/planning/time-blocks`
  - `GET /api/planning/weekly` 返回 `planningPeriods` 与 `timeBlocks`，支持刷新后恢复周计划和时间块。
- 新增 UI 基础组件：
  - `GoalPicker`：工作目标和学习主题分栏展示与创建。
  - `TaskList`：开放任务列表和选择控件。
  - `TimeBlockGrid`：时间块列表与新增表单。
- 新增页面容器：
  - `GoalsWorkspace` 通过 planning API 加载 / 创建目标和学习主题。
  - `WeeklyPlanner` 通过 planning API 加载目标、任务、周计划和时间块，并支持创建周计划与添加时间块。
- 接入页面：
  - `src/app/goals/page.tsx` 接入 `GoalsWorkspace`。
  - `src/app/weekly/page.tsx` 接入 `WeeklyPlanner`。
- 工具链修复：
  - Next dev 自动生成 `AGENTS.md`；删除该未追踪文件，并在 `next.config.ts` 设置 `agentRules: false` 防止重复生成。
  - 将 `next-env.d.ts` 恢复为已提交的 `.next/types` 引用，避免 dev server 造成无关 churn。

### Verify GREEN

- Step 9 基础组件 / API 验证：
  - `pnpm test src/components/goal-picker.test.tsx src/components/task-list.test.tsx src/components/time-block-grid.test.tsx src/app/api/planning/routes.test.ts`
  - 结果：通过，exit code 0，4 个测试文件、9 个测试通过。
- 页面容器 / API 新增行为验证：
  - `pnpm test src/components/goals-workspace.test.tsx src/components/weekly-planner.test.tsx src/app/api/planning/routes.test.ts`
  - 结果：通过，exit code 0，3 个测试文件、6 个测试通过。
- Step 9 目标测试集：
  - `pnpm test src/components/goal-picker.test.tsx src/components/task-list.test.tsx src/components/time-block-grid.test.tsx src/components/goals-workspace.test.tsx src/components/weekly-planner.test.tsx src/app/api/planning/routes.test.ts`
  - 结果：通过，exit code 0，6 个测试文件、12 个测试通过。
- 质量门：
  - `pnpm lint`：通过，exit code 0。
  - `pnpm typecheck`：通过，exit code 0。
  - `pnpm test`：通过，exit code 0，17 个测试文件、42 个测试通过。
  - `pnpm build`：通过，exit code 0。
- 浏览器级检查：
  - 首次打开 `http://127.0.0.1:3000/goals` 时发现 dev server 未设置 `DATABASE_URL`，planning API 返回 400。
  - 停止旧 dev server 后，用 `DATABASE_URL=file:local.db pnpm dev --hostname 127.0.0.1 --port 3000` 重启。
  - Codex 内置浏览器打开 `/goals`：页面显示 Goals & Learning、工作目标表单和学习主题表单，无 API 错误。
  - Codex 内置浏览器打开 `/weekly`：页面显示 Weekly Plan、This week's focus、任务空状态、Capacity 和 Time blocks 区域，无 API 错误。

### Refactor After Green

- 页面级交互放入 `GoalsWorkspace` 和 `WeeklyPlanner`，基础组件保持只负责展示和表单事件。
- API route 继续作为 UI 与 planning runtime 的边界，UI 不直接依赖 Vikunja client 或数据库实现。
- 当前 Step 9 选择任务时提交任务快照创建周计划；后续可在独立切片补充“直接关联已有 Vikunja task”的领域用例。
