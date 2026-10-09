# 执行进度：Work & Learning Planner MVP

[← 返回 INDEX.md](./INDEX.md)

- **创建时间**: 2026-10-08 19:59 CST
- **当前路由**: Route C
- **当前阶段**: Stage 4 - TDD Execution
- **执行纪律**: TDD by default；显式 `TDD 例外` 必须记录原因和替代验证

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
