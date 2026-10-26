# 知识学习系统设计

## 当前状态

- 当前路由：Route C
- 当前阶段：Stage 6 - Session Closeout（已完成）
- 当前主文档：[session-summary.md](./session-summary.md)
- 是否允许编码：否（产品实现与验收已冻结）
- 是否允许宣告完成：是
- 计划状态：步骤 1-11、Stage 5 验收、Stage 6 总结与 skills governance 均已完成
- 下一步：当前 session 无必需动作；Next.js 安全升级作为独立后续任务处理

## 本次目标

在现有工作与学习规划系统中增加一个可持续的学习与知识沉淀能力，使学习过程能够形成：

```text
学习来源
  -> 学习路径 / 模块
  -> 学习会话
  -> 自己的尝试
  -> 测试、实验与其他证据
  -> 知识卡片
  -> 间隔复习与迁移应用
  -> 复盘与下一步计划
```

## 范围拆分

1. 学习来源与课程结构
2. 学习会话与阅读记录
3. 尝试、问题和证据链
4. 知识卡片、关系和成熟度
5. 复习队列与主动回忆
6. AI 教练模式与学习边界
7. 与现有目标、任务、时间块和复盘连接

## 阶段门禁

- [x] 完成本次工作流入口与 Route C 判断
- [x] 完成现有仓库 grounding
- [x] 分析 Stanford CS336 Assignment 1 仓库
- [x] 完成范围拆分与方案候选
- [x] 用户确认需求对齐
- [x] 创建并确认 `design.md`
- [x] 创建 `implementation-plan.md`
- [x] 用户确认开始编码
- [x] 步骤 1：学习领域类型与纯规则
- [x] 步骤 2：SQLite 学习 schema 和 migration
- [x] 步骤 3：学习仓储和组合导出
- [x] 步骤 4：Markdown 资产 writer 和路径配置
- [x] 步骤 5：Learning Source / Track / Module 创建工作流
- [x] 步骤 6：Study Session 与 Evidence 记录闭环
- [x] 步骤 7：Knowledge Card 与简单 Review Queue
- [x] 步骤 8：`/learning` 页面和学习资产工作区
- [x] 步骤 9：连接 Today、Weekly、Review 和 Export
- [x] 步骤 10：AI Coach mode 边界记录
- [x] 步骤 11：CS336 seed、E2E 和最终实现验证
- [x] TDD 实现
- [x] Stage 5 验收
- [x] Stage 6 收尾

## 当前推荐

采用“结构化索引 + Git 追踪的 Markdown 知识资产”混合方案：

- SQLite 保存来源、模块、会话、状态、复习计划、任务关联和证据索引。
- `learning/` 下的 Markdown 保存用户自己的学习记录、知识卡片和总结。
- 重要知识卡片必须有来源和证据，不把原始阅读笔记自动当成已掌握知识。
- AI 首期作为受约束的学习教练，不直接替用户完成 CS336 作业。

## Stage 1 确认记录

- AI 发起确认消息：当前阶段为 Stage 1 - Requirements Alignment；下一阶段为 Stage 2 - Technical Design。确认前不创建 `design.md`，不创建实现计划，不开始产品编码。
- 用户确认原话：确认进入设计阶段
- 确认时间：2026-10-13 22:12:08 CST

## Stage 2 -> Stage 3 确认记录

- **AI 发起确认消息**：当前设计阶段已完成；请明确回复“确认进入实现计划阶段”。确认前不创建 `implementation-plan.md`，不开始产品编码。
- **用户确认原话**：确认进入实现计划阶段
- **确认时间**：2026-10-14 19:39:44 CST
- **结果**：允许创建 Stage 3 实现计划；不允许开始编码。

## Stage 3 产物

- [implementation-plan.md](./implementation-plan.md)：已创建，包含 11 个 TDD 切片和全局验收映射。
- [progress-details.md](./progress-details.md)：已记录本次跨 session 恢复和当前禁止编码边界。

## Stage 3 -> Stage 4 确认记录

- **AI 发起确认消息**：实现计划已完成；请明确回复“确认开始编码”。确认前不修改产品代码，不进入 TDD 执行。
- **用户确认原话**：确认开始编码
- **确认时间**：2026-10-19 20:42 CST
- **结果**：允许进入 Stage 4；按实现计划从步骤 1 的 RED 开始。

## Stage 4 -> Stage 5 确认记录

- **Stage 4 结果**：11 个实现步骤已完成；全量 37 个测试文件、114 个测试通过；typecheck、lint、build、Playwright E2E 和 diff check 均通过。
- **AI 发起确认消息**：当前 Stage 4 已完成；请明确回复“确认进入验收阶段”。确认前不创建 `acceptance.md`，不进入 Stage 5，也不宣告任务完成。
- **用户确认原话**：确认进入验收阶段
- **确认时间**：2026-10-20 19:13:08 CST
- **结果**：允许进入 Stage 5 并创建 `acceptance.md`；在 Stage 5 验收和 Stage 6 总结完成前，仍不允许宣告任务完成。

## Stage 5 验收结果

- [acceptance.md](./acceptance.md)：10 条第一阶段验收标准全部通过。
- **Fresh evidence**：37 个测试文件、114 个测试通过；typecheck、lint、build、Playwright 2/2 和 diff check 均为 exit 0。
- **隔离与视觉**：personal/test 数据保持隔离；桌面与移动端无水平溢出、空白渲染或应用 UI 控件重叠。

## Stage 5 -> Stage 6 确认记录

- **AI 发起确认消息**：当前 Stage 5 验收已通过；请明确回复“确认进入收尾阶段”。确认前不创建 `session-summary.md`，不执行经验治理，也不宣告任务完成。
- **用户确认原话**：确认进入收尾阶段
- **确认时间**：2026-10-20 19:23:20 CST
- **结果**：允许创建 `session-summary.md` 并执行 skills governance 候选评估。

## Stage 6 收尾状态

- [session-summary.md](./session-summary.md)：已记录最终交付、关键偏差、已知限制、工作树状态和治理候选。
- **Fresh evidence**：2026-10-26 重新执行 37 个测试文件、114 个测试、typecheck、lint、build、Playwright 2/2 和两仓 `git diff --check`，全部通过。
- **治理候选**：可配置资产根目录需要 writer、持久化路径、反向解析、seed 和 E2E 共用路径契约，并覆盖非默认根目录。
- **治理确认**：用户先回复“需要沉淀”，再回复“确认更新 und-systematic-debugging”；允许更新现有 skill。
- **治理结果**：canonical `und-systematic-debugging` 已升级到 v1.1.0；validator、共享仓库 121 tests 和 Codex/Claude link status 均通过；governance log 已创建。
- **残余风险**：Next.js 16.4.0 报告已知安全漏洞；功能验证通过，但依赖升级未包含在本次授权范围。
