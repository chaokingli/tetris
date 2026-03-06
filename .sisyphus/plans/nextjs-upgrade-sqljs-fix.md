# Next.js 升级与 sql.js WASM 错误修复

## TL;DR

> **核心目标**: 将 Next.js 从 14.2.5 升级到最新版 (v16)，并修复 sql.js 在浏览器环境中的 WASM 加载错误
> 
> **交付物**:
> - Next.js 16 + React 19 完整升级
> - sql.js WASM 加载问题修复（正确的 next.config.js 配置）
> - 所有依赖包版本兼容
> - 应用正常运行无错误
> 
> **预计工作量**: 中等
> **并行执行**: 是 - 2 个主要任务可并行
> **关键路径**: 依赖升级 → WASM 配置 → 验证测试

---

## Context

### 原始请求
1. Next.js 版本过低（当前 14.2.5，需要升级到最新版 v16）
2. 运行时出现 sql.js WASM 加载错误：`Aborted(both async and sync fetching of the wasm failed)`

### 当前状态
- **Next.js**: 14.2.5
- **React**: 18.3.1
- **sql.js**: ^1.14.1
- **问题根源**: sql.js 在浏览器端加载 WASM 文件时路径配置不正确

### 研究结果
- Next.js 16 需要使用 React 19
- sql.js 在浏览器环境需要正确配置 WASM 文件路径
- next.config.js 需要配置 `experimental.serverComponentsExternalPackages` 或正确的 webpack 配置来处理 WASM 文件

---

## Work Objectives

### 核心目标
1. 安全升级 Next.js 到 v16 + React 19
2. 修复 sql.js WASM 加载错误
3. 确保应用正常运行

### 具体交付物
- package.json 依赖更新
- next.config.js 正确配置
- 应用无错误运行

### 完成定义
- [ ] `npm run dev` 正常启动无错误
- [ ] 访问 http://localhost:3000 无 WASM 错误
- [ ] 游戏功能正常运行

### Must Have
- Next.js 16.x.x
- React 19.x.x
- sql.js WASM 正确加载
- 所有现有功能正常

### Must NOT Have (Guardrails)
- 不修改核心游戏逻辑
- 不改变数据库结构
- 不引入不必要的依赖
- 不使用 `as any` 绕过类型检查

---

## Verification Strategy

### 测试决策
- **基础设施存在**: 是 (Jest + Playwright)
- **自动化测试**: 运行现有测试验证
- **框架**: Jest (单元测试) + Playwright (E2E)

### QA 策略
每个任务必须包含 Agent 执行的 QA 场景：
- **前端**: Playwright 验证页面加载和游戏功能
- **构建**: `npm run build` 无错误
- **类型检查**: `tsc --noEmit` 无错误

---

## Execution Strategy

### 并行执行 Waves

```
Wave 1 (并行执行 - 依赖升级):
├── Task 1: 升级 Next.js 16 + React 19 + 相关依赖 [deep]
└── Task 2: 配置 sql.js WASM 加载 [quick]

Wave 2 (验证):
├── Task 3: 运行构建和类型检查 [quick]
├── Task 4: Playwright E2E 测试 [unspecified-high]
└── Task 5: 清理和文档更新 [quick]

关键路径: Task 1 & 2 → Task 3 → Task 4
并行加速: ~60% 快于顺序执行
```

### 依赖矩阵
- **1**: — — 3
- **2**: — — 3
- **3**: 1, 2 — 4, 5
- **4**: 3 — 5
- **5**: 3, 4 — —

### Agent 分发摘要
- **Wave 1**: Task 1 → `deep`, Task 2 → `quick`
- **Wave 2**: Task 3 → `quick`, Task 4 → `unspecified-high`, Task 5 → `quick`

---

## TODOs

- [ ] 1. 升级 Next.js 16 + React 19 及相关依赖

  **做什么**:
  - 升级 next: 14.2.5 → ^16.0.0
  - 升级 react: ^18.3.1 → ^19.0.0
  - 升级 react-dom: ^18.3.1 → ^19.0.0
  - 升级 eslint-config-next: 14.2.5 → ^16.0.0
  - 升级 @types/react: ^18 → ^19
  - 升级 @types/react-dom: ^18 → ^19
  - 运行 npm install 安装新依赖
  - 运行 `npm run dev` 检查是否有破坏性变更

  **Must NOT do**:
  - 不修改业务逻辑代码
  - 不改变现有组件结构
  - 不移除任何现有依赖

  **推荐 Agent Profile**:
  - **Category**: `deep` - 需要处理版本兼容性和破坏性变更
  - **Skills**: []
  - **技能评估但省略**:
    - `git-master`: 虽然涉及代码变更，但主要是依赖升级

  **并行化**:
  - **可并行执行**: YES
  - **并行组**: Wave 1 (与 Task 2)
  - **阻塞**: Task 3
  - **被阻塞**: 无

  **参考**:

  **模式参考**:
  - Next.js 升级官方指南: 检查破坏性变更

  **外部参考**:
  - Next.js 16 发布说明: https://nextjs.org/blog/next-16
  - React 19 升级指南: https://react.dev/blog/2024/04/25/react-19
  - Next.js 升级检查清单: https://nextjs.org/docs/app/building-your-application/upgrading

  **为什么这些参考重要**:
  - 了解 v14 → v16 的破坏性变更
  - 确保正确配置新特性

  **验收标准**:
  - [ ] package.json 中 next 版本为 ^16.0.0
  - [ ] package.json 中 react/react-dom 版本为 ^19.0.0
  - [ ] `npm install` 成功无错误
  - [ ] `npm run dev` 启动成功
  - [ ] `tsc --noEmit` 无类型错误

  **QA 场景**:

  ```
  场景: 验证 Next.js 16 应用正常启动
    工具: Bash
    前置条件: 依赖已安装
    步骤:
      1. 运行 `npm run dev`
      2. 等待 "Ready in Xms" 输出
      3. 检查无错误日志
    预期结果: 开发服务器在 http://localhost:3000 成功启动
    失败指标: 出现 "Error" 或 "Failed to compile"
    证据: .sisyphus/evidence/task-1-startup.log

  场景: 验证类型检查通过
    工具: Bash
    前置条件: 依赖已安装
    步骤:
      1. 运行 `npx tsc --noEmit`
      2. 检查输出
    预期结果: 无错误输出，exit code 0
    失败指标: 任何 TS 错误
    证据: .sisyphus/evidence/task-1-tsc.log
  ```

  **证据捕获**:
  - [ ] 保存启动日志到 task-1-startup.log
  - [ ] 保存类型检查输出到 task-1-tsc.log

  **Commit**: YES
  - Message: `chore(deps): upgrade to Next.js 16 and React 19`
  - Files: package.json, package-lock.json
  - Pre-commit: npm run dev

- [ ] 2. 配置 sql.js WASM 加载

  **做什么**:
  - 修改 next.config.js 添加 webpack 配置以正确处理 WASM 文件
  - 配置 sql.js 的 locateFile 选项指向正确的 WASM 路径
  - 或者配置 `experimental.serverComponentsExternalPackages` 将 sql.js 排除在 SSR 之外
  - 验证配置后 WASM 能正确加载

  **Must NOT do**:
  - 不修改 database.ts 核心逻辑
  - 不更换数据库库（保持使用 sql.js）
  - 不使用复杂的变通方案

  **推荐 Agent Profile**:
  - **Category**: `quick` - 配置文件修改
  - **Skills**: []

  **并行化**:
  - **可并行执行**: YES
  - **并行组**: Wave 1 (与 Task 1)
  - **阻塞**: Task 3
  - **被阻塞**: 无

  **参考**:

  **外部参考**:
  - sql.js 文档: https://sql.js.org/
  - Next.js 处理 WASM: https://nextjs.org/docs/pages/building-your-application/optimizing/third-party-libraries
  - sql.js GitHub issues: 查找类似 WASM 加载问题

  **为什么这些参考重要**:
  - 了解 sql.js 在浏览器中的 WASM 加载机制
  - 确保 next.config.js 配置正确

  **验收标准**:
  - [ ] next.config.js 包含正确的 webpack 配置
  - [ ] sql.js 的 WASM 文件能正确加载
  - [ ] 浏览器控制台无 WASM 相关错误
  - [ ] 数据库操作正常工作

  **QA 场景**:

  ```
  场景: 验证 WASM 加载无错误
    工具: Playwright
    前置条件: 开发服务器运行中
    步骤:
      1. 导航到 http://localhost:3000
      2. 等待页面完全加载 (timeout: 10s)
      3. 打开浏览器控制台捕获日志
      4. 检查无 "Aborted" 或 "wasm failed" 错误
    预期结果: 页面加载成功，控制台无 WASM 错误
    失败指标: 出现 "Aborted(both async and sync fetching of the wasm failed)"
    证据: .sisyphus/evidence/task-2-wasm-load.png (截图)

  场景: 验证数据库操作正常
    工具: Playwright
    前置条件: 页面已加载
    步骤:
      1. 等待游戏初始化完成
      2. 查看控制台日志
      3. 检查是否有数据库初始化成功的日志
    预期结果: 无数据库相关错误
    失败指标: "Error initializing database" 或类似错误
    证据: .sisyphus/evidence/task-2-db-init.log
  ```

  **证据捕获**:
  - [ ] 保存页面加载截图到 task-2-wasm-load.png
  - [ ] 保存控制台日志到 task-2-db-init.log

  **Commit**: YES
  - Message: `fix(sqljs): configure webpack for WASM loading`
  - Files: next.config.js
  - Pre-commit: npm run dev

- [ ] 3. 运行构建和类型检查验证

  **做什么**:
  - 运行 `npm run build` 验证生产构建
  - 运行 `npm run lint` 检查代码质量
  - 运行 `tsc --noEmit` 验证类型
  - 记录所有输出和错误

  **Must NOT do**:
  - 忽略构建错误
  - 使用 `@ts-ignore` 绕过类型错误

  **推荐 Agent Profile**:
  - **Category**: `quick` - 验证任务
  - **Skills**: []

  **并行化**:
  - **可并行执行**: NO
  - **并行组**: Sequential (依赖 Task 1 & 2)
  - **阻塞**: Task 4, 5
  - **被阻塞**: Task 1, 2

  **验收标准**:
  - [ ] `npm run build` 成功完成
  - [ ] `npm run lint` 无错误
  - [ ] `tsc --noEmit` 无错误

  **QA 场景**:

  ```
  场景: 验证生产构建成功
    工具: Bash
    前置条件: 依赖已安装，配置已更新
    步骤:
      1. 运行 `npm run build`
      2. 等待构建完成
      3. 检查输出包含 "✓ Compiled successfully"
    预期结果: 构建成功，生成 .next 目录
    失败指标: 构建失败或警告
    证据: .sisyphus/evidence/task-3-build.log

  场景: 验证 lint 检查通过
    工具: Bash
    前置条件: 构建成功
    步骤:
      1. 运行 `npm run lint`
      2. 检查输出
    预期结果: 无错误，exit code 0
    失败指标: ESLint 错误
    证据: .sisyphus/evidence/task-3-lint.log
  ```

  **证据捕获**:
  - [ ] 保存构建日志到 task-3-build.log
  - [ ] 保存 lint 日志到 task-3-lint.log

  **Commit**: NO (与前序任务合并)

- [ ] 4. Playwright E2E 测试验证

  **做什么**:
  - 运行 `npm run test:e2e` 执行端到端测试
  - 验证游戏功能正常
  - 验证高分系统正常
  - 捕获测试结果

  **Must NOT do**:
  - 跳过失败的测试
  - 修改测试用例绕过问题

  **推荐 Agent Profile**:
  - **Category**: `unspecified-high` - 需要验证多个功能点
  - **Skills**: [`playwright`]

  **并行化**:
  - **可并行执行**: NO
  - **并行组**: Sequential (依赖 Task 3)
  - **阻塞**: Task 5
  - **被阻塞**: Task 3

  **验收标准**:
  - [ ] 所有 Playwright 测试通过
  - [ ] 游戏可以正常开始和游玩
  - [ ] 高分系统正常工作

  **QA 场景**:

  ```
  场景: 验证游戏主页面加载
    工具: Playwright
    前置条件: 开发服务器运行中
    步骤:
      1. 导航到 http://localhost:3000
      2. 等待游戏画布渲染
      3. 验证游戏控制按钮存在
    预期结果: 游戏界面完整渲染
    失败指标: 页面空白或关键元素缺失
    证据: .sisyphus/evidence/task-4-game-load.png

  场景: 验证高分列表加载
    工具: Playwright
    前置条件: 游戏页面已加载
    步骤:
      1. 找到高分列表区域
      2. 验证列表元素存在
      3. 检查是否能从 API 获取数据
    预期结果: 高分列表显示（可以为空）
    失败指标: API 错误或列表不显示
    证据: .sisyphus/evidence/task-4-scores.png
  ```

  **证据捕获**:
  - [ ] 保存游戏加载截图到 task-4-game-load.png
  - [ ] 保存高分列表截图到 task-4-scores.png
  - [ ] 保存测试结果输出到 task-4-e2e-results.log

  **Commit**: NO (与前序任务合并)

- [ ] 5. 清理和文档更新

  **做什么**:
  - 更新 README.md 反映新的 Next.js 版本
  - 删除任何临时文件或备份
  - 运行 `git status` 查看所有变更
  - 创建最终提交

  **Must NOT do**:
  - 提交 node_modules 或其他忽略文件
  - 遗漏重要的配置变更

  **推荐 Agent Profile**:
  - **Category**: `quick` - 清理任务
  - **Skills**: [`git-master`]

  **并行化**:
  - **可并行执行**: NO
  - **并行组**: Sequential (依赖 Task 4)
  - **阻塞**: 无
  - **被阻塞**: Task 3, 4

  **验收标准**:
  - [ ] README.md 更新 Next.js 和 React 版本信息
  - [ ] git status 显示清晰的变更
  - [ ] 所有变更已提交

  **QA 场景**:

  ```
  场景: 验证 git 状态干净
    工具: Bash
    前置条件: 所有测试通过
    步骤:
      1. 运行 `git status`
      2. 检查只有预期的文件被修改
      3. 确认无未跟踪的文件
    预期结果: git status 显示 package.json, next.config.js 等变更
    失败指标: 有意外的文件变更
    证据: .sisyphus/evidence/task-5-git-status.log

  场景: 验证 README 版本更新
    工具: Read
    前置条件: README 已更新
    步骤:
      1. 读取 README.md
      2. 检查 Next.js 版本描述
      3. 验证版本号为 16
    预期结果: README 提到 Next.js 16
    失败指标: 版本号仍为 14
    证据: .sisyphus/evidence/task-5-readme-check.txt
  ```

  **证据捕获**:
  - [ ] 保存 git 状态到 task-5-git-status.log
  - [ ] 保存 README 版本检查到 task-5-readme-check.txt

  **Commit**: YES
  - Message: `docs: update README for Next.js 16`
  - Files: README.md
  - Pre-commit: npm run dev

---

## Final Verification Wave

- [ ] F1. **计划合规审计** — `oracle`
  验证所有 "Must Have" 已实现，所有 "Must NOT Have" 未出现，所有证据文件存在

- [ ] F2. **代码质量审查** — `unspecified-high`
  运行 `tsc --noEmit` + `npm run lint` + `npm run build`，检查 AI slop 模式

- [ ] F3. **真实手动 QA** — `unspecified-high` + `playwright`
  从头执行每个任务的 QA 场景，测试跨任务集成

- [ ] F4. **范围保真度检查** — `deep`
  验证每个任务的实际 diff 与 "What to do" 1:1 匹配

---

## Commit Strategy

- **Task 1**: `chore(deps): upgrade to Next.js 16 and React 19` — package.json, package-lock.json
- **Task 2**: `fix(sqljs): configure webpack for WASM loading` — next.config.js
- **Task 5**: `docs: update README for Next.js 16` — README.md

---

## Success Criteria

### 验证命令
```bash
npm run dev      # 预期：成功启动，无 WASM 错误
npm run build    # 预期：✓ Compiled successfully
tsc --noEmit     # 预期：无错误
npm run lint     # 预期：无错误
npm run test:e2e # 预期：所有测试通过
```

### 最终检查清单
- [ ] 所有 "Must Have" 已实现
- [ ] 所有 "Must NOT Have" 未出现
- [ ] 所有测试通过
- [ ] 应用在浏览器中无 WASM 错误
- [ ] 游戏功能正常
