# MVP 验收草案

[← 返回 INDEX.md](./INDEX.md)

- **当前路由**：Route C
- **当前阶段**：Stage 4 已完成，等待 Stage 5 - Acceptance 用户确认
- **验收状态**：待用户确认，不得据此宣告整个项目完成
- **fresh verification 时间**：2026-10-11

## 验收范围

本次 MVP 验证以下工作流：

```text
目标 / 学习主题
  -> 周计划
  -> 时间块
  -> Today 实际投入
  -> Review
  -> Settings JSON 导出
```

## Fresh Verification Evidence

### 自动化质量门

- `pnpm lint`：通过，exit code 0。
- `pnpm typecheck`：通过，exit code 0。
- `pnpm test`：通过，24 个测试文件、56 个测试通过。
- `pnpm build`：通过，Next.js 成功构建 18 个 app routes。
- `pnpm e2e`：通过，1 个 Chromium 项目测试通过，耗时约 2 秒。

### e2e 场景

- 创建唯一工作目标。
- 创建唯一学习主题。
- 创建或复用当前周计划。
- 选择当前日期空闲时间段并创建时间块。
- 在 Today 记录 45 分钟实际投入。
- 在 Review 保存 weekly review。
- 从 Settings 下载 `work-learning-planner-export.json`。

### 安全与边界

- Settings 只显示连接状态、任务数量和安全错误原因。
- 连接 token 只在服务端使用。
- JSON 导出不读取环境变量，实际导出文件未发现 `token` 或 `secret` 字段。
- 同一周重复保存不会再创建新的 planning period，避免 Today 与 Weekly 指向不同 period。

## 未完成或待确认

- 尚未使用真实 Vikunja 实例完成连接、任务读取、完成和延期的人工验收。
- 当前本地 e2e 使用系统 Google Chrome；CI 使用 Playwright 管理的 Chromium。
- 需要用户明确回复“确认进入验收阶段”，再将本草案转为 Stage 5 正式验收结论。
