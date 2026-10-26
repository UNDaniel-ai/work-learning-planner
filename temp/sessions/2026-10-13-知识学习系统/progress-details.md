# 进度记录：学习执行与知识沉淀系统

## 2026-10-19：恢复并完成 Stage 3 实现计划

- **路由**：Route C
- **恢复前状态**：原 rollout 在创建实现计划前因上游模型网关错误中断；项目代码未进入本功能的实现阶段。
- **已核对**：现有仓库为 Next.js + Drizzle/SQLite + Vitest/Testing Library + Playwright；当前 schema 只有基础 planning 表和 `learning_topics`。
- **设计依据**：`design.md` 已定义 SQLite 结构化索引 + Git Markdown 资产、CS336 首条学习路径和 AI coach-only 边界。
- **用户确认**：用户此前明确回复“确认进入实现计划阶段”，本次续接继续执行 Stage 3。
- **本次动作**：创建 `implementation-plan.md`，补记 Stage 2 -> Stage 3 的确认，并同步更新 `INDEX.md`。
- **编码状态**：未修改 `src/`、Drizzle schema、migration 或产品 UI；仍禁止编码。
- **下一步唯一允许动作**：用户确认“确认开始编码”后，进入 Stage 4，从步骤 1 的 RED 开始。

## 计划阶段验证

- `implementation-plan.md` 已包含文件结构地图、11 个步骤、步骤依赖、文件范围、RED/GREEN 命令、预期结果、Step Acceptance、TDD 例外和阶段门禁。
- 文档检查：`git diff --check` 通过。
- 代码测试：本轮不运行，原因是没有产品代码变更，且当前 gate 仍禁止编码。

## 2026-10-19：Stage 4 步骤 1 完成

- **Stage 3 -> Stage 4 确认**：用户明确回复“确认开始编码”，允许进入 TDD 执行。
- **RED**：新增 `src/domain/learning/rules.test.ts` 后运行 `pnpm test src/domain/learning/rules.test.ts`，因 `./rules` 不存在而失败，符合预期。
- **GREEN**：新增 `src/domain/learning/types.ts` 和 `src/domain/learning/rules.ts`，实现来源、路径、模块、会话、证据、知识卡片、复习间隔和 AI coach-only 纯规则；目标测试 8/8 通过。
- **回归验证**：`pnpm test src/domain/learning/rules.test.ts src/domain/planning/rules.test.ts` 通过，16 个测试通过；`pnpm typecheck` 通过；`pnpm lint` 通过。
- **重构**：修正测试中的 `module` 变量名以满足 Next lint 规则，未改变行为。
- **下一步**：步骤 2 先为 learning repository 写失败测试，再添加 schema 和 migration。

## 2026-10-19：Stage 4 步骤 2 完成

- **RED**：新增 `src/lib/db/learning-schema.test.ts` 后运行 `pnpm test src/lib/db/learning-schema.test.ts`，因学习表导出不存在而失败，符合预期。
- **Minimal Implementation**：在 `src/lib/db/schema.ts` 增加八张学习表、保守外键、JSON metadata、路径顺序唯一性和关联/复习队列索引；生成 `drizzle/0001_uneven_mulholland_black.sql` 与 snapshot。
- **GREEN**：`pnpm test src/lib/db/learning-schema.test.ts` 通过，临时 SQLite 能迁移并持久化 source、track、module、session、evidence、card、review 和 coach event。
- **回归验证**：`pnpm test src/lib/db/learning-schema.test.ts src/lib/db/repositories.test.ts` 通过，3 个测试通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **TDD 例外**：Drizzle migration/snapshot 与 `docs/development/data-model.md` 不单独做单元测试；替代验证为 migration 集成测试、生成器输出、typecheck、lint 和 diff check。
- **边界核对**：SQLite 只保存结构化学习索引和状态；用户 Markdown 正文继续由后续 `learning/` writer 管理；不保存外部全文、token 或完整作业解答。
- **下一步**：步骤 3 先写学习仓储与组合导出失败测试，验证过滤、排序、缺失 ID 和导出边界。

## 2026-10-19：Stage 4 步骤 3 完成

- **RED**：`pnpm test src/lib/db/learning-repositories.test.ts src/lib/db/repositories.test.ts` 因 `./learning-repositories` 不存在以及 planning export 缺少 `learning` 节点而失败，符合预期。
- **Minimal Implementation**：新增独立 learning repository，提供八类对象的创建、详情、列表、关联过滤、可变状态更新、复习队列和结构化导出；planning repository 只在导出时组合 learning index。
- **GREEN**：学习仓储与 planning repository 目标测试 5/5 通过。
- **回归验证**：加入 export route 消费者后，`pnpm test src/lib/db/learning-repositories.test.ts src/lib/db/repositories.test.ts src/app/api/export/route.test.ts` 通过，6 个测试通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **边界核对**：导出保留旧 planning 字段，并新增 `learning` metadata；只包含相对 Markdown 路径和用户摘要，不存在 token、外部全文或作业完整实现字段。
- **下一步**：步骤 4 先用临时工作区测试 Markdown 路径、frontmatter、重复写入与路径穿越防护。

## 2026-10-19：Stage 4 步骤 4 完成

- **RED**：`pnpm test src/lib/learning/markdown-assets.test.ts src/lib/config.test.ts` 因 `./markdown-assets` 不存在以及 `learningAssetsDirectory` 配置缺失而失败，符合预期。
- **Minimal Implementation**：新增只使用 Node 文件系统的 Markdown asset writer，生成 track/module/session/card 固定目录与 JSON-safe frontmatter；新增 `LEARNING_ASSETS_DIR`，默认 `learning`。
- **GREEN**：writer/config 目标测试 6/6 通过。
- **修正**：非法 slug 最初同步抛错，与异步 writer 契约不一致；统一为 Promise rejection 后再次 GREEN。根因明确，未进入未知故障调试流程。
- **回归验证**：`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **TDD 例外**：目录和模板以临时工作区文件断言验证，不添加 UI snapshot。
- **边界核对**：writer 拒绝绝对/逃逸资产目录与不安全 slug，并用 `wx` 原子创建避免覆盖已有用户正文。
- **下一步**：步骤 5 为 source、track、module 创建/详情用例和 API 契约先写失败测试。

## 2026-10-19：Stage 4 步骤 5 完成

- **RED**：`pnpm test src/domain/learning/use-cases.test.ts src/app/api/learning` 因 `learning/use-cases`、runtime 和 source/track routes 不存在而失败，符合预期。
- **Minimal Implementation**：实现 source 创建、track + ordered modules 创建和详情读取；先校验 source/topic/stable ID，再生成 Markdown 骨架并落库；新增 source/track API 与学习错误映射。
- **GREEN**：目标用例/API 测试 7/7 通过。
- **回归验证**：learning domain/lib/db/API 与原 planning/export 相关测试 28/28 通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **数据库隔离**：`getLearningRuntime(request)` 复用 `getPlanningRuntime(request)` 返回的 database mode 和 connection，不解析第二次 cookie、不创建独立数据库策略。
- **边界核对**：非法 URL 由 Zod 拒绝；重复 ID 返回 409；source/topic/track 缺失返回 404；CS336 source 保存 `coach_only`，本步骤不接入模型或 direct solution。
- **下一步**：步骤 6 为 session 状态转换、evidence 归属、完成前证据要求和 Markdown metadata 更新先写失败测试。

## 2026-10-19：Stage 4 步骤 6 完成

- **RED**：领域、Markdown writer 和 session route 测试因 `createSession`、`addEvidence`、`updateSessionMetadata` 及 routes 不存在而失败，符合预期。
- **Minimal Implementation**：实现 session 创建/状态转换、evidence 添加、详情读取；来源目录从 track 已保存的 Markdown path 解析；新增 session/evidence API 和 evidence Markdown 模板。
- **GREEN**：步骤目标测试 14/14 通过。
- **回归验证**：learning domain/lib/db/API 与 planning API 测试 35/35 通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **行为边界**：completed 必须至少有一条 evidence；blocked 必须说明 blocker；缺失 module/session 返回具名错误；session frontmatter 更新只替换 metadata，保留用户正文。
- **下一步**：步骤 7 为 evidence-backed card、成熟度单步升级、due queue 和复习评分持久化先写失败测试。

## 2026-10-19：Stage 4 步骤 7 完成

- **RED**：规则、用例、writer 与 card/review route 测试分别因成熟度转换、card/review 用例、card metadata 更新和 routes 缺失而失败，符合预期。
- **Minimal Implementation**：实现 evidence-backed card 提升、成熟度单步升级、知识卡片详情、due queue 与 recall 评分；新增 card/review API 和 frontmatter 保留式更新。
- **Schema 演进**：`review_items` 新增 `last_answer`、`last_error_type`，生成 `drizzle/0002_superb_wrecker.sql`；仓储测试验证字段 round-trip。
- **GREEN**：步骤目标测试 26/26 通过。
- **回归验证**：含 migration、仓储、learning API、planning API 和 export 的 45/45 测试通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **边界核对**：card evidence 必须属于所选 session 且包含 track source；成熟度不可跳级；review 保存回答/错误类型但不保存外部全文或作业实现。
- **下一步**：步骤 8 先按现有 App Shell/PageHeader 模式测试 `/learning` 列表、详情、session、evidence、card 与 review queue UI。

## 2026-10-19：Stage 4 步骤 8 完成

- **RED**：新增 learning workspace 组件测试后，因 `/learning` 页面和 `LearningWorkspace`、`LearningTrackWorkspace`、`StudySessionWorkspace`、`KnowledgeCardWorkspace` 尚不存在而失败，符合预期。
- **Minimal Implementation**：新增学习首页、路径详情、学习会话和知识卡片页面与工作区组件；App Shell 加入 Learning 导航；页面沿用现有 fetch、loading、error、empty state 和轻量边框布局。
- **GREEN**：`pnpm test src/components/learning-workspaces.test.tsx src/components/app-shell.test.tsx` 通过，2 个文件、6 个测试通过。
- **测试修正**：模块标题会同时出现在模块列表和 session 表单 option 中，断言由 `findByText` 改为 `findAllByText`，与实际可访问 UI 一致。
- **回归验证**：learning domain/lib/db/API、planning API、learning workspace 与 App Shell 共 12 个文件、50 个测试通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **TDD 例外**：视觉细节不做像素级测试；桌面和窄屏的浏览器截图、溢出和非空渲染检查保留到步骤 11 的 E2E/视觉验收。
- **下一步**：步骤 9 先为 Today 日期关联、Weekly 周期关联、Review 学习产出聚合和 Export 数据边界添加失败测试。

## 2026-10-19：Stage 4 步骤 9 完成

- **RED**：新增 repository、planning routes 和三个 workspace 的学习集成断言后，目标集合 17 个测试中 7 个失败；失败点为缺少 session summary/period summary 聚合、API 响应字段和 UI 摘要，符合预期。Export 非空 learning metadata 与相对路径边界测试已在 RED 阶段通过，因为步骤 3 已建立导出节点。
- **Minimal Implementation**：learning repository 新增可按 period/time block 过滤的 session + module summary，以及 period 级 session/evidence/card/blocked question 聚合；Today、Weekly、Review routes 复用同一 database mode 的 learning runtime；三个工作区显示学习入口和复盘摘要。
- **GREEN**：`pnpm test src/lib/db/learning-repositories.test.ts src/app/api/planning src/components/today-workspace.test.tsx src/components/weekly-planner.test.tsx src/components/review-workspace.test.tsx src/app/api/export/route.test.ts` 通过，7 个文件、17 个测试通过。
- **回归验证**：`pnpm test` 全量 34 个文件、104 个测试通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **边界核对**：聚合查询位于 learning repository，React 不读取 Drizzle；Today 只显示关联到当日 time block 的会话；Review 不读取 Markdown 正文；Export 只透传结构化索引和相对 Markdown path。
- **下一步**：步骤 10 为允许的 coach mode、coach-only 直接解答拦截、源码/命令边界和审计事件记录先写失败测试。

## 2026-10-19：Stage 4 步骤 10 完成

- **RED**：纯规则、use case、coach route 和 learning workspace 四个目标文件均失败，原因分别是 action 边界判定、`recordCoachEvent`、route 和 session coach UI 不存在，符合预期。
- **Minimal Implementation**：新增六种允许模式和四种 requested action 的纯边界判定；use case 从 session -> module -> track -> source 读取 `aiGuidance` 并写入审计事件；新增 coach event GET/POST API；session 页面可记录并查看允许的教练交互。
- **边界行为**：direct solution、TODO completion、assignment edit 和 command execution 写 blocked event；blocked event 使用标准原因并丢弃调用方 output；严格 API schema 拒绝 `assignmentSource`；summary 在领域层限制为 500 字符；未调用模型 provider。
- **GREEN**：目标 4 个文件、26 个测试通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **回归验证**：`pnpm test` 全量 35 个文件、109 个测试通过；`docs/development/testing.md` 已记录无模型调用和 coach 边界测试范围。
- **下一步**：步骤 11 先为 CS336 test-database seed 和端到端学习闭环添加失败测试，再完成 build、E2E、视觉和最终 Stage 4 验证。

## 2026-10-19：Stage 4 步骤 11 完成

- **RED**：新增 `src/lib/learning/seeds.test.ts`、seed route test 和 `e2e/learning.spec.ts` 后，先因 seed helper、route 与浏览器闭环实现缺失失败，符合预期。
- **Minimal Implementation**：新增只允许 test database 的幂等 CS336 seed，创建 1 个 `coach_only` source、1 条 track 和 8 个有序模块，其中第 5 个模块为 `Attention, mask, and RoPE`；新增 `/api/learning/seed/cs336` 和完整浏览器学习闭环。
- **集成补全**：创建 session 时由 learning track 页面发现并提交 active planning period；evidence UI 支持 `pass`、`fail`、`observed`、`unknown`；Playwright 固定使用 `localhost:3100`、1 worker、`local.e2e.db` 和 `temp/e2e-learning-assets`，且不复用已有 server。
- **GREEN**：seed/helper/API 目标测试通过；最终全量 Vitest 37 个文件、114 个测试通过；Playwright 的 learning 与旧 MVP 两条用例均通过。
- **边界覆盖**：E2E 验证 test database 切换、CS336 seed、planning period 关联、session 创建、失败 evidence、允许的 coach audit、session 完成、知识卡片提升、recall 持久化、成熟度升级、Review 聚合、Export learning metadata，以及导出不含 `assignment-source-code`。
- **TDD 例外**：seed 文档、Playwright 配置和 `.gitignore` 通过 fixture/route/E2E、隔离查询和 `git diff --check` 验证，没有为生成或纯配置文本添加快照测试。

## 步骤 11 系统化调试记录

- **现象**：学习 E2E 在创建 session 时收到 400，页面显示 `Learning track has no valid Markdown path: track-cs336-assignment1`。
- **假设与检查**：依次检查 database mode、seed 记录和实际资产文件；确认 E2E 正在使用 test database，track 已保存 Markdown path，且 `temp/e2e-learning-assets/cs336-assignment1/track.md` 实际存在。
- **根因**：`sourceSlugFromTrack()` 只接受硬编码的 `learning/<slug>/track.md`，与已支持的 `LEARNING_ASSETS_DIR` 可配置根目录契约冲突。
- **修复**：从任意安全相对 `.../<slug>/track.md` 的直接父目录解析 source slug，同时继续拒绝绝对路径和 `..`。
- **回归证据**：先增加自定义资产根目录失败测试，再完成修复；目标测试与最终全量 Vitest/E2E 均通过。

## Stage 4 fresh verification evidence

| Claim | Command | Output | Result |
| --- | --- | --- | --- |
| 单元、仓储、API 与组件回归 | `pnpm test` | 37 个测试文件、114 个测试通过 | exit 0 |
| TypeScript 类型正确 | `pnpm typecheck` | 无类型诊断 | exit 0 |
| ESLint 规则通过 | `pnpm lint` | 无阻断错误 | exit 0 |
| 生产构建可生成 | `pnpm build` | Next.js build 成功，学习页面与 API 均包含在构建输出 | exit 0 |
| 浏览器学习闭环与旧 MVP 回归 | `pnpm e2e` | 1 worker，2/2 tests passed；learning 7.3s，MVP 1.3s，总计 10.7s | exit 0 |
| 文本与补丁格式 | `git diff --check` | 无输出 | exit 0 |

### 数据与资产隔离

- `local.e2e.db` 当前包含 1 个 source、1 条 track、8 个 modules，以及 4 次重复 E2E 累积的 sessions、evidence、cards、reviews 和 coach events；seed 重跑没有重复 source/track/modules。
- 个人库 `local.db` 没有 `learning_sources` 表，证明本轮 E2E 学习数据未写入个人数据库。
- `local.e2e.db`、`temp/e2e-learning-assets/**` 和 `test-results/**` 均由 `.gitignore` 命中；临时 Markdown 资产只位于 E2E 根目录。

### 视觉与响应式检查

- 浏览器用例对 `/learning`、track、session 和 card 四类页面分别在 1440x1000 与 390x844 viewport 检查非空渲染和页面水平溢出，断言均通过。
- 已人工检查 desktop/mobile 的 `/learning` 与 study session 截图；未发现空白渲染、应用 UI 文本碰撞或控件重叠。

## 当前门禁

- **Stage 4 状态**：步骤 1-11 与实现验证已完成。
- **是否允许宣告完成**：否；尚未进入 Stage 5 Acceptance，也未创建 `acceptance.md`。
- **下一步唯一允许动作**：用户明确回复“确认进入验收阶段”后，创建 `acceptance.md`，把上述 fresh evidence 映射到正式验收场景。
