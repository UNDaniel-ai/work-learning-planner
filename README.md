# Work & Learning Planner

一个用来规划工作、学习、时间和复盘的个人系统。

这个仓库不只保存产品代码，也保存项目本身的思考过程：需求、方案比较、决策、实现计划、进度、验收和后续复盘都通过 Git 追踪。

## 当前状态

- 当前阶段：Stage 4 - TDD Execution
- 当前路线：Route C
- 当前推荐方向：`Vikunja` 作为任务底座，叠加个人工作学习规划层
- 是否允许编码：是
- 下一步：继续执行实现计划步骤 10，实现 Today 与 Review 闭环

## 目标

建立一个适合个人长期使用的工作与学习规划系统，覆盖：

- 工作与学习领域的区分
- 目标、项目、任务和时间块
- 日计划与周计划
- 学习主题与学习进度
- 每日 / 每周复盘
- 可解释的执行和专注统计

第一版不会默认扩展成完整的 Life OS，也不会一开始加入财务、健康、社交等无关模块。

## 项目原则

1. 先验证真实工作流，再决定是否替换底层能力。
2. 优先复用成熟的任务、提醒、重复规则和同步能力。
3. 差异化投入在目标、学习和复盘，而不是重复实现通用 Todo 功能。
4. 每个重要结论都写入仓库，并通过 Git 留下变更记录。
5. 没有完成需求、设计和实现计划确认前，不开始产品编码。
6. 产品代码默认采用 TDD：先写失败测试并验证 RED，再写最小实现并验证 GREEN，最后重构。

## 文档入口

- [当前路线图](docs/planning/roadmap.md)
- [当前项目状态](docs/planning/current-state.md)
- [决策记录](docs/planning/decision-log.md)
- [调研与需求对齐](temp/sessions/2026-10-07-规划项目选型/requirements-alignment.md)
- [本次 session 控制面板](temp/sessions/2026-10-07-规划项目选型/INDEX.md)

## 工作流

### 阶段

```text
需求对齐
  -> 技术设计
  -> 实现计划
  -> TDD 执行
  -> 验收
  -> 复盘与迭代
```

### Git 记录约定

- `docs:` 更新需求、设计、计划或决策文档
- `feat:` 增加用户可见能力
- `fix:` 修复行为问题
- `test:` 增加或调整测试
- `refactor:` 不改变行为的结构调整
- `chore:` 工具链、依赖或仓库维护

每个阶段至少保留一个可读的里程碑提交。涉及产品功能时，先写测试，再实现，再提交。

## 本地开发

当前已建立最小 Next.js / TypeScript 应用骨架。常用命令：

```bash
pnpm install
cp .env.example .env
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
