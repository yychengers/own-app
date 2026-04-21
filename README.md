# own-app · 每日摊销实验室

个人向的「消费品每日成本」小工具：把一次性支出按使用天数摊到每一天，直观看到「这件东西今天值多少钱」。数据仅存于浏览器本地，无需登录与后端。

在线仓库：<https://github.com/yychengers/own-app>

---

## 主要功能

### 消费记录

- **新增记录**：填写物品名称、金额（人民币元）、购买日期；支持通过 **自定义日历弹层** 点选日期（不可选今天之后的日期）。
- **列表展示**：首页列出全部记录，每条展示总价、购买日、**已用天数**（按本地日历日、含首尾两天）、**今日摊销（元/天）**。
- **汇总**：有记录时展示「全部物品今日合计（元/天）」与条数。
- **编辑**：每条卡片可 **编辑**，修改后写回本地存储。
- **删除**：删除前有浏览器原生确认，避免误触。

### 首次使用与引导

- 本地 **没有任何记录** 时，会弹出表单且 **不可关闭**，引导先录入至少一条（避免空列表无法开始计算）。

### 「今天」与每日 0 点

- 「今天」按 **用户电脑的本地时区** 计算日历日（`YYYY-MM-DD`）。
- 使用 **链式 `setTimeout` 对齐下一次本地 0 点**，到点后更新「今天」并重算摊销；页签从后台回到前台时会再校正一次，减轻长时间挂起后的偏差。

### 数据持久化

- 所有记录保存在 **`localStorage`**，键名：`daily-amortize:purchases:v1`。
- 刷新、关闭标签页后数据仍在；**换浏览器或清空站点数据会丢失**，重要数据请自行导出备份（当前版本未内置导出，若需要可自行在开发者工具中备份该键或后续加功能）。

---

## 核心业务规则

### 每日摊销怎么算

- 设购买日为 \(D_0\)，评估日为「今天」\(D_t\)（均为 **本地日历日**，不含时分秒）。
- **已用天数** \(N\)：从 \(D_0\) 到 \(D_t\) 的 **日历日天数，含首尾两天**（至少为 1）。
- **今日摊销（元/天）** = `总价金额 / N`。

示例：总价 1000 元，购买日与今天之间共跨 **50 个日历日**（含购买日当天与今天），则每天约为 `1000 / 50 = 20` 元/天。过了本地 0 点进入新的一天后，\(N\) 增加，单日摊销会略降（在金额不变的前提下）。

### 与「用了多少天」的日常说法

产品按 **日历日** 计数（与用户举例一致），不是按「满 24 小时」或「自然周」等其它口径；若以后要支持多种口径，需要在需求与数据结构上单独扩展。

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Vue 3（`<script setup>`） |
| 语言 | TypeScript |
| 构建 | Vite 6 |
| 状态 | Pinia |
| 路由 | Vue Router（当前单页首页） |
| 样式 | Less（scoped） |
| 字体 | Google Fonts：`Outfit`、`JetBrains Mono`（需联网加载；内网离线环境可改为本地字体或系统栈） |

---

## 快速开始

### 环境要求

- **Node.js**：建议 **20 LTS** 或 **22**（与 `@types/node` 大版本一致即可）。
- 现代浏览器（支持 `localStorage`、`crypto.randomUUID` 等；极旧环境会回退随机 id 方案）。

### 安装与运行

```bash
npm install
npm run dev
```

浏览器访问终端里打印的本地地址（一般为 `http://localhost:5173`）。

### 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器（热更新） |
| `npm run build` | **并行**执行 `vue-tsc --build` 与 `vite build`，产物在 `dist/` |
| `npm run preview` | 本地预览生产构建 |
| `npm run type-check` | 仅 TypeScript / Vue 类型检查 |
| `npm run build-only` | 仅 Vite 打包（不跑 `vue-tsc`） |

---

## 目录结构（简要）

```text
src/
  App.vue                 # 根布局与全局背景
  main.ts                 # 入口：Pinia、Router、全局样式
  assets/main.less        # 全局 reset / 字体等
  router/index.ts         # 路由表
  views/HomeView.vue      # 首页：列表、汇总、弹窗状态
  components/
    AddPurchaseModal.vue  # 新增/编辑表单弹窗
    CalendarDatePicker.vue# 购买日期：点击弹出月历
    PurchaseCard.vue      # 单条记录卡片
  composables/
    useLocalCalendarDay.ts # 本地「今天」与 0 点对齐
    usePurchaseMetrics.ts  # 单条：天数、每日金额
  stores/purchases.ts     # Pinia：增删改、localStorage
  utils/
    dates.ts              # 本地 YMD、跨日天数、距下次 0 点
    calendar.ts           # 月历网格辅助计算
    money.ts              # 金额展示格式化
```

---

## 开发注意事项

### npm 源与依赖安装

仓库根目录包含 **`.npmrc`**，将 `registry` 指向 `https://registry.npmjs.org/`。若你所在环境默认走私有 Nexus 且缺少公共包，保留该文件可避免 `npm install` / `npx` 404。若公司策略要求统一私服，请在遵守规范的前提下调整或删除 `.npmrc`，并确保私服已同步所需包。

### 类型检查与构建

- **`npm run build` 会跑类型检查**，CI 或发布前请以该命令为准。
- 修改 `tsconfig`、Vue 组件 props 或 Pinia 返回值类型后，建议执行一次 `npm run type-check` 再提交。

### 数据与隐私

- **无服务端**：所有业务数据只在用户本机 `localStorage`；不要在代码中写入真实密钥（本项目也不需要）。
- 若将来接入同步/账号，需重新设计存储与冲突解决，并考虑 GDPR/个人信息合规（当前版本不涉及）。

### 日期与时区

- 逻辑一律按 **本地日历日** 字符串 `YYYY-MM-DD` 处理，避免 `Date` 被序列化成 UTC 导致「差一天」类 bug。
- 用户修改系统时区或手动改系统时间，会影响「今天」与天数统计，属预期行为。

### UI / 无障碍

- 弹窗、日历等交互已加基础 `aria-*`；若要做生产级无障碍审计，可再补充焦点陷阱、键盘完整走查等。
- 背景使用高对比霓虹风格，长时间使用若感到视觉疲劳，可考虑后续增加「低对比度 / 简洁主题」开关。

### 代码风格（与仓库现状对齐）

- Vue 单文件组件使用 **`<script setup lang="ts">`**。
- 样式优先 **Less + scoped**；复杂可抽 composable，避免在视图里堆过长业务式子。
- 与钱相关的展示用 `utils/money.ts` 的格式化，避免各处重复 `toFixed`。

### Git 与协作

- 提交信息建议清晰说明「功能 / 修复 / 文档」等，便于日后查阅。
- `node_modules`、`dist` 已在 `.gitignore` 中忽略，勿提交。

---

## 在 iPhone 上当「App」用（添加到主屏幕）

本项目已配置 **Web App 元数据**（`index.html` 中的 `apple-mobile-web-app-*`）与 **`public/manifest.webmanifest`**，在 iOS Safari 里可像原生图标一样固定到主屏幕，并以 **全屏（standalone）** 方式打开，隐藏 Safari 底部工具栏（与真·App 仍有差异：系统级推送、后台能力等不可用）。

### 使用步骤（iOS）

1. **先部署到 HTTPS 站点**（或用局域网 HTTPS；纯 `http://` 的公网地址，iOS 对「添加到主屏幕」的体验可能受限，**GitHub Pages / Cloudflare Pages 等均为 HTTPS**，推荐）。
2. 用 **Safari** 打开站点首页（不要用 Chrome 仅测试 A2HS 时，请以 Safari 为准）。
3. 点击底栏 **分享** 按钮（方框带向上箭头）。
4. 向下滚动，点 **添加到主屏幕**，可改名称后确认。
5. 回到主屏幕，点新图标进入；此时一般为全屏 Web App，数据仍在 **本机 Safari 的存储分区**（与「Safari 里直接打开」同源策略一致）。

### 已包含的静态资源（`public/`）

| 文件 | 作用 |
|------|------|
| `manifest.webmanifest` | Web 应用清单：`name`、`display: standalone`、主题色与图标（便于 Android / 部分环境）。 |
| `apple-touch-icon.png` | **180×180**，主屏幕图标（当前为纯色占位，可自行替换为设计稿导出图）。 |
| `pwa-192.png` / `pwa-512.png` | 清单用 PNG 图标。 |
| `favicon.svg` | 浏览器标签页矢量图标。 |

替换图标时，建议仍导出 **圆角由系统处理** 的方图即可；替换后重新 `npm run build` 并部署。

### 与本项目相关的注意点

- **Google Fonts**：若在手机 **离线** 打开，字体可能回退到系统字体，功能不受影响。
- **数据**：`localStorage` 与在 Safari 里访问同一域名时共享；若以后为同一项目配置了 **多子域** 或改了部署域名，存储不会自动迁移。
- **安全区**：首页已为底部悬浮按钮与页边增加 `env(safe-area-inset-*)`，适配带 Home 指示条的机型。

### 若你需要「真上架 App Store」

需要 **Apple 开发者账号**，用 **Capacitor** 或 **Cordova** 把 `dist/` 包进 `WKWebView`，再用 Xcode 打包提交审核；维护成本明显高于「添加到主屏幕」，适合有推送、付费上架等强需求时再考虑。

---

## 部署说明（静态站点）

### 推荐：GitHub Pages（免费 HTTPS，已配好 CI）

仓库已包含 [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml)：推送到 **`main`** 会自动构建并发布。

1. 打开 GitHub 仓库 → **Settings** → **Pages**。
2. **Build and deployment** → **Source** 选择 **GitHub Actions**（不要选 Branch）。
3. 将本仓库最新代码 **push 到 `main`**（或手动运行 Actions 里的 **Deploy GitHub Pages** workflow）。
4. 等待 Actions 变绿后，访问：  
   **`https://<你的用户名>.github.io/<仓库名>/`**  
   例如仓库名为 `own-app` 时：`https://yychengers.github.io/own-app/`。

说明：

- CI 会注入 `VITE_BASE=/<仓库名>/`，与 `vite.config.ts` 中的 `base` 一致；本地开发不设该变量时仍为根路径 `/`。
- 构建后会复制 `index.html` 为 `404.html`，减轻 GitHub Pages 上刷新时的白屏问题（路由增多时仍建议在托管侧配置 SPA 回退）。

### 其它静态托管

构建生成 `dist/` 后，也可部署到 Cloudflare Pages、Vercel、Netlify、Nginx 等。若站点不在域名根路径，同样需要设置正确的 `base` / `VITE_BASE`，并配置 SPA 回退。

---

## 常见问题（FAQ）

**Q：换电脑后数据还在吗？**  
A：默认不在；数据在浏览器本地。换机需自行迁移 `localStorage` 或后续增加导入导出。

**Q：可以填未来的购买日吗？**  
A：日历选择器禁止选今天之后的日期；若通过其它手段写入异常数据，加载时会过滤非法项并可能提示错误信息。

**Q：删除所有记录后会怎样？**  
A：会再次强制打开录入弹窗，与首次使用一致。

**Q：Cursor / VS Code 左下角 GitLens 提示「Base path '' must be an absolute path」？**  
A：多为 GitLens 在少数工作区下把仓库根路径解析成空串。本仓库已提供 [`.vscode/settings.json`](.vscode/settings.json)：加深 Git 仓库扫描，并**关闭 GitLens 状态栏项**（左下角报错多由此触发）。修改后请 **重新加载窗口**（命令面板：`Developer: Reload Window`）。若仍出现，可在用户设置里升级 [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) 或暂时关闭 **GitLens: Current Line Blame**（`gitlens.currentLine.enabled`）。请尽量用 **文件 → 打开文件夹** 直接打开本仓库根目录 `own-app`，不要只打开上一级目录。

---

## 开源与许可

本项目为个人仓库维护。若需添加 `LICENSE`（如 MIT），可在仓库中自行补充并更新本说明。

如有功能建议（导入导出、多币种、按周汇总等），欢迎通过 [Issues](https://github.com/yychengers/own-app/issues) 讨论。
