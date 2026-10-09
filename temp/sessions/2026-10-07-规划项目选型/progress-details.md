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
