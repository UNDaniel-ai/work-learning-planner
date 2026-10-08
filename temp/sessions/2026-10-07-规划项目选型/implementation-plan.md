# 实现计划：Work & Learning Planner MVP

[← 返回 INDEX.md](./INDEX.md)

- **创建时间**: 2026-10-08 19:45 CST
- **当前路由**: Route C
- **当前阶段**: Stage 3 - Implementation Planning
- **计划状态**: 已确认，进入 Stage 4 执行
- **设计依据**: [design.md](./design.md)

## 计划概览

- **目标**：实现一个独立的 Work & Learning Planner Web 应用 MVP，通过 Vikunja API v2 读取执行任务，本地保存个人规划语义，并完成“目标 / 学习主题 → 周计划 → 今日执行 → 周复盘”的最小闭环。
- **总体策略**：先建立可测试的 TypeScript 全栈骨架，再实现领域模型和内存 provider，随后接入 Vikunja 适配器，最后补齐 UI、导出、验收和文档。
- **推荐技术栈**：
  - Next.js App Router + TypeScript：单仓库内同时承载页面和服务端接口。
  - SQLite + Drizzle ORM：单用户私有部署，低运维成本，迁移可追踪。
  - Zod：环境变量、表单输入和外部 API 响应校验。
  - Vitest + Testing Library：领域规则、provider contract 和组件测试。
  - Playwright：覆盖 MVP 的端到端路径。
  - Tailwind CSS + lucide-react：快速搭建清晰的工作型界面。
- **测试策略**：
  - 领域和 provider 先写失败测试，执行 `Verify RED` 后再实现。
  - UI 步骤先写组件或 e2e 期望，再实现页面。
  - 工具链和文档类步骤记录 `TDD 例外`，用格式检查、类型检查和文档完整性验证替代。
  - 产品行为变更默认不允许跳过 TDD；没有 RED 证据的步骤不能标记为 TDD 完成。
- **总体依赖**：
  - Node.js 与包管理器可用。
  - 需要一个 Vikunja 实例或测试 fixture；真实连接可延后到 provider contract 阶段。
  - 不提交 `.env`、数据库文件、令牌或本地运行数据。

## 文件结构地图

### 顶层文件

- `package.json`：脚本、依赖和项目元数据。
- `pnpm-lock.yaml`：锁定依赖版本。
- `tsconfig.json`：TypeScript 配置。
- `next.config.ts`：Next.js 配置。
- `eslint.config.mjs`：Lint 配置。
- `postcss.config.mjs`：Tailwind/PostCSS 配置。
- `vitest.config.ts`：单元和组件测试配置。
- `playwright.config.ts`：端到端测试配置。
- `.env.example`：必需环境变量示例，不包含真实令牌。
- `drizzle.config.ts`：数据库迁移配置。

### 应用源码

- `src/app/layout.tsx`：全局布局和样式入口。
- `src/app/page.tsx`：重定向或入口页。
- `src/app/today/page.tsx`：今日计划视图。
- `src/app/weekly/page.tsx`：周计划视图。
- `src/app/goals/page.tsx`：目标与学习主题视图。
- `src/app/review/page.tsx`：复盘视图。
- `src/app/settings/page.tsx`：Vikunja 连接与导出设置。
- `src/app/api/health/route.ts`：应用健康检查。
- `src/app/api/vikunja/test-connection/route.ts`：Vikunja 连接验证。
- `src/app/api/export/route.ts`：规划数据 JSON 导出。

### 领域与服务

- `src/domain/planning/types.ts`：核心领域类型。
- `src/domain/planning/rules.ts`：计划、时间块和复盘规则。
- `src/domain/planning/repository.ts`：本地规划数据仓储接口。
- `src/domain/planning/use-cases.ts`：周计划、今日计划和复盘用例。
- `src/domain/tasks/provider.ts`：`TaskProvider` 接口和 contract 类型。
- `src/integrations/vikunja/client.ts`：Vikunja HTTP client。
- `src/integrations/vikunja/provider.ts`：Vikunja `TaskProvider` 实现。
- `src/integrations/vikunja/schemas.ts`：Vikunja API 响应校验。
- `src/integrations/memory/provider.ts`：内存 `TaskProvider`，用于测试和本地 demo。
- `src/lib/config.ts`：环境变量读取和校验。
- `src/lib/db/schema.ts`：Drizzle schema。
- `src/lib/db/client.ts`：SQLite 连接。
- `src/lib/db/repositories.ts`：Drizzle 仓储实现。

### UI 组件

- `src/components/app-shell.tsx`：导航和页面框架。
- `src/components/task-list.tsx`：任务列表。
- `src/components/time-block-grid.tsx`：时间块展示和编辑。
- `src/components/goal-picker.tsx`：目标选择。
- `src/components/review-form.tsx`：复盘表单。
- `src/components/status-banner.tsx`：连接和同步状态。

### 测试

- `src/domain/planning/rules.test.ts`：领域规则测试。
- `src/domain/planning/use-cases.test.ts`：规划用例测试。
- `src/domain/tasks/provider.contract.test.ts`：provider contract 测试。
- `src/integrations/vikunja/provider.test.ts`：Vikunja 适配器测试，使用 mock fetch。
- `src/lib/db/repositories.test.ts`：SQLite 仓储测试。
- `src/components/*.test.tsx`：核心组件测试。
- `e2e/mvp.spec.ts`：从目标到周复盘的完整路径。

### 文档

- `docs/development/setup.md`：本地安装、运行和测试。
- `docs/development/vikunja.md`：Vikunja 配置和连接说明。
- `docs/development/data-model.md`：本地数据模型。
- `docs/development/testing.md`：测试策略和命令。

## 步骤列表

### 步骤 1：建立应用脚手架与基础质量门

- **状态**：已完成
- **优先级**：P0
- **依赖**：已确认 `design.md`
- **前置输入**：
  - 当前仓库没有产品代码。
  - 技术栈采用 Next.js + TypeScript + SQLite + Drizzle。
- **文件范围**：
  - `package.json`
  - `pnpm-lock.yaml`
  - `tsconfig.json`
  - `next.config.ts`
  - `eslint.config.mjs`
  - `postcss.config.mjs`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `drizzle.config.ts`
  - `next-env.d.ts`
  - `src/test/setup.ts`
  - `src/test/smoke.test.ts`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `src/app/globals.css`
- **执行模式**：主会话
- **Subagent Eligibility**：
  - 工具链初始化涉及后续所有步骤，适合主会话直接把控。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [x] `pnpm test` 在初始化前不存在或无法运行。
  - [x] `pnpm lint` 在初始化前不存在或无法运行。
- **Verify RED**：
  - [x] 记录初始化前脚本缺失或失败的输出。
- **Minimal Implementation**：
  - [x] 创建 Next.js TypeScript 应用骨架。
  - [x] 配置 lint、typecheck、test 和 e2e 脚本。
  - [x] 创建最小首页和全局样式。
- **Verify GREEN**：
  - [x] `pnpm lint` 通过。
  - [x] `pnpm typecheck` 通过。
  - [x] `pnpm test` 能运行并通过空或示例测试。
- **验证命令**：
  - [x] `pnpm install`
  - [x] `pnpm lint`
  - [x] `pnpm typecheck`
  - [x] `pnpm test`
  - [x] `pnpm build`
- **预期结果**：
  - [x] 仓库具备可运行的 TypeScript Web 应用骨架。
  - [x] 基础质量门可以在后续每一步重复执行。
- **Refactor**：
  - [x] 删除脚手架生成的无关示例内容。
- **Step Acceptance**：
  - [x] 基础脚本存在且通过。
  - [x] 首页可以通过生产构建渲染。
- **并行边界**：必须串行，所有产品代码依赖此步骤。
- **TDD 例外**：部分例外。脚手架配置本身不适合严格 TDD，但脚本缺失作为 RED 证据。

### 步骤 2：建立配置、环境变量与健康检查

- **状态**：已完成
- **优先级**：P0
- **依赖**：步骤 1
- **前置输入**：
  - 应用骨架已存在。
  - `.env` 文件不会提交到 Git。
- **文件范围**：
  - `.env.example`
  - `src/lib/config.ts`
  - `src/app/api/health/route.ts`
  - `src/lib/config.test.ts`
- **执行模式**：主会话
- **Subagent Eligibility**：
  - 配置边界较小，适合主会话执行。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [x] 缺失必需环境变量时配置测试失败。
  - [x] 健康检查路由不存在时 API 测试失败。
- **Verify RED**：
  - [x] `pnpm test src/lib/config.test.ts src/app/api/health/route.test.ts` 先失败。
- **Minimal Implementation**：
  - [x] 用 Zod 校验环境变量。
  - [x] 增加 `.env.example`，包含 `DATABASE_URL`、`VIKUNJA_BASE_URL`、`VIKUNJA_API_TOKEN`。
  - [x] 增加 `/api/health`。
- **Verify GREEN**：
  - [x] 配置测试通过。
  - [x] 健康检查返回应用状态。
- **验证命令**：
  - [x] `pnpm test src/lib/config.test.ts src/app/api/health/route.test.ts`
  - [x] `pnpm lint`
  - [x] `pnpm typecheck`
  - [x] `pnpm test`
  - [x] `pnpm build`
- **预期结果**：
  - [x] 应用能显式报告缺失或非法配置。
  - [x] 本地开发者可以从 `.env.example` 看出需要配置什么。
- **Refactor**：
  - [x] 确保配置读取集中在 `src/lib/config.ts`。
- **Step Acceptance**：
  - [x] `.env.example` 不包含真实密钥。
  - [x] 配置错误不会在运行中静默失败。
- **并行边界**：必须在 Vikunja 适配器和数据库步骤前完成。
- **TDD 例外**：无。

### 步骤 3：定义领域模型与纯规则

- **状态**：待开始
- **优先级**：P0
- **依赖**：步骤 1
- **前置输入**：
  - `design.md` 已定义本地保存 `area`、`goal`、`learning_topic`、`planning_period`、`time_block`、`review`、`task_link`。
- **文件范围**：
  - `src/domain/planning/types.ts`
  - `src/domain/planning/rules.ts`
  - `src/domain/planning/rules.test.ts`
- **执行模式**：subagent candidate
- **Subagent Eligibility**：
  - 领域规则边界清晰，适合并行实现；但主会话需 review 类型命名和业务语义。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] 新建目标、学习主题、周计划、时间块和复盘的规则测试先失败。
  - [ ] 时间块重叠、空目标标题、跨周日期等非法状态测试先失败。
- **Verify RED**：
  - [ ] `pnpm test src/domain/planning/rules.test.ts` 失败，失败原因是目标实现缺失。
- **Minimal Implementation**：
  - [ ] 定义核心类型和状态枚举。
  - [ ] 实现纯函数校验规则。
  - [ ] 实现周计划和时间块的基本计算。
- **Verify GREEN**：
  - [ ] 领域规则测试通过。
- **验证命令**：
  - [ ] `pnpm test src/domain/planning/rules.test.ts`
  - [ ] `pnpm typecheck`
- **预期结果**：
  - [ ] 本地规划领域有清晰类型和可测试规则。
  - [ ] 不依赖数据库或 Vikunja，也能验证核心业务约束。
- **Refactor**：
  - [ ] 把 UI 或 API 无关的业务逻辑保持在 `src/domain/planning`。
- **Step Acceptance**：
  - [ ] 非法领域状态有测试覆盖。
  - [ ] 类型命名与 `design.md` 的数据边界一致。
- **并行边界**：可与步骤 4 的 provider 接口并行。
- **TDD 例外**：无。

### 步骤 4：定义 TaskProvider 接口与内存实现

- **状态**：待开始
- **优先级**：P0
- **依赖**：步骤 1
- **前置输入**：
  - 设计要求通过 `TaskProvider` 隔离 Vikunja。
- **文件范围**：
  - `src/domain/tasks/provider.ts`
  - `src/domain/tasks/provider.contract.test.ts`
  - `src/integrations/memory/provider.ts`
- **执行模式**：subagent candidate
- **Subagent Eligibility**：
  - Provider contract 与内存实现边界明确，适合单独执行。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] provider contract 对 list、create、update、complete、postpone 的测试先失败。
- **Verify RED**：
  - [ ] `pnpm test src/domain/tasks/provider.contract.test.ts` 失败。
- **Minimal Implementation**：
  - [ ] 定义 `TaskProvider` 接口和统一错误类型。
  - [ ] 实现内存 provider。
  - [ ] 让 contract tests 能复用到 Vikunja provider。
- **Verify GREEN**：
  - [ ] 内存 provider 通过 provider contract。
- **验证命令**：
  - [ ] `pnpm test src/domain/tasks/provider.contract.test.ts`
  - [ ] `pnpm typecheck`
- **预期结果**：
  - [ ] 应用拥有不依赖 Vikunja 的任务 provider 抽象。
  - [ ] 后续 UI 和用例可以先基于内存 provider 开发。
- **Refactor**：
  - [ ] 确保外部 provider 错误不会泄露到 UI 类型。
- **Step Acceptance**：
  - [ ] Contract test 可用于多个 provider。
  - [ ] 内存 provider 覆盖 MVP 所需任务行为。
- **并行边界**：可与步骤 3 并行，必须早于 UI 集成。
- **TDD 例外**：无。

### 步骤 5：建立 SQLite 数据库 schema 与仓储

- **状态**：待开始
- **优先级**：P0
- **依赖**：步骤 2、步骤 3
- **前置输入**：
  - 领域类型已定义。
  - `DATABASE_URL` 配置已可读取。
- **文件范围**：
  - `drizzle.config.ts`
  - `src/lib/db/schema.ts`
  - `src/lib/db/client.ts`
  - `src/lib/db/repositories.ts`
  - `src/lib/db/repositories.test.ts`
  - `docs/development/data-model.md`
- **执行模式**：subagent candidate
- **Subagent Eligibility**：
  - 数据库 schema 和仓储边界清晰，可由 subagent 实现后主会话 review。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] 创建目标、学习主题、周计划、时间块、复盘和 task_link 的仓储测试先失败。
  - [ ] 导出所需数据读取测试先失败。
- **Verify RED**：
  - [ ] `pnpm test src/lib/db/repositories.test.ts` 失败。
- **Minimal Implementation**：
  - [ ] 建立 Drizzle schema。
  - [ ] 实现 CRUD 和查询方法。
  - [ ] 编写数据模型文档。
- **Verify GREEN**：
  - [ ] 仓储测试通过。
  - [ ] 数据模型文档与 schema 字段一致。
- **验证命令**：
  - [ ] `pnpm test src/lib/db/repositories.test.ts`
  - [ ] `pnpm typecheck`
  - [ ] `pnpm db:generate`
- **预期结果**：
  - [ ] 本地规划数据可以持久化。
  - [ ] 数据模型和迁移可以被 Git 追踪。
- **Refactor**：
  - [ ] 确保仓储不直接依赖 UI 或 Vikunja client。
- **Step Acceptance**：
  - [ ] 所有本地核心表都有测试覆盖。
  - [ ] 数据库文件仍被 `.gitignore` 排除。
- **并行边界**：依赖步骤 3，必须早于导出和真实页面。
- **TDD 例外**：无。

### 步骤 6：实现规划用例服务

- **状态**：待开始
- **优先级**：P0
- **依赖**：步骤 3、步骤 4、步骤 5
- **前置输入**：
  - 领域规则、仓储和 `TaskProvider` 已可用。
- **文件范围**：
  - `src/domain/planning/use-cases.ts`
  - `src/domain/planning/use-cases.test.ts`
- **执行模式**：subagent candidate
- **Subagent Eligibility**：
  - 用例服务具备明确输入输出，适合并行实现；主会话 review 业务闭环。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] 创建周计划、添加任务、分配时间块、记录复盘的用例测试先失败。
  - [ ] 外部任务被删除或 provider 失败时的测试先失败。
- **Verify RED**：
  - [ ] `pnpm test src/domain/planning/use-cases.test.ts` 失败。
- **Minimal Implementation**：
  - [ ] 实现周计划创建。
  - [ ] 实现任务关联和本周重点选择。
  - [ ] 实现时间块记录。
  - [ ] 实现每日 / 每周复盘保存。
- **Verify GREEN**：
  - [ ] 用例测试通过。
- **验证命令**：
  - [ ] `pnpm test src/domain/planning/use-cases.test.ts`
  - [ ] `pnpm typecheck`
- **预期结果**：
  - [ ] MVP 的核心业务闭环可以在无 UI 情况下运行。
  - [ ] provider 错误不会破坏本地规划数据。
- **Refactor**：
  - [ ] 将重复校验沉到领域规则。
- **Step Acceptance**：
  - [ ] 一条从目标到周复盘的用例测试通过。
  - [ ] 异常路径有明确错误结果。
- **并行边界**：必须早于 UI 页面和 e2e。
- **TDD 例外**：无。

### 步骤 7：实现 Vikunja client 与 provider 适配器

- **状态**：待开始
- **优先级**：P0
- **依赖**：步骤 2、步骤 4
- **前置输入**：
  - `TaskProvider` contract 已存在。
  - Vikunja API v2 作为目标接口。
- **文件范围**：
  - `src/integrations/vikunja/client.ts`
  - `src/integrations/vikunja/provider.ts`
  - `src/integrations/vikunja/schemas.ts`
  - `src/integrations/vikunja/provider.test.ts`
  - `src/app/api/vikunja/test-connection/route.ts`
  - `docs/development/vikunja.md`
- **执行模式**：subagent candidate
- **Subagent Eligibility**：
  - 外部适配器可用 mock fetch 隔离，适合独立实现；主会话需 review 错误语义和安全边界。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] mock fetch 下的 list、create、complete、postpone contract 测试先失败。
  - [ ] 401、404、网络失败和 schema mismatch 测试先失败。
- **Verify RED**：
  - [ ] `pnpm test src/integrations/vikunja/provider.test.ts` 失败。
- **Minimal Implementation**：
  - [ ] 封装 authenticated fetch。
  - [ ] 用 Zod 校验响应。
  - [ ] 映射 Vikunja task 到内部 task 类型。
  - [ ] 实现连接测试 API。
  - [ ] 编写 Vikunja 配置文档。
- **Verify GREEN**：
  - [ ] Vikunja provider 通过 contract tests。
  - [ ] 错误路径测试通过。
- **验证命令**：
  - [ ] `pnpm test src/integrations/vikunja/provider.test.ts`
  - [ ] `pnpm test src/domain/tasks/provider.contract.test.ts`
  - [ ] `pnpm typecheck`
- **预期结果**：
  - [ ] 应用可以通过统一 provider 读取和写入 Vikunja 任务。
  - [ ] API 令牌不会出现在日志或客户端 bundle 中。
- **Refactor**：
  - [ ] 把 API 路径和字段映射集中在 `src/integrations/vikunja`。
- **Step Acceptance**：
  - [ ] mock 版 Vikunja contract 全部通过。
  - [ ] 文档说明如何配置真实 Vikunja。
- **并行边界**：可与步骤 5、6 部分并行；真实 UI 集成依赖此步骤。
- **TDD 例外**：无。

### 步骤 8：搭建应用 Shell 与导航

- **状态**：待开始
- **优先级**：P1
- **依赖**：步骤 1
- **前置输入**：
  - 应用骨架可运行。
  - MVP 页面清单已在 `design.md` 确认。
- **文件范围**：
  - `src/components/app-shell.tsx`
  - `src/components/status-banner.tsx`
  - `src/app/layout.tsx`
  - `src/app/today/page.tsx`
  - `src/app/weekly/page.tsx`
  - `src/app/goals/page.tsx`
  - `src/app/review/page.tsx`
  - `src/app/settings/page.tsx`
- **执行模式**：主会话
- **Subagent Eligibility**：
  - UI 骨架需要符合产品体验约束，主会话实现更稳。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] 组件测试期望导航包含 Today、Weekly、Goals、Review、Settings，初始化前失败。
- **Verify RED**：
  - [ ] `pnpm test src/components/app-shell.test.tsx` 失败。
- **Minimal Implementation**：
  - [ ] 建立响应式应用框架。
  - [ ] 创建五个页面的空状态。
  - [ ] 增加连接状态展示位。
- **Verify GREEN**：
  - [ ] App shell 组件测试通过。
- **验证命令**：
  - [ ] `pnpm test src/components/app-shell.test.tsx`
  - [ ] `pnpm lint`
  - [ ] `pnpm typecheck`
- **预期结果**：
  - [ ] 用户可以在五个 MVP 页面之间导航。
  - [ ] 页面视觉结构为工作型界面，而不是营销页。
- **Refactor**：
  - [ ] 抽离重复页面标题和状态样式。
- **Step Acceptance**：
  - [ ] 桌面和移动宽度下导航可用。
  - [ ] 空状态不含无意义说明墙。
- **并行边界**：可在领域用例完成前进行，但真实数据绑定依赖步骤 6。
- **TDD 例外**：无。

### 步骤 9：实现 Goals & Learning 与 Weekly Plan

- **状态**：待开始
- **优先级**：P0
- **依赖**：步骤 5、步骤 6、步骤 8
- **前置输入**：
  - 本地仓储和规划用例已通过测试。
- **文件范围**：
  - `src/app/goals/page.tsx`
  - `src/app/weekly/page.tsx`
  - `src/components/goal-picker.tsx`
  - `src/components/task-list.tsx`
  - `src/components/time-block-grid.tsx`
  - 相关组件测试
- **执行模式**：subagent candidate
- **Subagent Eligibility**：
  - 页面范围明确，可在 contract 清楚后并行实现；主会话 review 交互完整性。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] 创建目标和学习主题的组件测试先失败。
  - [ ] 周计划选择重点任务和添加时间块的测试先失败。
- **Verify RED**：
  - [ ] `pnpm test src/app/weekly` 或相关组件测试失败。
- **Minimal Implementation**：
  - [ ] 实现目标和学习主题表单。
  - [ ] 实现本周计划创建和读取。
  - [ ] 实现任务列表和时间块分配。
- **Verify GREEN**：
  - [ ] 相关组件和用例集成测试通过。
- **验证命令**：
  - [ ] `pnpm test`
  - [ ] `pnpm typecheck`
- **预期结果**：
  - [ ] 用户可以创建工作目标和学习主题。
  - [ ] 用户可以把任务放入本周计划并分配时间块。
- **Refactor**：
  - [ ] 把表单校验和领域校验边界理清。
- **Step Acceptance**：
  - [ ] 周计划保存后刷新仍存在。
  - [ ] 工作 / 学习领域在 UI 中可区分。
- **并行边界**：依赖领域用例和仓储，必须在 Today 与 Review 完整闭环前完成。
- **TDD 例外**：无。

### 步骤 10：实现 Today 与 Review 闭环

- **状态**：待开始
- **优先级**：P0
- **依赖**：步骤 6、步骤 8、步骤 9
- **前置输入**：
  - 已能创建周计划和时间块。
- **文件范围**：
  - `src/app/today/page.tsx`
  - `src/app/review/page.tsx`
  - `src/components/review-form.tsx`
  - `src/components/time-block-grid.tsx`
  - 相关组件测试
- **执行模式**：subagent candidate
- **Subagent Eligibility**：
  - 页面行为清晰，但涉及完整闭环，subagent 输出必须通过 e2e review。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] Today 显示今日任务、完成任务、记录实际投入测试先失败。
  - [ ] Review 保存每日 / 每周复盘测试先失败。
- **Verify RED**：
  - [ ] 相关测试在实现前失败。
- **Minimal Implementation**：
  - [ ] 实现今日重点和时间块视图。
  - [ ] 实现完成、延期和记录投入。
  - [ ] 实现每日和每周复盘表单。
- **Verify GREEN**：
  - [ ] Today 和 Review 测试通过。
- **验证命令**：
  - [ ] `pnpm test`
  - [ ] `pnpm typecheck`
- **预期结果**：
  - [ ] 用户可以从周计划进入今日执行。
  - [ ] 用户可以在复盘中记录计划偏差和下周调整建议。
- **Refactor**：
  - [ ] 将时间格式和日期范围工具抽离到共享 helper。
- **Step Acceptance**：
  - [ ] 任务完成状态与 provider 状态一致。
  - [ ] 复盘不自动修改下周计划。
- **并行边界**：依赖步骤 9，必须早于 e2e 完整验收。
- **TDD 例外**：无。

### 步骤 11：实现 Settings、连接测试与 JSON 导出

- **状态**：待开始
- **优先级**：P1
- **依赖**：步骤 2、步骤 5、步骤 7、步骤 8
- **前置输入**：
  - 配置、仓储和 Vikunja provider 已存在。
- **文件范围**：
  - `src/app/settings/page.tsx`
  - `src/app/api/vikunja/test-connection/route.ts`
  - `src/app/api/export/route.ts`
  - `docs/development/setup.md`
  - `docs/development/vikunja.md`
- **执行模式**：主会话
- **Subagent Eligibility**：
  - 连接和导出涉及安全边界，主会话实现。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] 连接测试 API 的成功 / 失败测试先失败。
  - [ ] JSON 导出包含本地规划数据且不包含令牌的测试先失败。
- **Verify RED**：
  - [ ] 设置和导出相关测试先失败。
- **Minimal Implementation**：
  - [ ] 设置页显示连接状态。
  - [ ] 连接测试 API 调用 Vikunja provider。
  - [ ] 导出本地规划数据为 JSON。
  - [ ] 完成开发和 Vikunja 配置文档。
- **Verify GREEN**：
  - [ ] 连接测试和导出测试通过。
- **验证命令**：
  - [ ] `pnpm test`
  - [ ] `pnpm typecheck`
- **预期结果**：
  - [ ] 用户可以验证 Vikunja 连接。
  - [ ] 用户可以导出本项目本地规划数据。
- **Refactor**：
  - [ ] 将导出序列化逻辑从 API route 抽离，便于测试。
- **Step Acceptance**：
  - [ ] 导出文件不包含 API token。
  - [ ] 文档足以让用户启动应用并连接 Vikunja。
- **并行边界**：可在步骤 9、10 后期并行；必须早于最终验收。
- **TDD 例外**：无。

### 步骤 12：端到端 MVP 验收与开发文档收束

- **状态**：待开始
- **优先级**：P0
- **依赖**：步骤 1-11
- **前置输入**：
  - 应用核心页面、领域用例、provider 和导出均已完成。
- **文件范围**：
  - `e2e/mvp.spec.ts`
  - `docs/development/testing.md`
  - `README.md`
  - `temp/sessions/2026-10-07-规划项目选型/progress-details.md`
  - `temp/sessions/2026-10-07-规划项目选型/acceptance.md`
- **执行模式**：主会话
- **Subagent Eligibility**：
  - 最终验收需要整合所有证据，主会话执行。
- **Review Contract**：spec + quality
- **Failing Test**：
  - [ ] e2e 测试覆盖创建目标、学习主题、周计划、今日执行、复盘和导出，初始失败。
- **Verify RED**：
  - [ ] `pnpm e2e` 在功能未完整前失败。
- **Minimal Implementation**：
  - [ ] 完成 e2e 测试。
  - [ ] 修复 e2e 暴露的问题。
  - [ ] 更新 README 的运行、测试和验收说明。
  - [ ] 写入 `progress-details.md` 与 `acceptance.md`。
- **Verify GREEN**：
  - [ ] `pnpm lint` 通过。
  - [ ] `pnpm typecheck` 通过。
  - [ ] `pnpm test` 通过。
  - [ ] `pnpm e2e` 通过。
- **验证命令**：
  - [ ] `pnpm lint`
  - [ ] `pnpm typecheck`
  - [ ] `pnpm test`
  - [ ] `pnpm e2e`
- **预期结果**：
  - [ ] MVP 从目标创建到周复盘的完整路径可运行。
  - [ ] 验收文档包含 fresh verification evidence。
- **Refactor**：
  - [ ] 清理测试辅助函数和重复 UI 状态。
- **Step Acceptance**：
  - [ ] 所有质量门通过。
  - [ ] README 能指导本地运行。
  - [ ] `acceptance.md` 支撑 MVP 完成声明。
- **并行边界**：必须最后执行。
- **TDD 例外**：无。

## 动态子任务

- **Vikunja API 细节核查**：Stage 4 实现步骤 7 前，需要根据当时的官方文档核查 API 路径、认证方式和分页语义。
- **技术栈版本确认**：Stage 4 步骤 1 前，确认当前稳定的 Next.js、React、Drizzle、Vitest 和 Playwright 版本。
- **真实 Vikunja 实例准备**：可以先用 mock provider 完成 MVP，再用真实实例做手动验收。
- **UI 视觉基线**：步骤 8 前确认是否需要深色模式；默认先做浅色、紧凑、工作型界面。

## 串并行计划

- **必须串行**：步骤 1 → 步骤 2 → 步骤 3/4 → 步骤 5/6 → 步骤 9/10 → 步骤 12。
- **可并行候选**：
  - 步骤 3 与步骤 4。
  - 步骤 5 与步骤 7 的 mock client 部分。
  - 步骤 8 与领域服务后半段。
  - 步骤 11 与步骤 9/10 后期。
- **默认执行方式**：若 Stage 4 检测到 subagent 能力可用，优先将步骤 3、4、5、6、7、9、10 作为 subagent candidate；否则主会话按同一计划执行。

## 风险与缓解

- **Vikunja API 兼容风险**：把外部字段映射隔离到 `src/integrations/vikunja`，contract tests 固化内部语义。
- **同步复杂度膨胀**：第一版只做显式刷新和幂等写入，不做实时双向同步。
- **UI 范围膨胀**：只交付五个 MVP 页面，不做完整仪表盘或 Life OS。
- **数据丢失风险**：SQLite 数据库文件不进 Git，但 schema、迁移和 JSON 导出进入质量门。
- **令牌泄漏风险**：`.env` 被忽略，导出和日志测试明确排除令牌。

## TDD 执行纪律

用户已明确要求本项目后续实现注意 TDD。Stage 4 执行时采用以下硬性规则：

1. 每个产品行为步骤先写或更新目标测试。
2. 运行最小目标测试并记录 `Verify RED`，失败原因必须指向当前切片，而不是宽泛的工具链失败。
3. 只写让目标测试转绿所需的最小实现。
4. 重新运行同一个目标测试并记录 `Verify GREEN`。
5. 再运行该步骤声明的最小回归范围。
6. 只有 GREEN 后才能重构。
7. RED/GREEN 命令、结果和必要说明写入 `progress-details.md`。
8. 不适合 TDD 的步骤必须写明 `TDD 例外`、例外原因和替代验证。

禁止事项：

- 先写生产代码，再补确认性测试。
- 用 mock 隐藏未验证的外部集成契约。
- 为测试添加只在测试环境使用的生产 API 或分支。
- 用全量测试通过替代目标测试从 RED 到 GREEN 的证据。

## Stage 4 启动前检查

- [x] 用户确认步骤顺序。
- [x] 用户确认测试策略。
- [x] 用户确认 `预期结果` 作为步骤级输出契约。
- [x] 用户确认默认技术栈：Next.js + TypeScript + SQLite + Drizzle。
- [x] 用户确认首版由用户单独部署或提供 Vikunja，本项目只连接 Vikunja。
- [x] 用户确认 Stage 4 采用严格 TDD，除显式 `TDD 例外` 外必须记录 RED/GREEN 证据。
- [x] 可以进入编码阶段。

## 用户确认

- AI 发起确认消息：当前阶段为 Stage 3，下一阶段为 Stage 4 TDD Execution；确认前不开始产品编码。
- 用户确认原话：确认开始编码
- 确认时间：2026-10-08 19:59 CST
