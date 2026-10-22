# 从本地 DevFlow 到可访问的 Vercel 链接

本地可先独立验收：`npm run dev` → http://localhost:3000 。以下步骤只在准备上线时执行。

## 1. 创建两个账号

分别打开：

- [Supabase 注册/登录](https://supabase.com/dashboard)：创建云数据库与用户认证服务。
- [Vercel 注册/登录](https://vercel.com/signup)：部署网站，获取公开链接。

可使用已有 GitHub 账号登录。账号注册、密码输入、条款确认和授权由你本人操作。可选择适合个人项目的方案，遇到付费选项先确认需求再继续。

## 2. 创建 Supabase 项目

1. 登录 Supabase Dashboard，创建一个 Organization（如果还没有）。
2. 点击 **New project**，项目名可以填写 `devflow`。
3. 自己设置并保存数据库密码，选择合适的区域，创建项目并等待 Ready。
4. 打开 **SQL Editor**，新建查询，把 `supabase/001_schema.sql` 的全部内容粘贴进去，点击 Run。
5. 再建一个查询，运行 `supabase/002_seed.sql`。
6. 在 Table Editor 检查 `profiles` 有 6 条示例作者、`articles` 有 18 条示例文章。

`001_schema.sql` 用于新项目，只运行一次；重复运行会因对象已存在而报错。`002_seed.sql` 可重复运行，已有内容不会被覆盖。

## 3. 配置数据库连接

从项目的 Connect 面板或项目设置复制：

- **Project URL**：`https://你的项目标识.supabase.co`
- **Publishable key** 或 legacy **anon public key**

密钥的最新入口见 [Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys)。本项目的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 同时接受 publishable key 和 legacy anon key。**不要使用 secret key / service_role key。**

在项目根目录把 `.env.example` 复制为 `.env.local`，填写：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://你的项目标识.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的publishable或anon公钥
```

保存后停止开发服务，再运行 `npm run dev`。左侧页脚会从 LOCAL COMMUNITY 变为 BUILT FOR DEVELOPERS。重新注册云端账号，测试发布文章、点赞和评论；在 Supabase Table Editor 中确认实际有新增行。

Supabase 默认认证配置可能要求验证邮箱。若注册后提示验证，请到邮箱完成验证，再使用邮箱密码登录。本项目不会将待验证注册误报为已登录。不要为了绕过配置问题而关闭数据库 RLS。

## 4. 使用 Vercel CLI 部署

在项目目录打开终端：

```powershell
cd D:\wky\boc
npx vercel login
```

按终端提示，用浏览器完成你自己的 Vercel 登录。随后：

```powershell
npx vercel link
```

选择自己的账户，创建名为 `devflow`（如重名可换名）的项目，目录选当前目录，框架选择 Next.js，保留项目提供的构建命令。

在 [Vercel Dashboard](https://vercel.com/dashboard) 打开刚创建的项目 → **Settings → Environment Variables**，添加上面两个环境变量。选择 Production 和 Preview。请直接在 Vercel 页面填写，不要把密钥写进 Git 或公开聊天。

在项目 Settings → Build and Deployment 确认 Node.js 使用 **24.x**。项目已提供 `vercel.json`，构建为 `npm run build`，安装为 `npm ci`。

回到终端执行：

```powershell
npx vercel --prod
```

部署成功后，终端将返回实际 Production URL，例如 `https://你的项目名.vercel.app`。以返回的真实地址为准。

也可以把代码推送到自己的 GitHub 仓库后，在 Vercel Import Project 导入；同样需要在首次部署前填写环境变量。

## 5. 设置认证回跳与上线验收

在 Supabase → **Authentication → URL Configuration** 中：

- 将 Site URL 设置为 Vercel 返回的正式地址。
- 需要本地开发时，在允许的 Redirect URLs 中加入 `http://localhost:3000`。

然后用正式网站测试：

1. 首页与示例文章能匿名阅读。
2. 使用真实邮箱注册，按提示完成邮箱验证，然后登录。
3. 发布新文章，刷新后仍能查到；在数据库里能看到记录。
4. 点赞、收藏、评论后刷新，状态保持；能取消点赞/收藏。
5. 第二个账号不能修改或删除第一个账号的文章、评论。
6. 退出登录后，访问写文章页会要求登录。
7. 手机宽度可阅读，深色模式可切换。
8. 无痕窗口打开正式地址仍能访问首页（若 Vercel 启用了部署访问保护，请在 Dashboard 按实际分享需求设置）。

### 常见问题

- **上线后提示数据库不可用**：检查两个环境变量是否作用于 Production，SQL 是否成功执行；修正环境变量后重新部署。
- **页面没有示例文章**：检查是否运行了 `002_seed.sql`，以及读取策略和 grants 是否存在。
- **注册成功但登录不了**：检查邮箱验证状态、Supabase Authentication 日志以及邮件限流。
- **不能写入数据**：检查当前用户是否登录、RLS 策略和 `on_auth_user_created` 触发器是否存在；不要换用 service_role key 绕过权限。
- **本地数据在云端看不到**：本地 SQLite 与 Supabase 是两套独立的数据源，初始示例之外的数据不会自动同步。

官方资料：[Vercel CLI 部署](https://vercel.com/docs/projects/deploy-from-cli)、[Vercel 环境变量](https://vercel.com/docs/environment-variables)、[Supabase Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)。
