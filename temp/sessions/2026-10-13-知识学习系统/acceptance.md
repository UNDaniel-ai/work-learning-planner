# 验收：学习执行与知识沉淀系统

[← 返回 INDEX.md](./INDEX.md)

- **验收日期**：2026-10-20
- **当前路由**：Route C
- **验收阶段**：Stage 5 - Acceptance
- **验收结论**：通过
- **完成声明**：尚未允许；Stage 6 Session Closeout 未完成

## 1. Stage 5 确认记录

- **AI 发起确认消息**：当前 Stage 4 已完成；请明确回复“确认进入验收阶段”。确认前不创建 `acceptance.md`，不进入 Stage 5，也不宣告任务完成。
- **用户确认原话**：确认进入验收阶段
- **确认时间**：2026-10-20 19:13:08 CST
- **结果**：允许执行 Stage 5 fresh verification 并创建本验收文档。

## 2. 验收范围

本阶段验收第一版“SQLite 结构化索引 + Git Markdown 学习资产”闭环：

```text
来源 / revision
  -> 有序学习模块
  -> 学习会话与证据
  -> 知识卡片
  -> 主动回忆
  -> Today / Weekly / Review / Export
```

向量数据库、RAG、自动抓取课程材料、完整 Anki 算法、实际模型 provider、自动修改学生代码和自动运行作业命令仍属于已确认的暂缓范围。

## 3. 验收场景

| # | 验收标准 | Fresh evidence | 结果 |
| --- | --- | --- | --- |
| 1 | 创建学习来源并固定 URL / revision | source API、use-case tests；CS336 seed 在 E2E test database 创建固定来源 | 通过 |
| 2 | 创建学习路径和有序模块 | seed tests 验证幂等 `coach_only` source、1 条 track 和 8 个有序 modules；E2E 验证 Attention 模块 | 通过 |
| 3 | 开始学习会话并关联规划对象 | session route/repository tests 覆盖 planning period、time block 和 task link；E2E 验证 active planning period 关联 | 通过 |
| 4 | 记录开始前理解、尝试、问题、证据和结论 | use-case/API tests 覆盖 `preUnderstanding`、`attemptSummary`、blocker/outcome 和 evidence；E2E 记录问题、开始前理解、失败 evidence 并完成 session | 通过 |
| 5 | 把会话结论提升为关联来源和证据的知识卡片 | card use-case/API/component tests；E2E 从本次 session/evidence 提升 card | 通过 |
| 6 | 创建主动回忆问题并记录一次复习 | review rule/API/component tests；E2E 保存 recall answer、评分、next review 并升级 maturity | 通过 |
| 7 | Today / Weekly / Review 展示学习投入与产出 | planning route、repository、三个 workspace tests；E2E 验证 Review 聚合 session、失败 evidence 和 card | 通过 |
| 8 | 导出学习索引并保留 Git Markdown 资产引用 | export/repository tests 与 E2E 下载断言；导出包含相对 Markdown path，不包含 token、外部全文或作业源码 | 通过 |
| 9 | Personal / Test database 与资产隔离 | seed 只允许 test mode；E2E 使用 `local.e2e.db` 和 `temp/e2e-learning-assets`；个人 `local.db` 无 learning tables | 通过 |
| 10 | CS336 模式不提供直接作业实现、TODO 补全或自动编辑/执行 | rules/use-case/route tests 验证四类动作被阻止并写审计；UI 只暴露六种 coach modes；E2E 记录 allowed audit | 通过 |

## 4. Fresh verification evidence

以下命令均在 Stage 5 确认后于 2026-10-20 重新执行，不复用 Stage 4 结果。

| Claim | Command | 实际输出 | 结果 |
| --- | --- | --- | --- |
| 领域、仓储、API、组件行为无回归 | `pnpm test` | 37 个测试文件、114 个测试全部通过，4.33s | exit 0 |
| TypeScript 契约完整 | `pnpm typecheck` | `tsc --noEmit` 无诊断 | exit 0 |
| 代码规则通过 | `pnpm lint` | `eslint .` 无错误 | exit 0 |
| 生产构建包含学习页面与 API | `pnpm build` | Next.js 编译和 27 个静态页面生成成功；learning routes 全部出现在 route manifest | exit 0 |
| CS336 学习闭环和旧 MVP 均可运行 | `pnpm e2e` | 1 worker，2/2 passed；learning 7.5s，MVP 1.3s，总计 11.5s | exit 0 |
| 补丁没有 whitespace 错误 | `git diff --check` | 无输出 | exit 0 |

## 5. 数据与资产隔离证据

- fresh E2E 后 `local.e2e.db` 有 1 个 source、1 条 track、8 个 modules；5 次历史 E2E 运行累计产生 5 个 sessions、evidence、cards、reviews 和 coach events。source/track/modules 未因重复 seed 而重复。
- 个人 `local.db` 当前没有 `learning_sources` 表，查询返回 `no such table`；本次验收没有向个人库写入学习数据。
- `local.e2e.db`、`temp/e2e-learning-assets/**` 和 `test-results/**` 都由 `.gitignore` 命中。
- E2E Markdown 根目录包含 track、8 个 module 文件，以及每次浏览器验收产生的 session、experiment 和 knowledge 文件；数据库中的导出路径保持相对路径。

## 6. 视觉与响应式验收

- Playwright 对 `/learning`、track、session 和 card 页面分别在 1440x1000 与 390x844 viewport 验证 heading 可见、loading 消失且 `scrollWidth <= innerWidth`。
- 人工复核 fresh desktop/mobile 的 `/learning` 与 study session 截图，未发现空白渲染、应用 UI 文本碰撞、控件重叠或水平溢出。
- 页面在移动端保持单列操作顺序；证据、AI 边界和知识卡片表单仍可完整访问。

## 7. 已知限制与残余风险

- AI coach 首期只记录模式、边界和审计事件，不调用实际模型 provider；这是已确认范围，不是验收缺口。
- 主动回忆使用简单间隔规则，不实现完整 Anki 算法；这是已确认范围。
- E2E test database 和 Markdown 资产会累积历史运行数据，但全部位于 ignored test 路径；seed 自身保持幂等。
- 外部 Vikunja 在本地截图中未连接，不影响本轮本地学习闭环验收；task link 的持久化和聚合由 repository/API tests 覆盖。

## 8. 验收结论与门禁

- 第一阶段 10 条验收标准全部通过，未发现阻断 Stage 6 的功能缺口。
- 本文只确认 Stage 5 Acceptance 通过，不代表 Route C session 已完成。
- `session-summary.md` 尚未创建，经验治理尚未执行，因此仍不允许宣告任务完成。
- 下一步需要用户明确回复“确认进入收尾阶段”，再进入 Stage 6 Session Closeout。
