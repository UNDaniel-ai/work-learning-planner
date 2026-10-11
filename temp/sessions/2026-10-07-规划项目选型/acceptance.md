# MVP 验收记录

[← 返回 INDEX.md](./INDEX.md)

- **当前路由**：Route C
- **当前阶段**：Stage 5 - Acceptance 已完成
- **验收状态**：条件性通过，等待用户确认进入 Stage 6 - Session Closeout
- **进入 Stage 5 时间**：2026-10-11 12:23:17 CST
- **用户确认原话**：确认进入验收阶段
- **完成声明**：禁止，直到本记录完成且用户确认进入 Stage 6

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

## Claim -> Verification Mapping

| 验收 claim | 当前验证路径 | 状态 |
|---|---|---|
| 工程质量门通过 | `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` | 通过 |
| MVP 主流程可运行 | `pnpm e2e`，覆盖目标、学习主题、周计划、时间块、Today、Review、导出 | 通过 |
| 主要页面可加载且无明显运行时错误 | 浏览器检查 `/today`、`/weekly`、`/goals`、`/review`、`/settings` | 通过 |
| 导出不泄露凭据 | `/api/export` 响应头、响应体和 token-like 字段扫描 | 通过 |
| Vikunja 连接失败可安全呈现 | `/settings` 页面与 `/api/vikunja/test-connection` 的无配置路径 | 通过 |

## Fresh Verification Evidence

以下只记录 Stage 5 当前执行窗口中实际重新运行的命令和观察结果；Stage 4 的结果不作为本阶段完成证据。

### 自动化质量门

- `pnpm lint`：通过，exit code 0。
- `pnpm typecheck`：通过，exit code 0。
- `pnpm test`：通过，exit code 0；24 个测试文件、56 个测试通过。
- `pnpm build`：通过，exit code 0；Next.js 16.4.0 成功构建并生成 18 个 app routes。
- `pnpm e2e`：通过，exit code 0；`e2e/mvp.spec.ts` 的 1 个 Chromium 项目测试通过，耗时约 1.9 秒。
- `git diff --check`：通过，exit code 0。

### e2e 场景

- 通过真实浏览器创建唯一工作目标和学习主题。
- 创建或复用当前周计划。
- 选择当前日期空闲时间段并创建时间块。
- 在 Today 记录 45 分钟实际投入。
- 在 Review 保存 weekly review。
- 从 Settings 下载 `work-learning-planner-export.json`。

### 安全与边界

- `/today`、`/weekly`、`/goals`、`/review`、`/settings` 均能加载，主导航和对应表单 / 空状态可见。
- Settings 显示 `Not connected` 和 `Vikunja configuration is incomplete.`；点击 `Test connection` 后仍为安全失败状态，未出现 token。
- `/api/health` 返回 `{"ok":true,"app":"work-learning-planner","vikunjaConfigured":false}`，HTTP 200。
- `/api/vikunja/test-connection` 在未配置 Vikunja 时返回 `{"ok":false,"connected":false,"error":"Vikunja configuration is incomplete."}`，HTTP 503。
- `/api/export` 返回 HTTP 200、`content-disposition: attachment; filename="work-learning-planner-export.json"`，导出体 11,109 字节，token-like 字段扫描为空。
- JSON 导出不读取环境变量；连接 token 只在服务端使用。
- 同一周重复保存不会再创建新的 planning period，避免 Today 与 Weekly 指向不同 period。

## 人工验收与已知限制

- [x] 检查 `/today`、`/weekly`、`/goals`、`/review`、`/settings` 的页面加载、导航和空状态。
- [x] 检查 Settings 的 Vikunja 无配置失败状态不泄露 token。
- [x] 检查 `/api/export` 的下载文件名、JSON 内容和凭据字段扫描。
- 尚未使用真实 Vikunja 实例完成连接、任务读取、完成和延期的人工验收。
- 当前本地 e2e 使用系统 Google Chrome；CI 使用 Playwright 管理的 Chromium。
- provider contract 与 Vikunja adapter 由 mocked tests 覆盖；真实 Vikunja 连接仍是未执行的手工验收项。
- 本地 e2e 使用被 Git 忽略的 `local.db`，重复运行会留下 E2E 示例记录；测试数据库隔离尚未自动化。

## Stage 5 结论

Stage 5 条件性通过：本地规划 MVP 的自动化质量门、浏览器主流程、五个主页面和无 Vikunja 配置时的安全边界均已通过当前阶段 fresh verification。真实 Vikunja 实例未配置，因此外部任务读取、完成、延期和真实连接恢复不属于本次已验证范围。下一步仍需用户确认进入 Stage 6，生成 session 总结并完成治理询问。
