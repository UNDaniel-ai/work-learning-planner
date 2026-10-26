# 实现计划：学习执行与知识沉淀系统

[← 返回 INDEX.md](./INDEX.md)

- **创建时间**: 2026-10-19 20:25:20 CST
- **当前路由**: Route C
- **当前阶段**: Stage 4 - TDD Execution
- **计划状态**: 已确认，步骤 1-11 与 Stage 4 fresh verification 已完成，等待 Stage 5 确认
- **设计依据**: [design.md](./design.md)
- **需求依据**: [requirements-alignment.md](./requirements-alignment.md)

## 计划概览

本计划把已确认的设计收敛为第一版可交付的学习闭环：

```text
学习来源 / 路径
  -> 学习模块
  -> 学习会话
  -> 证据
  -> 知识卡片
  -> 主动回忆
  -> Today / Review 连接
```

首期不会实现完整 Notion、Anki、RAG 或自动解题器。CS336 只作为受约束教练场景的验收数据，不把作业实现代码写入本项目。

### 实现约束

- 继续使用现有 Next.js App Router、TypeScript、Drizzle/SQLite、Zod、Vitest、Testing Library 和 Playwright。
- 个人数据库和测试数据库继续由现有 `planner_database_mode` 机制隔离。
- SQLite 保存结构化索引和状态；`learning/` 保存用户自己的 Markdown 学习资产。
- Markdown 只做显式生成和显式保存，不做实时双向同步；frontmatter 中的稳定 `id` 不能依赖文件名。
- 外部来源只保存 URL、revision 和用户自己的摘要，不复制课程原文、数据集、模型权重或作业完整答案。
- 产品行为按 `Verify RED -> Minimal Implementation -> Verify GREEN -> Refactor` 执行。
- 生成的 Drizzle migration、页面样式和文档步骤可以使用 `TDD 例外`，但必须记录替代验证命令。

## 文件结构地图

先固定文件职责，再进入步骤拆分。除迁移文件外，下面的路径都是实现阶段预计会创建或修改的范围。

### 领域模型与规则

- `src/domain/learning/types.ts`：LearningSource、LearningTrack、LearningModule、StudySession、EvidenceItem、KnowledgeCard、ReviewItem、AICoachEvent 及状态枚举。
- `src/domain/learning/rules.ts`：slug、日期、会话状态、证据结果、成熟度和复习间隔等纯规则。
- `src/domain/learning/rules.test.ts`：纯规则的 RED/GREEN 测试。
- `src/domain/learning/use-cases.ts`：创建学习路径、记录会话、添加证据、提升知识卡片、安排复习和记录 AI 边界事件。
- `src/domain/learning/use-cases.test.ts`：用例服务测试，使用仓储和 Markdown writer 的内存替身。

### 数据库与持久化

- `src/lib/db/schema.ts`：新增 8 张学习表及外键、枚举约束。
- `src/lib/db/learning-repositories.ts`：学习索引的 Drizzle 仓储，避免把学习查询继续堆进现有 planning repository。
- `src/lib/db/learning-repositories.test.ts`：临时 SQLite 持久化和查询排序测试。
- `src/lib/db/repositories.ts`：扩展规划导出组合，保持既有 planning API 向后兼容。
- `src/lib/db/repositories.test.ts`：增加包含 learning index 的导出断言。
- `drizzle/0001_*.sql` 与 `drizzle/meta/*`：由 `pnpm db:generate` 生成并纳入 Git，不手写快照。
- `docs/development/data-model.md`：补充学习表、Markdown 路径和导出边界。

### Markdown 资产

- `src/lib/learning/markdown-assets.ts`：安全 slug、目录创建、frontmatter 生成和相对路径返回。
- `src/lib/learning/markdown-assets.test.ts`：临时目录、稳定 ID、路径穿越和重复创建测试。
- `learning/`：默认个人知识资产根目录；只写用户自己的记录和摘要。
- `temp/e2e-learning-assets/`：E2E 使用的临时资产根目录，不与个人 `learning/` 混写。

### Runtime、API 与页面

- `src/lib/config.ts` / `src/lib/config.test.ts`：增加可选 `LEARNING_ASSETS_DIR`，默认使用项目根目录下的 `learning`。
- `src/lib/learning/runtime.ts`：复用现有数据库连接和 database mode，组装 learning repository、use cases 和 Markdown writer。
- `src/lib/planning/runtime.ts`：把 learning runtime 暴露给 API，同时保留现有 planning runtime 调用方式。
- `src/app/api/learning/sources/route.ts`：来源创建和列表。
- `src/app/api/learning/tracks/route.ts`：路径创建和列表。
- `src/app/api/learning/tracks/[trackId]/route.ts`：路径详情、模块、卡片和未解决问题摘要。
- `src/app/api/learning/sessions/route.ts`：学习会话创建、开始和完成。
- `src/app/api/learning/sessions/[sessionId]/evidence/route.ts`：证据新增和列表。
- `src/app/api/learning/cards/route.ts`：知识卡片创建、提升成熟度和列表。
- `src/app/api/learning/reviews/route.ts`：复习队列和复习结果记录。
- `src/app/api/learning/coach-events/route.ts`：AI 教练模式和边界事件记录，不调用模型。
- `src/app/api/learning/**/*.test.ts`：API 输入、状态码、database mode 和边界测试。
- `src/app/learning/page.tsx`：学习路径、当前模块、最近会话和待复习入口。
- `src/app/learning/[trackId]/page.tsx`：来源、模块、卡片和会话摘要。
- `src/app/learning/sessions/[sessionId]/page.tsx`：学习会话、证据和结论工作区。
- `src/app/learning/cards/[cardId]/page.tsx`：知识卡片、证据、关系和复习记录。
- `src/components/learning-workspace.tsx`：学习首页数据加载和路径创建交互。
- `src/components/learning-track-workspace.tsx`：路径详情和模块状态交互。
- `src/components/study-session-workspace.tsx`：开始前理解、尝试、证据和结论表单。
- `src/components/knowledge-card-workspace.tsx`：卡片编辑、成熟度和复习操作。
- `src/components/learning-workspace.test.tsx` 等：组件行为测试。
- `src/components/app-shell.tsx`：加入 `/learning` 导航项。

### 现有闭环集成与验收

- `src/app/api/planning/today/route.ts`：返回当前日期关联的 active study session 摘要。
- `src/app/api/planning/reviews/route.ts`：返回本周学习会话、证据和卡片产出摘要。
- `src/components/today-workspace.tsx`：时间块显示关联学习模块并提供开始会话入口。
- `src/components/review-workspace.tsx`：展示学习产出和阻塞问题。
- `src/app/api/export/route.ts`、`src/lib/planning/export.ts`：导出学习索引和 Markdown 相对路径，不导出 token 或外部原文。
- `e2e/learning.spec.ts`：CS336 初始化到知识卡片复习的最小浏览器路径。
- `docs/development/testing.md`：补充学习系统测试命令和 E2E 资产隔离说明。

## 数据边界

首期新增表的关系如下：

| 对象 | 关键关系 | 关键状态 |
| --- | --- | --- |
| `learning_sources` | 外部 URL、revision、AI 边界 | `active` / `archived` |
| `learning_tracks` | `source_id` + 可选 `learning_topic_id` | `active` / `completed` / `archived` |
| `learning_modules` | `track_id`、顺序、验收条件 | `not_started` / `active` / `blocked` / `completed` |
| `study_sessions` | `module_id`、可选 period/time block/task link | `planned` / `active` / `completed` / `blocked` |
| `evidence_items` | `session_id` | `pass` / `fail` / `observed` / `unknown` |
| `knowledge_cards` | `track_id`、`module_id`、Markdown path | `observed` / `understood` / `verified` / `applied` / `teachable` |
| `review_items` | `knowledge_card_id` | `active` / `suspended` / `mastered` |
| `ai_coach_events` | `session_id` | `allowed` / `blocked` |

所有表都使用字符串 ID 和 ISO 时间文本，外键删除策略默认保守，不允许删除来源时静默删除学习资产。实现时需要明确返回 404/422，而不是让 SQLite 错误泄露到 API。

## 步骤列表

### 步骤 1：建立学习领域类型与纯规则

- **状态**：已完成
- **优先级**：P0
- **依赖**：已确认的 `design.md`
- **前置输入**：设计中的八个领域对象、状态枚举、CS336 AI 边界和简单复习规则。
- **文件范围**：`src/domain/learning/types.ts`、`src/domain/learning/rules.ts`、对应测试。
- **执行模式**：主会话
- **Failing Test**：为 slug 生成、source revision 校验、模块顺序、会话状态转换、知识卡片成熟度转换和复习间隔先写测试。
- **Verify RED**：`pnpm test src/domain/learning/rules.test.ts` 已失败，原因是 `src/domain/learning/rules.ts` 不存在。
- **Minimal Implementation**：只实现纯函数和类型，不读取数据库、不写文件、不调用外部服务。
- **Verify GREEN**：目标测试通过，并覆盖非法状态、空标题、负置信度、错误复习评分等边界。
- **验证命令**：`pnpm test src/domain/learning/rules.test.ts`、`pnpm test src/domain/learning/rules.test.ts src/domain/planning/rules.test.ts`、`pnpm typecheck`、`pnpm lint`。
- **预期结果**：后续 schema、use case 和 API 使用同一组可复用类型与规则，所有状态转换有明确错误。
- **Refactor**：规则中不出现 React、Drizzle、Request 或文件系统依赖。
- **Step Acceptance**：至少覆盖设计中所有状态枚举；复习规则能产生明天、3/7/14 天的下一次时间。已通过 8 个 learning tests、16 个 planning + learning tests、typecheck 和 lint。
- **并行边界**：必须先于步骤 2、5、6、7；可与步骤 4 的测试夹具准备并行，但不提前编码。
- **TDD 例外**：无。

### 步骤 2：新增 SQLite 学习 schema 和可追踪 migration

- **状态**：已完成
- **优先级**：P0
- **依赖**：步骤 1
- **前置输入**：领域类型和字段表已稳定，现有 `schema.ts`、`drizzle.config.ts` 和 database mode 可复用。
- **文件范围**：`src/lib/db/schema.ts`、`drizzle/` 生成文件、schema 测试夹具、`docs/development/data-model.md`。
- **执行模式**：主会话
- **Failing Test**：先让 learning repository 的建表/插入测试引用不存在的表，确认 RED。
- **Verify RED**：`pnpm test src/lib/db/learning-schema.test.ts` 已因学习表导出不存在而失败。
- **Minimal Implementation**：添加八张表、外键、枚举和必要索引；运行 `pnpm db:generate` 生成 migration。
- **Verify GREEN**：migration 生成成功；schema 迁移/持久化测试与既有仓储回归 3/3 通过；`pnpm typecheck`、`pnpm lint`、`git diff --check` 通过。
- **验证命令**：`pnpm db:generate`、`pnpm test src/lib/db/learning-schema.test.ts src/lib/db/repositories.test.ts`、`pnpm typecheck`、`pnpm lint`、`git diff --check`。
- **预期结果**：personal/test 两种 runtime 都能迁移出相同的学习表，旧 planning 表和旧数据不被破坏。
- **Refactor**：表名、枚举和值域与 `types.ts` 一一对应；不把 Markdown 正文塞进 SQLite。
- **Step Acceptance**：临时 SQLite 已完整执行 migration 并写入八类学习记录；外键字段允许设计中标记的可选关联；migration、snapshot、队列/关联索引和数据模型文档已生成。
- **并行边界**：步骤 3、4 依赖该 schema；文档字段核对可在 migration 生成后并行。
- **TDD 例外**：Drizzle migration 和 snapshot 是生成产物，使用仓储持久化测试、`pnpm db:generate` 和 `pnpm typecheck` 替代直接对生成 SQL 做单元测试。

### 步骤 3：实现学习仓储和组合导出

- **状态**：已完成
- **优先级**：P0
- **依赖**：步骤 1、2
- **前置输入**：已迁移的八张表、现有 `PlannerDatabase` 和 planning repository 的排序/空值规范。
- **文件范围**：`src/lib/db/learning-repositories.ts`、其测试、`src/lib/db/repositories.ts`、`src/lib/db/repositories.test.ts`、`src/lib/planning/export.ts`。
- **执行模式**：主会话
- **Failing Test**：先写 source/track/module/session/evidence/card/review/coach event 的创建、列表、详情和排序测试；导出测试先要求 `learning` 节点。
- **Verify RED**：`pnpm test src/lib/db/learning-repositories.test.ts src/lib/db/repositories.test.ts` 已因 `learning-repositories` 不存在和导出缺少 `learning` 节点而失败。
- **Minimal Implementation**：实现最小 CRUD、按 track/module/session 过滤、复习队列排序，以及不包含 Markdown 正文的学习索引导出。
- **Verify GREEN**：学习仓储、planning repository 和 export route 测试 6/6 通过；旧 planning export 字段保持不变并新增 `learning` 节点；typecheck、lint、diff check 通过。
- **验证命令**：`pnpm test src/lib/db/learning-repositories.test.ts src/lib/db/repositories.test.ts`、`pnpm typecheck`。
- **预期结果**：use case 不需要直接写 Drizzle；API 能取得路径详情、会话证据和待复习队列；既有导出消费者不被破坏。
- **Refactor**：learning repository 和 planning repository 的职责分离，统一 `null`/`undefined` 转换和稳定排序。
- **Step Acceptance**：测试已覆盖空集合、按 ID 查不到、关联过滤、稳定排序、更新和导出不含 token/作业实现字段。
- **并行边界**：步骤 4 的 Markdown writer 可与本步骤并行；步骤 5-7 依赖本步骤。
- **TDD 例外**：无。

### 步骤 4：实现 Markdown 资产 writer 和路径配置

- **状态**：已完成
- **优先级**：P0
- **依赖**：步骤 1
- **前置输入**：设计中的 `learning/{source-slug}/...` 目录结构和 stable frontmatter 字段。
- **文件范围**：`src/lib/learning/markdown-assets.ts`、测试、`src/lib/config.ts`、`src/lib/config.test.ts`、`.env.example`。
- **执行模式**：主会话
- **Failing Test**：先写临时目录下的 source/track/module/session/card 文件生成测试，以及 `../`、绝对路径和重复写入测试。
- **Verify RED**：`pnpm test src/lib/learning/markdown-assets.test.ts src/lib/config.test.ts` 已因 writer 模块不存在及配置字段缺失而失败。
- **Minimal Implementation**：实现安全 slug、固定相对目录、frontmatter writer、幂等目录创建和 `LEARNING_ASSETS_DIR` 配置；只允许服务端调用。
- **Verify GREEN**：writer/config 测试 6/6 通过；临时目录路径稳定、内容可读、重复调用不覆写已有正文，非法 slug 和逃逸目录被拒绝；typecheck、lint、diff check 通过。
- **验证命令**：`pnpm test src/lib/learning/markdown-assets.test.ts src/lib/config.test.ts`、`pnpm lint`、`pnpm typecheck`。
- **预期结果**：每个结构化对象可得到 Git 可追踪的 Markdown 路径，数据库只记录相对路径和 metadata。
- **Refactor**：writer 不依赖 Request 或 UI；测试不写真实项目 `learning/`。
- **Step Acceptance**：frontmatter 已包含 stable `id`、title、状态、来源/证据 ID；`LEARNING_ASSETS_DIR` 支持默认 `learning` 和测试目录覆盖。
- **并行边界**：可与步骤 3 并行；步骤 5 的创建路径需要 writer 和 repository 都完成。
- **TDD 例外**：目录和模板属于文件资产行为，使用临时目录断言和 `git diff --check`，不以 UI 快照替代。

### 步骤 5：实现 Learning Source / Track / Module 创建工作流

- **状态**：已完成
- **优先级**：P0
- **依赖**：步骤 1-4
- **前置输入**：learning repository、Markdown writer、现有 `learning_topics` 和 runtime/database mode。
- **文件范围**：`src/domain/learning/use-cases.ts`、use case tests、`src/lib/learning/runtime.ts`、`src/lib/planning/runtime.ts`、`src/app/api/learning/sources/route.ts`、`tracks/route.ts`、`tracks/[trackId]/route.ts` 及 API tests。
- **执行模式**：主会话
- **Failing Test**：先测试创建 source 时保存 URL/revision/AI boundary，创建 track 时关联 topic，并按 module 输入生成稳定骨架。
- **Verify RED**：`pnpm test src/domain/learning/use-cases.test.ts src/app/api/learning` 已因 learning use-case 与 API route 模块不存在而失败。
- **Minimal Implementation**：实现 source、track、module 的创建和详情读取；对 `coach_only` 来源拒绝未支持的 AI boundary；API 用 Zod 校验。
- **Verify GREEN**：用例/API 测试 7/7 通过；API 返回 201/200，非法 URL、重复 stable ID、不存在的 source/topic/track 返回可读的 4xx。
- **验证命令**：`pnpm test src/domain/learning/use-cases.test.ts src/app/api/learning`、`pnpm typecheck`。
- **预期结果**：用户可以从一个来源建立 CS336 学习路径和模块，数据库索引与 Markdown 骨架同时存在。
- **Refactor**：runtime 复用现有 database mode 和迁移，不创建第二套数据库连接策略。
- **Step Acceptance**：learning runtime 复用 planning runtime 的 request、database mode 和连接；source/track 详情包含 revision、AI boundary、模块顺序和 Markdown 路径。
- **并行边界**：步骤 6、7 依赖 track/module；UI 可在 API contract 稳定后开始。
- **TDD 例外**：Markdown 初始内容模板用 writer 测试和 API 集成断言验证，不做完整 UI snapshot。

### 步骤 6：实现 Study Session 与 Evidence 记录闭环

- **状态**：已完成
- **优先级**：P0
- **依赖**：步骤 3、4、5
- **前置输入**：module 已存在；可选关联 planning period、time block 和 task link 的字段已确定。
- **文件范围**：learning use cases/types/rules、`src/app/api/learning/sessions/route.ts`、`sessions/[sessionId]/evidence/route.ts`、对应 tests、session Markdown 模板。
- **执行模式**：主会话
- **Failing Test**：先写 planned -> active -> completed/blocked 的转换测试，以及 evidence 类型、结果、引用和 session 归属测试。
- **Verify RED**：领域、writer 与 session route 测试已因 session/evidence 用例、writer 方法和 routes 缺失而失败。
- **Minimal Implementation**：创建/开始/完成 session，新增 evidence，更新 session summary/blocker/outcome；每次写入都更新 Markdown metadata。
- **Verify GREEN**：目标测试 14/14 通过；缺失 module/session 返回 404，完成前无 evidence、blocked 无 blocker 返回 422，合法 session/evidence 可读取。
- **验证命令**：`pnpm test src/domain/learning/use-cases.test.ts src/app/api/learning/sessions`、`pnpm lint`、`pnpm typecheck`。
- **预期结果**：一次学习活动能保存“问题 -> 开始前理解 -> 尝试 -> 失败/证据 -> 结论 -> 下一步”的完整可追踪记录。
- **Refactor**：API 不接受作业完整代码字段；错误摘要和引用长度设上限，避免把外部材料复制进库。
- **Step Acceptance**：session 关联一个 module，完成态至少关联一条 evidence；Markdown 文件路径与 SQLite `markdownPath` 一致，metadata 更新保留用户正文。
- **并行边界**：步骤 7 可在 session/repository contracts 稳定后开始；步骤 9 依赖 session GET 摘要。
- **TDD 例外**：无。

### 步骤 7：实现 Knowledge Card 与简单 Review Queue

- **状态**：已完成
- **优先级**：P0
- **依赖**：步骤 3、4、6
- **前置输入**：已有 session/evidence；设计中定义的成熟度、置信度和复习评分规则。
- **文件范围**：learning rules/use cases/repository、`src/app/api/learning/cards/route.ts`、`src/app/api/learning/reviews/route.ts`、对应 tests、card Markdown 模板。
- **执行模式**：主会话
- **Failing Test**：先测试从 session 提升 card 时必须引用 evidence，成熟度只能按允许顺序升级；新卡和复习结果要产生正确 nextReviewAt。
- **Verify RED**：规则、用例、writer 与 card/review route 测试因成熟度转换、card/review 用例、metadata 更新和 routes 缺失而失败。
- **Minimal Implementation**：实现 card 创建/编辑/成熟度提升、review queue 查询、评分后间隔更新和 lapseCount。
- **Verify GREEN**：目标测试 26/26 通过；无 session-owned evidence 的 card 被拒绝，成熟度逐级提升；评分 1-2 次日复习，评分 4-5 扩展间隔；队列稳定排序。
- **验证命令**：`pnpm test src/domain/learning/use-cases.test.ts src/app/api/learning/cards src/app/api/learning/reviews`、`pnpm typecheck`。
- **预期结果**：用户可以把已验证学习记录提升为知识卡片，并通过主动回忆回到学习闭环。
- **Refactor**：复习算法保持纯函数；不要在 API route 中散落日期计算。
- **Step Acceptance**：card 包含来源/证据/相关卡片 metadata；review 已通过增量 migration 持久化回答、评分、错误类型和下一次时间。
- **并行边界**：步骤 8 的卡片详情页依赖本步骤 API；步骤 10 的 coach event 可并行。
- **TDD 例外**：无。

### 步骤 8：实现 `/learning` 页面和学习资产工作区

- **状态**：已完成
- **优先级**：P1
- **依赖**：步骤 5-7 的 API contract
- **前置输入**：API 返回结构稳定，现有页面使用 `PageHeader`、轻量边框布局和 fetch state 的模式可复用。
- **文件范围**：`src/app/learning/**`、`src/components/learning-*.tsx`、`src/components/study-session-workspace.tsx`、`src/components/knowledge-card-workspace.tsx`、组件测试、`src/components/app-shell.tsx`。
- **执行模式**：主会话
- **Failing Test**：先写组件测试：路径列表、创建 source/track、打开 module、开始 session、添加 evidence、提升 card、看到 review queue。
- **Verify RED**：`src/app/learning` 页面和四个 workspace 组件尚不存在，组件测试因缺失模块而失败，符合预期。
- **Minimal Implementation**：先实现列表/详情/表单和 loading/error/empty 状态；导航加入 `/learning`，不在本步骤接入 AI 模型。
- **Verify GREEN**：`pnpm test src/components/learning-workspaces.test.tsx src/components/app-shell.test.tsx` 通过，2 个文件、6 个测试通过，交互不依赖真实数据库。
- **验证命令**：`pnpm test src/components/learning-*.test.tsx src/app/learning`、`pnpm lint`、`pnpm typecheck`。
- **预期结果**：用户可在浏览器中完成学习路径、会话、证据和卡片的基本操作，并始终能看到来源和证据链。
- **Refactor**：表单输入校验和 API 错误显示沿用现有组件边界，避免组件直接依赖 Drizzle。
- **Step Acceptance**：列表、路径、session、evidence、card、recall queue 和导航已有语义测试；目标 6/6、learning/planning 回归 50/50、typecheck、lint、diff check 通过。桌面和窄屏的实际浏览器视觉验收保留到步骤 11。
- **并行边界**：可在步骤 6/7 API 稳定后并行开发；步骤 9 会复用 session summary 组件。
- **TDD 例外**：视觉细节不做像素级断言，使用可见文本、role、状态和关键链接的语义测试。

### 步骤 9：连接 Today、Weekly、Review 和 Export

- **状态**：已完成
- **优先级**：P1
- **依赖**：步骤 6-8
- **前置输入**：session 可关联 time block/period；已有 Today、Review 和 export contracts。
- **文件范围**：Today/Review API 和组件、`src/app/api/export/route.ts`、`src/lib/planning/export.ts`、相关 tests、`src/app/weekly` 需要的类型扩展。
- **执行模式**：主会话
- **Failing Test**：先写 session summary 在指定日期出现、Review 返回学习产出、Export 包含 learning index/relative paths 且不含 token 的测试。
- **Verify RED**：目标集合 17 个测试中 7 个按预期失败，分别缺少 repository 聚合方法、Today/Weekly/Review 响应字段和三个工作区的学习摘要 UI。
- **Minimal Implementation**：Today 显示关联 module/session 入口；Review 聚合会话、evidence、card、blocked questions；导出加入 `learning` 节点并保留旧字段。
- **Verify GREEN**：目标 7 个文件、17 个测试通过；全量 Vitest 34 个文件、104 个测试通过；typecheck、lint、diff check 通过。
- **验证命令**：`pnpm test src/app/api/planning src/components/today-workspace.test.tsx src/components/review-workspace.test.tsx src/app/api/export/route.test.ts`、`pnpm typecheck`。
- **预期结果**：学习系统不再是独立笔记页，而是能从时间块开始、在 Review 复盘、在 Export 备份的第二条闭环。
- **Refactor**：聚合查询放在 learning repository/use case，不把数据库查询塞入 React component。
- **Step Acceptance**：Today 按当日 time block 显示 session/module 入口；Weekly 按当前 period 显示学习会话；Review 聚合 session、evidence、card 和 blocked question；既有 planning export JSON 保持兼容，非空 learning metadata 使用相对路径且不含 API token、外部全文或作业完整实现。
- **并行边界**：步骤 10 可并行；步骤 11 依赖本步骤的最终用户路径。
- **TDD 例外**：无。

### 步骤 10：实现 AI Coach mode 的边界记录

- **状态**：已完成
- **优先级**：P1
- **依赖**：步骤 1、3、6、8
- **前置输入**：design.md 中的六种允许模式和 `coach_only` 来源边界；本阶段不接入实际模型 provider。
- **文件范围**：learning types/rules/use cases、`src/app/api/learning/coach-events/route.ts`、页面中的模式选择和提示、相关 tests、`docs/development/testing.md`。
- **执行模式**：主会话
- **Failing Test**：先测试允许模式能记录 input/output summary，`direct_solution`、TODO 补全、自动编辑/运行作业命令被拒绝并产生 blocked event。
- **Verify RED**：目标 4 个文件均失败，分别缺少 action 边界规则、`recordCoachEvent` use case、coach event route 和 session coach UI，符合预期。
- **Minimal Implementation**：实现模式 schema、来源 boundary 检查、事件记录和 UI 提示；不调用远程模型，不保存完整对话或敏感 token。
- **Verify GREEN**：目标 4 个文件、26 个测试通过；全量 35 个文件、109 个测试通过；typecheck、lint、diff check 通过。合法事件返回 201，blocked 事件落审计后返回 403，session 详情显示事件轨迹。
- **验证命令**：`pnpm test src/domain/learning/use-cases.test.ts src/app/api/learning/coach-events`、`pnpm lint`、`pnpm typecheck`。
- **预期结果**：系统能表达“AI 作为教练而非解题器”的产品边界，并为后续接入模型保留审计记录。
- **Refactor**：边界规则独立于未来的模型客户端，避免把 provider 选择写进学习领域。
- **Step Acceptance**：CS336 `coach_only` UI 只暴露六种教练模式，没有 direct solution option；direct solution、TODO completion、自动编辑和命令执行产生 blocked 审计事件；blocked event 丢弃调用方 output，API 拒绝 `assignmentSource` 字段，未接入模型 provider。
- **并行边界**：可与步骤 8/9 并行；步骤 11 要求事件边界测试已通过。
- **TDD 例外**：无真实模型调用；用 schema/route/use case contract tests 代替外部服务验收。

### 步骤 11：CS336 种子路径、E2E 和文档验收

- **状态**：已完成
- **优先级**：P1
- **依赖**：步骤 5-10
- **前置输入**：所有 API/UI contract 已稳定；CS336 URL、revision 和模块清单已由 design.md 固定。
- **文件范围**：`src/lib/learning/seeds.ts`、seed tests、`e2e/learning.spec.ts`、`e2e/fixtures/**`（如需要）、`docs/development/data-model.md`、`docs/development/testing.md`、导出和迁移文档。
- **执行模式**：主会话
- **Failing Test**：先写浏览器路径：Settings 切 test database -> 创建 CS336 source/track -> 打开 Attention module -> 创建 session -> 添加失败 evidence -> 提升 card -> 完成一次 recall -> Review/Export。
- **Verify RED**：新增 seed helper、seed route 和浏览器闭环测试后，先因对应实现缺失失败；完成最小实现后的首次学习 E2E 在创建 session 时返回 400，暴露自定义资产根目录与路径解析不一致的问题。
- **Minimal Implementation**：提供只写测试数据库且幂等的 CS336 seed helper 和 route，创建 `coach_only` source、track 与 8 个有序模块；E2E 设置 `LEARNING_ASSETS_DIR=temp/e2e-learning-assets`，不污染个人数据库和个人 `learning/`，并覆盖 planning period、session、失败 evidence、coach audit、card、recall、Review 和 Export 闭环。
- **Verify GREEN**：seed/helper/API 目标测试通过；全量 Vitest 37 个文件、114 个测试通过；lint、typecheck、build、diff check 通过；Playwright 使用 1 worker 跑完 learning 与旧 MVP 两条用例，2/2 通过。
- **验证命令**：`pnpm test`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm e2e`、`git diff --check`。
- **预期结果**：CS336 示例形成一条可重复的学习闭环，个人数据库无 E2E 数据，导出和 Git 资产边界可验证。
- **Refactor**：`sourceSlugFromTrack()` 改为从任意安全相对 `.../<slug>/track.md` 的直接父目录取 slug，兼容可配置资产根目录，同时继续拒绝绝对路径和 `..`；文档记录真实限制：不运行作业命令、不保存完整作业实现、不提供 direct solution。
- **Step Acceptance**：E2E 在 test database 通过并包含失败证据、允许的 coach audit 和知识卡片；旧 `e2e/mvp.spec.ts` 继续通过；desktop 1440px 与 mobile 390px 页面无水平溢出；`git diff --check` 通过。
- **并行边界**：只能在所有功能切片完成后执行，属于 Stage 4 结束前的 fresh verification，不提前宣告项目完成。
- **TDD 例外**：seed 和文档以 fixture 断言、`git diff --check` 和全量命令验证；浏览器路径仍要求先 RED 再 GREEN。

## 执行顺序与阶段门禁

```text
1 领域规则
  -> 2 schema / migration
  -> 3 repository + export
  -> 4 Markdown assets
  -> 5 source / track / module
  -> 6 session / evidence
  -> 7 card / review
  -> 8 /learning UI
  -> 9 Today / Review / Export
  -> 10 coach boundary
  -> 11 CS336 seed / E2E / fresh verification
```

- 用户已明确回复“确认开始编码”，11 个 Stage 4 步骤均已执行完毕。
- 当前只允许同步 Stage 4 证据并请求 Stage 5 确认，不继续修改产品代码。
- 每完成一个步骤，更新 `progress-details.md`，记录 RED、GREEN、命令、exit code、偏差和 Git 状态。
- 出现未知 bug、flaky test 或根因不明的回归时，暂停当前切片并按 `und-systematic-debugging` 记录假设和证据。
- Stage 5 需要用户确认“确认进入验收阶段”；Stage 6 需要生成 `session-summary.md` 并进行经验沉淀询问。

## 全局验收映射

| 设计目标 | 计划步骤 | 最终证据 |
| --- | --- | --- |
| 来源、路径和模块可追踪 | 1-5 | repository/API/component tests + Markdown skeleton |
| 学习会话和证据链完整 | 6 | session/evidence tests + E2E failure evidence |
| 知识卡片和主动回忆 | 7 | maturity/review interval tests + E2E recall |
| Git Markdown 资产可维护 | 4、11 | temp-dir writer tests + `git diff --check` |
| 与计划和复盘闭环 | 9 | Today/Review API/component tests |
| AI 教练边界可审计 | 10、11 | blocked/allowed coach event tests |
| personal/test 隔离 | 2、5、11 | database-mode API tests + E2E test DB assertions |
| 不泄露 token/外部原文/作业答案 | 3、9、10、11 | export and boundary assertions |

## 计划确认与执行结果

本实现计划已由用户以“确认开始编码”确认；11 个步骤已按 RED/GREEN 或已记录的 TDD 例外执行完成，fresh verification 证据见 [progress-details.md](./progress-details.md)。

当前仍处于 Stage 4，等待用户明确回复“确认进入验收阶段”；确认前不创建 `acceptance.md`，不进入 Stage 5，也不宣告任务完成。
