# DevFlow：Netlify + Supabase 部署

正式地址：**https://boisterous-cascaron-44d48a.netlify.app**
仓库：**https://github.com/wukunyu264/devflow**，生产分支 `main`。

本项目实际使用 Netlify。`vercel.json` 是历史备用配置，不参与当前构建。构建始终保持 `npm run build`（`next build --webpack`），安装 `npm ci`，Node 24。

## 需要人类做的事

Codex 不会登录 Supabase、Netlify 或 Vercel，也不会代填账号凭据。

### 1. 先升级数据库

已有数据库 **不要重跑 `001_schema.sql`**：

1. 在 Supabase SQL Editor 新建查询。
2. 粘贴并完整运行 `supabase/004_production_hardening.sql`。
3. 根据 `supabase/VERIFY_PRODUCTION.sql` 检查视图、权限和限流。事务中的检查失败会报错；该验证不写真实用户或文章。
4. 可选：运行 `003_extra_content.sql` 导入另外 5 位展示作者和 20 篇文章，与本次上线修复无依赖。

新项目按顺序执行 `001_schema.sql`、`002_seed.sql`、`004_production_hardening.sql`。`001` 只用于新库；`002/003/004` 可重复运行。不要关闭 RLS。

`004` 变更：

- `article_summaries` 使用 `security_invoker=true`，遵循文章 RLS，在库内计算阅读时长，不传输正文。
- 私有 schema 的计数表实现每邮箱摘要 15 分钟 12 次认证尝试，跨函数实例共享；计数过期后自动清理。
- `devflow_session_active()` 检查 JWT 的 `session_id` 与 `auth.sessions`，身份仅取签名 JWT，不接受外部用户 ID。
- 现有所有权策略继续保留，再用 restrictive policy 要求登录会话仍存在。
- 撤销 anon 对阅读 RPC 的权限；登录用户每天最多为同一篇文章计一次阅读。
- 保留类别外键与规范化标签关系，删除实际未用到的 `articles_search` GIN 索引。

### 2. Netlify 环境变量

项目后台 **Project configuration → Environment variables**，确保变量同时用于 **Builds 与 Functions**（Free 使用 All scopes）及 Production：

```dotenv
DATA_BACKEND=supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SITE_URL=https://boisterous-cascaron-44d48a.netlify.app
```

URL、公钥直接在后台填写本项目值，不提交 `.env.local`。公钥可为 publishable 或 legacy anon；不能用 secret/service_role key。`SITE_URL` 是博客网址，不是数据库 URL。

生产缺配置会在 server 初始化时报出缺失变量名；不允许临时退回 SQLite。其他 serverless 平台同样拒绝 local。

### 3. 发布这个版本

先本地执行：

```powershell
npm ci
npm run typecheck
npm run build
npm run lint
npm run test:local
```

维护者审核变更后提交、推送 `main`（不要提交忽略文件），由 Git 集成触发 Netlify 构建；也可在 Deploys 页顶部选择 Trigger deploy，或进入上次部署选择 Retry with latest branch commit。环境变量变化后必须重新部署，单纯刷新网页无效。

确认部署显示 Published 且 commit 与本次提交一致。若启用了访问保护，按项目分享需求确认 Production 为公开访问；无痕窗口不应要求 Netlify 登录。

Supabase Authentication → URL Configuration：Site URL 设置为正式博客地址，必要时允许 `http://localhost:3000`。保留邮箱验证时，面试测试账号应提前验证邮箱。

### 4. 部署后验收

```powershell
npm test
curl.exe -I https://boisterous-cascaron-44d48a.netlify.app/unknown-page
curl.exe -I https://boisterous-cascaron-44d48a.netlify.app/sitemap.xml
curl.exe -I https://boisterous-cascaron-44d48a.netlify.app/robots.txt
```

`npm test` 在 Supabase 配置下只读线上：列表不含正文、当前正文读取、SSR 不含其他文章正文、精确 404、metadata/canonical/JSON-LD 与 SEO 文件。写入生命周期在 SQLite 自动验证；云端需按 README 的 5 分钟流程用两个真实账号手动验收。

额外检查：

- 保存退出前的 Cookie（仅在自己的调试工具中），退出后重放旧 Cookie 不能获得登录身份或修改文章；不要把令牌发到聊天或截图。
- 相同账号打开同一文章两次，阅读量最多增加 1；匿名访问不增加。
- 对同一测试邮箱连续失败登录，13 次起返回 429；换函数实例/重新部署不能重置数据库窗口。
- 第二个账号调用编辑/删除接口应得到 403；直接 Supabase REST 同样受所有权与会话策略限制。
- 深色偏好下刷新，`<head>` 的阻塞脚本在页面绘制前设置主题；可在禁用 JavaScript 后检查默认可读性，但禁用 JS 不属于完整交互验收。

## 故障定位

- 构建/启动缺配置：根据错误补齐变量并重新部署；确认 Functions 也能读取配置。
- 提示 Apply 004：数据库迁移未执行或执行不完整；不要反复重跑旧建表文件。
- 匿名数据为空：检查已发布状态、view 的 security_invoker 与 grants、原有 RLS。
- 登录/注册失败：检查验证邮件、认证限流与数据库 RPC；不要用 service_role 绕过策略。
- 退出失败：服务端保留错误，不伪装成功；网络恢复后重试。JWT 自然过期与即时会话撤销是两个不同机制。

参考：[Netlify Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)、[环境变量](https://docs.netlify.com/build/environment-variables/overview/)、[Supabase sessions](https://supabase.com/docs/guides/auth/sessions)、[视图权限](https://supabase.com/docs/guides/database/views)。
