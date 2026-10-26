# 技术设计：学习执行与知识沉淀系统

[← 返回 INDEX.md](./INDEX.md)

## 设计状态

- 当前路由：Route C
- 当前阶段：Stage 4 - TDD Execution
- 需求主文档：[requirements-alignment.md](./requirements-alignment.md)
- 设计状态：已确认，已进入 Stage 4 TDD 执行
- 是否允许编码：是
- 下一步：按 [implementation-plan.md](./implementation-plan.md) 执行步骤 2

## 1. Repo Grounding

### 当前代码事实

当前项目已经有一个可运行的 Work & Learning Planner MVP：

- App Router 页面：`/today`、`/weekly`、`/goals`、`/review`、`/settings`。
- 本地 SQLite / Drizzle schema：`areas`、`goals`、`learning_topics`、`planning_periods`、`time_blocks`、`reviews`、`task_links`、`sync_cursors`。
- 领域用例：目标、学习主题、周计划、时间块、实际投入、daily / weekly review。
- 数据库模式：personal / test 已隔离，E2E 默认切到测试库。
- 导出能力：当前导出本地规划数据 JSON，不包含 token。
- 项目治理：需求、设计、计划、进度和验收文档都通过 Git 追踪。

当前不足：

- `learning_topics` 只能表达“学习主题 + 进度百分比”，不能表达来源、模块、会话、证据、知识卡片、复习和 AI 辅助记录。
- Review 只能记录 wins / misses / adjustments，无法区分“执行结果”和“知识掌握结果”。
- Today / Weekly 能安排学习时间块，但不知道这个时间块对应哪一次学习会话或哪一个知识产出。
- 目前没有 `learning/` 知识资产目录，也没有 Markdown 与 SQLite 索引之间的关系。

### 外部样例事实：CS336 Assignment 1

Stanford CS336 Assignment 1 是一个实现密集型学习对象：

- README 要求用 `uv run pytest` 运行测试。
- 初始测试会因 `NotImplementedError` 失败。
- `tests/adapters.py` 是学生实现与测试的连接点。
- 测试覆盖 tokenizer、BPE、数据采样、NN primitives、attention、RoPE、Transformer、optimizer、checkpoint。
- `AGENTS.md` 明确要求 AI 做教学助教，不直接生成作业代码、不补 TODO、不编辑学生仓库、不运行作业命令。

这决定了系统必须保存“学习过程证据”，而不能只保存最终摘要。

## 2. 设计目标

第一版目标：

- 把学习来源、模块、会话、证据、知识卡片和复习串起来。
- 让学习过程能回到现有目标、任务、时间块和复盘。
- 支持 CS336 这种“读规格 + 自己实现 + 测试失败 + 调试 + 形成知识”的路径。
- 所有关键知识沉淀都可 Git diff、可回滚、可迁移。
- AI 作为受约束教练，帮助提问、解释、诊断和总结，但不代做。

第一版非目标：

- 不做完整 Notion / Logseq 替代品。
- 不做完整 Anki 算法。
- 不做向量数据库、embedding、RAG 和自动问答。
- 不自动爬取或复制整个 GitHub 仓库 / PDF。
- 不自动修改学生代码、运行作业测试或提交作业。
- 不做多用户权限和团队学习协作。

## 3. Scope Decomposition

本需求可以拆成七个子系统：

1. **学习来源与版本锁定**
   - URL、仓库、commit、课程主页、手册、许可和 AI 使用边界。
2. **学习路径与模块**
   - 课程 / 项目级路径、模块顺序、前置知识、状态和验收。
3. **学习会话**
   - 一次 60-90 分钟的具体学习活动，关联时间块、任务、目标和模块。
4. **尝试与证据**
   - 测试、错误、toy example、shape 检查、性能数据、commit、阅读引用。
5. **知识卡片**
   - 经过证据支撑的知识点，包含定义、解释、反例、成熟度和关系。
6. **主动回忆与复习**
   - 简单间隔队列、回答记录、错误类型和下一次复习时间。
7. **AI 教练边界**
   - 模式、允许行为、禁止行为、上下文和结果记录。

第一版不能把七个子系统都做成重型平台。推荐从“学习会话 + 证据 + 知识卡片 + 简单复习”开始，其他能力围绕它服务。

## 4. 推荐架构

采用“SQLite 结构化索引 + Git Markdown 知识资产”的混合架构。

```text
Work & Learning Planner
  |
  |-- SQLite
  |     |-- learning_sources
  |     |-- learning_tracks
  |     |-- learning_modules
  |     |-- study_sessions
  |     |-- evidence_items
  |     |-- knowledge_cards
  |     |-- review_items
  |     |-- ai_coach_events
  |
  |-- Git Markdown
        |-- learning/{source-slug}/track.md
        |-- learning/{source-slug}/modules/*.md
        |-- learning/{source-slug}/sessions/*.md
        |-- learning/{source-slug}/knowledge/*.md
        |-- learning/{source-slug}/experiments/*.md
```

SQLite 负责：

- 列表、筛选、状态、排序、复习队列。
- 与 `learning_topics`、`goals`、`time_blocks`、`task_links` 的关联。
- Markdown 文件路径、stable ID、状态和 metadata 索引。
- 导出时提供机器可读的结构化索引。

Markdown 负责：

- 用户自己的学习记录。
- 会话日志。
- 知识卡片正文。
- 实验记录。
- 阶段总结。
- Git diff 和长期可读性。

设计原则：

- 数据库不保存大量原始外部材料，只保存链接、revision 和用户自己的总结。
- Markdown 文件必须有 frontmatter stable ID，避免重命名导致关系断裂。
- “笔记”不能自动变成“知识卡片”；知识卡片必须有来源和证据。
- 第一版采用显式保存 / 显式索引，不做复杂实时双向同步。

## 5. 领域模型

### 5.1 LearningSource

学习来源，例如 CS336 Assignment 1。

字段建议：

- `id`
- `title`
- `kind`: `course` | `paper` | `book` | `repo` | `article` | `video` | `project`
- `url`
- `repositoryUrl`
- `revision`
- `license`
- `aiGuidance`: `open` | `coach_only` | `restricted`
- `summary`
- `createdAt`
- `updatedAt`

CS336 示例：

```text
title: CS336 Assignment 1 - Basics
kind: repo
url: https://github.com/stanford-cs336/assignment1-basics
revision: a158843
aiGuidance: coach_only
```

### 5.2 LearningTrack

学习路径，用来承载一个课程、项目或专题。

字段建议：

- `id`
- `learningTopicId`
- `sourceId`
- `title`
- `objective`
- `status`
- `markdownPath`
- `createdAt`
- `updatedAt`

### 5.3 LearningModule

学习路径下的可执行模块。

字段建议：

- `id`
- `trackId`
- `title`
- `sequence`
- `status`: `not_started` | `active` | `blocked` | `completed`
- `expectedOutcome`
- `acceptanceCriteria`
- `markdownPath`
- `createdAt`
- `updatedAt`

CS336 第一版模块建议：

1. 环境、测试和 AI 使用边界。
2. 数据采样与 language modeling batch。
3. Tokenizer 与 BPE。
4. Linear、Embedding、SwiGLU、RMSNorm。
5. Attention、mask、multi-head 和 RoPE。
6. Transformer block 与 language model forward。
7. Softmax、cross entropy、gradient clipping、AdamW 和 schedule。
8. Checkpoint、实验总结和迁移复盘。

### 5.4 StudySession

一次具体学习活动。

字段建议：

- `id`
- `moduleId`
- `planningPeriodId`
- `timeBlockId`
- `taskLinkId`
- `startedAt`
- `endedAt`
- `status`: `planned` | `active` | `completed` | `blocked`
- `question`
- `preUnderstanding`
- `attemptSummary`
- `blocker`
- `outcome`
- `markdownPath`

核心要求：

- 每次会话只解决一个主要问题。
- 开始前必须写下自己的预测或当前理解。
- 结束时必须写下证据，而不是只写“已学习”。

### 5.5 EvidenceItem

证明某个结论的证据。

字段建议：

- `id`
- `sessionId`
- `kind`: `test` | `error` | `toy_example` | `shape_check` | `performance` | `commit` | `source_quote` | `manual_summary`
- `title`
- `summary`
- `reference`: 测试名、commit、URL、文件路径或章节定位。
- `result`: `pass` | `fail` | `observed` | `unknown`
- `markdownPath`
- `createdAt`

### 5.6 KnowledgeCard

经过整理的知识点。

字段建议：

- `id`
- `trackId`
- `moduleId`
- `title`
- `slug`
- `maturity`: `observed` | `understood` | `verified` | `applied` | `teachable`
- `confidence`: 1-5
- `summary`
- `markdownPath`
- `createdAt`
- `updatedAt`

Markdown 正文模板：

```markdown
---
id: kc_...
title: Scaled Dot-Product Attention
maturity: verified
confidence: 3
sourceIds: [...]
evidenceIds: [...]
relatedCards: [...]
---

## 一句话定义

## 为什么重要

## 我自己的解释

## 最小例子

## 反例 / 失败模式

## 证据

## 待解决问题
```

### 5.7 ReviewItem

主动回忆条目。

字段建议：

- `id`
- `knowledgeCardId`
- `prompt`
- `answerHint`
- `lastReviewedAt`
- `nextReviewAt`
- `ease`: 1-5
- `lapseCount`
- `status`: `active` | `suspended` | `mastered`

第一版使用简单规则：

- 新卡：明天复习。
- `ease >= 4`：间隔扩大到 3 / 7 / 14 天。
- `ease <= 2`：明天复习，并记录错误类型。

### 5.8 AICoachEvent

AI 辅助记录。

字段建议：

- `id`
- `sessionId`
- `mode`: `socratic` | `concept_hint` | `debug_guide` | `code_review` | `synthesis` | `recall_quiz`
- `inputSummary`
- `outputSummary`
- `boundary`: `allowed` | `blocked`
- `createdAt`

CS336 模式下显式禁止：

- `direct_solution`
- TODO 补全
- 自动编辑学生作业仓库
- 自动运行作业命令
- 提供第三方解法链接

## 6. Markdown 资产结构

推荐创建：

```text
learning/
  cs336-assignment1-basics/
    track.md
    modules/
      01-environment-and-tests.md
      02-data-and-batches.md
      03-tokenizer-and-bpe.md
      04-nn-primitives.md
      05-attention-and-rope.md
      06-transformer-lm.md
      07-optimization-and-checkpointing.md
      08-synthesis-and-transfer.md
    sessions/
      2026-10-14-attention-mask.md
    knowledge/
      scaled-dot-product-attention.md
      byte-pair-encoding.md
    experiments/
      attention-mask-toy-example.md
```

命名规则：

- 文件名可读，frontmatter 中的 `id` 才是稳定身份。
- 原始外部资料不复制进仓库，只记录链接和 revision。
- 自己的学习记录、实验记录和总结可以进入 Git。
- 如果有大文件、数据集或模型权重，一律不进入 Git。

## 7. 页面与交互设计

### 7.1 新增 `/learning`

主视图：

- 学习路径列表。
- 当前 active modules。
- 最近学习会话。
- 待复习知识卡片。
- 本周学习产出：会话数、知识卡片数、通过证据数。

### 7.2 来源 / 路径详情

展示：

- 来源信息、revision、AI 辅助边界。
- 模块列表和状态。
- 关联的学习主题、目标和任务。
- 知识卡片地图。
- 未解决问题。

### 7.3 学习会话页

核心输入区：

- 本次问题。
- 开始前理解。
- 尝试记录。
- 证据记录。
- 会话结论。
- 下一步。

辅助操作：

- 添加证据。
- 提升为知识卡片。
- 创建复习题。
- 生成下一个任务或时间块建议。

### 7.4 知识卡片页

展示：

- 成熟度、置信度。
- 来源和证据。
- 相关卡片。
- 主动回忆记录。
- 关联会话。

### 7.5 Today / Weekly / Review 集成

Today：

- 学习时间块显示关联模块和会话入口。
- 可以从时间块开始学习会话。

Weekly：

- 学习主题不仅显示进度，还显示本周目标模块和预计学习会话。

Review：

- 新增学习产出区：
  - 完成了哪些会话。
  - 产生了哪些知识卡片。
  - 哪些知识卡片升级成熟度。
  - 哪些问题仍阻塞。

## 8. CS336 端到端流程

### 初始化

用户创建学习主题：

```text
CS336 Assignment 1 - Basics
```

系统创建：

- LearningSource：GitHub 仓库 URL + revision + AI boundary。
- LearningTrack：Assignment 1 学习路径。
- LearningModules：按测试 / 知识主题拆分模块。
- Markdown 目录骨架。

### 一次 Attention 学习会话

```text
模块：Attention、mask、multi-head 和 RoPE
问题：mask 应该在 softmax 前还是后生效？
开始前理解：用户写下 shape 和预期行为。
尝试：用户在自己的作业仓库中实现并运行测试。
证据：记录测试名、错误信息、toy tensor、shape 检查。
AI 模式：Debug Guide，只提示实验和不变量。
结论：用户用自己的话总结。
知识卡片：Scaled Dot-Product Attention / Causal Mask。
复习题：解释 query length 与 key length 不同时输出 shape。
```

### 关键边界

Planner 只记录学习和知识证据；不保存作业完整答案，不自动编辑 CS336 仓库，不运行作业命令。用户可以手动把测试结果或错误摘要粘贴进学习会话。

## 9. 数据流

### 创建学习路径

```text
用户输入 source URL / title / revision
  -> 创建 LearningSource
  -> 创建或关联 LearningTopic
  -> 创建 LearningTrack
  -> 生成模块
  -> 创建 Markdown 骨架
```

### 开始学习会话

```text
Today time block
  -> Start study session
  -> 写本次问题和开始前理解
  -> 进入 active session
```

### 记录证据并形成知识卡片

```text
StudySession
  -> 添加 EvidenceItem
  -> 写会话结论
  -> Promote to KnowledgeCard
  -> 创建 ReviewItem
```

### 复盘

```text
Review 页面
  -> 读取本周 StudySession / Evidence / KnowledgeCard / ReviewItem
  -> 汇总学习投入和知识产出
  -> 保存 weekly review
```

## 10. 导出、备份与隐私

导出需要包含：

- SQLite 学习索引。
- Markdown 文件相对路径。
- 知识卡片 metadata。
- 证据 metadata。
- 复习状态。

导出不包含：

- 外部课程完整原文。
- 大数据集、模型权重、测试 fixture。
- API token。
- 学生作业仓库中的完整实现代码。

备份策略：

- SQLite 与 `learning/` Markdown 都属于个人知识资产。
- 大文件继续通过 `.gitignore` 排除。
- 对外部来源只记录 URL、revision 和用户自己的总结。

## 11. 方案挑战

### 挑战一：为什么不直接用 Logseq / AppFlowy

外部知识工具更强，但会把计划、会话、证据和复习状态分散到另一个系统。当前项目的优势是能把学习计划、时间投入、证据和复盘连接起来。第一版先在本项目内建立最小闭环，后续可导出到外部工具。

### 挑战二：为什么不直接上 RAG

RAG 会让系统过早关注“问答效果”，而不是“我有没有真正学会”。CS336 这种实现型学习更需要主动预测、测试、调试和解释。第一版先积累高质量结构化学习记录，之后再考虑检索增强。

### 挑战三：Markdown 与数据库是否会同步复杂

会有复杂度，因此第一版只做单向、显式保存：

- UI 创建对象时生成 Markdown。
- 数据库保存 path 和 metadata。
- 修改正文以 Markdown 为准，状态以 SQLite 为准。
- 重命名、移动和批量同步延后。

### 挑战四：AI 会不会破坏学习

会，所以需要模式和边界。CS336 默认 `coach_only`，AI 不直接给实现；系统记录每次 AI 辅助的模式和结果，方便复盘 AI 是否帮助理解。

## 12. 验证策略

设计验收需要覆盖：

- 数据模型能表达 CS336 Assignment 1 的来源、模块、会话、证据和知识卡片。
- Markdown 结构能通过 Git 追踪用户自己的学习资产。
- Today / Review 能接入学习会话和学习产出。
- CS336 AI 辅助边界能被产品状态表达和测试。
- Personal / Test database 隔离继续有效。

后续实现阶段必须使用 TDD：

- 先写 schema / repository / use case 测试。
- 先写 API route 测试。
- 先写组件测试。
- 最后用 Playwright 验证 CS336 示例路径。

## 13. 推荐实施切片

设计层面的切片建议：

1. 数据模型与 Markdown 生成边界。
2. Learning Source / Track / Module 创建。
3. Study Session 与 Evidence 记录。
4. Knowledge Card 与 Review Item。
5. `/learning` 页面与模块详情。
6. Today / Review 集成。
7. CS336 示例种子路径与 E2E。
8. AI Coach mode 的记录与边界提示。

详细步骤、验证命令和 TDD RED/GREEN 合同放到 Stage 3 `implementation-plan.md`。

## 14. 设计确认记录

当前设计已确认以下方向：

1. 使用“SQLite 结构化索引 + Git Markdown 知识资产”。
2. 用 CS336 Assignment 1 作为第一条端到端学习路径。
3. 第一版优先实现学习会话、证据、知识卡片和简单复习。
4. AI 首期作为受约束教练，不做直接解题器。

### Stage 2 -> Stage 3 门禁记录

- **AI 发起确认消息**：当前设计阶段已完成；请明确回复“确认进入实现计划阶段”。确认前不创建 `implementation-plan.md`，不开始产品编码。
- **用户确认原话**：确认进入实现计划阶段
- **确认时间**：2026-10-14 19:39:44 CST
- **结果**：设计确认通过，允许创建 `implementation-plan.md`；仍禁止产品编码，直到用户确认“确认开始编码”。

实现计划已写入 [implementation-plan.md](./implementation-plan.md)。
