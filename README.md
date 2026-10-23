# DevFlow — 开发者技术社区

**线上地址：[https://boisterous-cascaron-44d48a.netlify.app](https://boisterous-cascaron-44d48a.netlify.app)**

首页为全屏动态门户；点击「进入技术社区」，或直接打开 [文章信息流](https://boisterous-cascaron-44d48a.netlify.app/community)。首页动画可暂停，并尊重系统的减少动态效果偏好。

源码：[wukunyu264/devflow](https://github.com/wukunyu264/devflow)。实际部署平台为 **Netlify**，数据库与认证为 **Supabase**。

> 以 Netlify Published 对应的提交及 `npm test` 公网检查确认实际发布状态；本地检查与真实云端账号验收分别记录，详见 [ACCEPTANCE.md](./ACCEPTANCE.md)。

## 5 分钟验收

1. 无痕打开上方链接，通过「进入技术社区」浏览信息流、分类与文章；无需登录 Netlify。
2. 注册自己的邮箱账号；如要求验证邮箱，完成验证再登录。发布一篇标题至少 4 字、正文至少 20 字的文章。
3. 点赞、评论、刷新页面，确认内容与互动仍在；复制文章链接，在另一个无痕窗口阅读。
4. 使用第二个账号，确认无法编辑、删除第一个账号的文章和评论。
5. 查看 [/sitemap.xml](https://boisterous-cascaron-44d48a.netlify.app/sitemap.xml)、[/robots.txt](https://boisterous-cascaron-44d48a.netlify.app/robots.txt)，用 `curl -I` 检查 `/unknown-page` 返回 **404**；切换深色模式后刷新。

注册出现「验证邮件发送额度已用尽」时，需要维护者调整 Supabase 邮件服务，刷新页面或重部署不能恢复发信额度。演示站可由维护者关闭 Confirm email；保留验证则配置自定义 SMTP。具体操作见 [注册故障处理](./DEPLOYMENT.md#注册失败先检查邮件服务p0)。匿名阅读不需要账号。

## 本地运行

需要 Node.js 24。安装使用锁文件，不改构建方式：

```powershell
npm ci
npm run dev
```

打开终端提示的地址（默认 `http://localhost:3000`）。后端选择：

- 无云配置的开发环境默认 SQLite，数据保存在 `data/devflow.sqlite`；首次创建 6 位示例作者和 18 篇文章。
- 配置 Supabase URL/公钥的开发环境使用云数据库；也可显式设置 `DATA_BACKEND=supabase`。
- 生产环境默认要求 Supabase。自托管且有持久磁盘的 Node 进程可显式用 `DATA_BACKEND=local`；serverless 环境会拒绝 SQLite。
- `.env.local`、`data/`、`.next/`、`test-results/` 均不提交。云端只使用 publishable/anon key 和用户 JWT，不需要 service_role key。

若本机已有云配置但想使用 SQLite，在当前 PowerShell 设置 `$env:DATA_BACKEND='local'` 后运行开发服务。两套账号与数据相互独立。

## 检查与构建

```powershell
npm run typecheck
npm run check:auth
npm run build
npm run lint
npm run test:local
npm test
npm run measure:first-load
```

- `build` 始终为 `next build --webpack`；生产启动使用 `npm start`。
- `test:local` 自动启动生产服务、清空两个 Supabase 变量，使用 `test-results/` 下独立 SQLite，完整验证注册、私有草稿、发布、持久化、互动、跨账号权限、退出、SEO、精确 404。运行前先构建，无需另开开发服务。
- `npm test` 根据配置选择后端：Supabase 模式只对 `TEST_BASE_URL`（默认线上地址）执行匿名只读验收，明确跳过写入生命周期；本地模式运行完整用例。云端旧版本或迁移缺失时测试会失败，不会伪装通过。
- `check:auth` 只读检查 Supabase 注册/邮箱验证开关，不创建账号、不发邮件、不打印密钥；剩余 SMTP 额度无法从公开设置查询。
- `measure:first-load` 从 `.next` 的 client-reference/build manifest 统计入口 JS/CSS、polyfill 和 CSS；每个资源单独 gzip 后求和，排除 HTML/RSC、字体、图片、交互后动态 chunk。保留原有保守预算（含 noModule polyfill），另列现代浏览器排除 noModule 后的数字。详细结果在忽略的 `test-results/`。
- 匿名公开数据缓存 60 秒；登录态与私人草稿不共享缓存。站内写入即时失效，直接从 Supabase 后台修改的数据最多等缓存过期后更新；HTML/API 响应仍为 private，避免会话进入 CDN 共享缓存。修复范围与未完成项见 [QA-FIXES.md](./QA-FIXES.md)。

## 实现与结构

独立动态门户首页 + 原有社区页面：技术分类、搜索、Markdown 阅读与目录、创作编辑器、草稿、个人主页、点赞/收藏/关注/评论、深色模式与响应式布局。门户样式使用 CSS Modules 隔离，不修改后续页面的外观。

技术栈：Next.js **16.4.2** App Router、React **19.3.1**、TypeScript strict、手写 CSS、Lucide **1.61.0**、CodeMirror、react-markdown、Zod、Sonner。已移除 Tailwind 构建依赖；保留附 MIT 许可的独立浏览器 reset，保持原有样式。

| 文件 | 用途 |
| --- | --- |
| `src/lib/backend.ts` / `src/instrumentation.ts` | 显式后端选择、启动检查 |
| `src/lib/store.ts` / `community.ts` / `page-data.ts` | 有界投影、当前文章正文、请求内 React cache |
| `src/app/[[...path]]/page.tsx` | 路由校验、metadata、Article JSON-LD |
| `src/components/landing.tsx` / `landing-motion.tsx` / `landing.module.css` | 全屏动态门户、暂停/离屏控制、独立样式 |
| `src/app/sitemap.ts` / `robots.ts` / `opengraph-image.tsx` | SEO |
| `supabase/001_schema.sql` / `002_seed.sql` | 新项目建表、原始种子 |
| `supabase/003_extra_content.sql` | 可选 5 位展示作者 / 20 篇演示文章，无登录账号 |
| `supabase/004_production_hardening.sql` | 现有库升级：列表视图、持久限流、会话校验、阅读去重 |
| `DEPLOYMENT.md` / `ACCEPTANCE.md` | Netlify 部署、人类操作与验收证据 |

## 已知限制

- 账号后台与真实邮箱操作由维护者完成。公开版本以部署后 `npm test` 和双账号流程确认，不能仅凭本地通过判断。
- 主题脚本位于 head 且在 body 绘制前执行，但 React 把 stylesheet 排到脚本前，因此字面“脚本在 CSS 前”的要求尚未达到；深色偏好逻辑已测试，真实浏览器无白闪仍需确认。
- 社区快照最多 200 篇文章、200 位作者，互动表最多各 500 行；搜索范围为标题、摘要、标签与作者，不再搜索正文。大规模分页与全文搜索不属于本次范围。sitemap 以 500 条一批读取全部已发布文章。
- 一篇文章页只有一次社区快照装载，metadata 与 Page 共享；该快照仍由多个有界表查询组成，不能称为“一条 SQL”。
- 阅读量仅统计登录用户，每用户/文章/UTC 日期最多一次；匿名阅读正常展示，不增加计数。
- 云端 access JWT 不能靠清 Cookie 即时失效。迁移通过 `auth.sessions` 检查及 restrictive RLS 拒绝已退出会话；GoTrue 退出失败不会被报告成功。自然过期的 SSR 会话不会写 Cookie，需重新登录或由 API 刷新。
- 注册使用中性失败提示，不显示邮箱是否已注册；未承诺整个认证服务在状态码和时序上完全不可枚举。
- `categories` 作为文章外键约束保留；`tags/article_tags` 由触发器同步，作为规范化关系保留，当前 UI 不查询它们。未使用的 `articles_search` GIN 索引在迁移中移除。
- 示例身份不是可登录账号，早期种子的阅读/点赞是演示指标；AI 专区是内容分类，没有调用模型服务。正文图片仅支持外部 URL，没有文件上传。

部署请按 [DEPLOYMENT.md](./DEPLOYMENT.md)；当前 `vercel.json` 仅为可选平台的历史备用配置，Netlify 不使用它。
