# DevFlow — 开发者灵感社区

让技术沉淀，让灵感流动。一个可在本地完整运行、支持真实数据持久化的技术博客社区。

## 本地运行

需要 **Node.js 24 或以上版本**。

```powershell
cd D:\wky\boc
npm install
npm run dev
```

浏览器打开 **http://localhost:3000**。如端口已被占用，以终端打印的 Local 地址为准。保持运行命令的终端打开；使用 Ctrl+C 停止。

本地无需配置任何云服务。首次启动自动创建 `data/devflow.sqlite`，导入 18 篇技术示例文章与 6 位作者。注册你自己的账号即可体验发布、评论、点赞、收藏和关注。SQLite 文件在刷新页面和重启服务后保留。

本地账号与之后的 Supabase 云账号相互独立，不会自动迁移。不要把 `data/` 或任何密钥提交到公共仓库。

## 已实现

- 三栏社区首页、推荐/最新/热门排序、逐批加载、分类和 AI 专区。
- 全局搜索：标题、摘要、正文、标签与作者；热门标签与作者推荐。
- Markdown 阅读、代码高亮/复制、表格、图片链接、自动目录、当前章节高亮、阅读进度、阅读时长、相关推荐。
- 邮箱注册、密码登录、退出、HttpOnly Cookie 会话、登录状态保持。
- CodeMirror Markdown 编辑、格式工具栏、编辑/分屏/预览、全屏、Ctrl/⌘+S。
- 保存数据库草稿、浏览器意外退出备份、恢复草稿、分类/标签/摘要/主题封面、发布与更新。
- 文章管理、删除文章、个人主页与资料编辑、收藏列表。
- 点赞与取消、收藏与取消、关注与取消、评论与删除自己的评论。
- 深色模式、手机/平板适配、Toast、加载/空/错误状态、自定义 404 与页面 Metadata。
- 后端输入验证、来源校验、身份检查、资源归属检查、唯一约束、级联删除。
- Supabase Auth/数据库适配器，以及完整表结构、权限策略、示例数据 SQL。

技术栈：Next.js 16 App Router、React、TypeScript strict、Tailwind CSS 4、自定义设计组件、Lucide、CodeMirror、react-markdown、Zod、Sonner。核心排版使用 CSS 设计变量；动画使用轻量 CSS，并遵循 reduced-motion 偏好。

## 检查与构建

```powershell
npm run typecheck
npm run build
# 另一个终端先运行 npm run dev，再运行：
npm test
```

集成测试会在**本机 SQLite** 创建测试账号/文章，验证注册、登录、会话撤销、私有草稿、发布持久化、评论、点赞、收藏、关注、跨账号权限和页面访问。测试文章会在测试中删除；测试账号保留用于复查。此测试套件拒绝对 Supabase 模式执行。

生产启动：`npm run build` 后运行 `npm start`。此环境的 Turbopack 生产编译遇到进程兼容问题，生产构建固定采用 Next.js 官方支持的 `--webpack`；开发模式仍使用 Turbopack。

Next.js 的 `loading.tsx` 会提前开始流式响应，所以异步路由中的 `notFound()` 可能保留 HTTP 200，同时返回自定义 404 页面与 `robots=noindex`；测试按此框架行为验证。

## 文件结构

```text
src/app/[[...path]]/page.tsx     页面路由和服务端初始数据
src/app/api/community/route.ts  业务 API、校验与权限
src/components/                首页、阅读、账号、编辑器、创作中心
src/lib/store.ts               SQLite / Supabase 数据层
src/lib/auth.ts                本地密码哈希与 Cookie / Supabase 会话
src/lib/seed.ts                18 篇文章、6 位作者的示例数据
supabase/001_schema.sql        PostgreSQL 表、索引、RLS、触发器
supabase/002_seed.sql          云端示例内容
tests/community.test.mjs       本地集成测试
DEPLOYMENT.md                  从零配置 Supabase 与 Vercel
```

## 部署前须知

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。Vercel 运行环境不使用本机 SQLite，需要先配置 Supabase。项目不会把临时文件系统或浏览器缓存当作云端数据库。

示例文章的初始阅读量、历史点赞量是演示种子指标；后续用户点赞、收藏、评论等真实写入数据库。AI 专区是内容分类，未连接模型 API。封面采用原创代码图形主题；正文可引用外部图片 URL，未提供文件上传和头像上传。

Supabase SQL 和云端适配器已提供；在创建实际 Supabase 项目、执行 SQL 并配置环境变量以前，不能认为云端认证、RLS 和线上发布已经验收。当前内容检索在加载的文章中完成；更大规模社区应改为数据库分页与搜索服务。

官方参考：[Next.js 安装](https://nextjs.org/docs/app/getting-started/installation)、[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Vercel CLI 部署](https://vercel.com/docs/projects/deploy-from-cli)。
