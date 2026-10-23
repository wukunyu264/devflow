# 线上验收改造记录

> 以下 T1–T9 及 before/after 是首次本地改造结束时的阶段记录，其中“旧公网失败”“尚未推送”描述当时状态。后续发布以 GitHub 提交、Netlify 部署结果和重新运行的公网验收为准。

## 状态边界

- 公开交付地址：https://boisterous-cascaron-44d48a.netlify.app
- 本轮只修改本地工作区；没有登录第三方后台，没有执行云端 SQL，没有提交/推送触发部署。
- 当前公网旧版本在只读测试中仍返回全量正文，`npm test` 如实失败。本轮不能标记“线上全绿”。
- 额外种子 `003_extra_content.sql` 与生成器来自前一项内容补充任务，未执行云端导入。

## T1–T9 交付

| 项目 | 修改与原因 | 验证 | 尚需处理 |
| --- | --- | --- | --- |
| T1 P0 | `backend.ts` + `scripts/start.mjs` 在 Next CLI 启动前检查 DATA_BACKEND；`instrumentation.ts` 保护 serverless 冷启动；`store.ts` 不再依赖单独 VERCEL 标识。生产默认 Supabase；显式 local 仅用于有持久磁盘的 Node。 | resolver 测试覆盖缺变量、非法值及多平台标识；实际生产进程缺配置/Netlify local 均在 Ready 前退出。 | Netlify 设置 DATA_BACKEND=supabase，Builds/Functions 均有 URL/公钥。 |
| T2 P0 | README 第一屏加入实测公开地址和 5 分钟流程；部署文档全面改为 Netlify。保留 vercel.json 并明确仅为历史备用。 | 检查 README 链接；公网已可匿名访问，但功能验收针对部署后版本。 | 人工发布本轮代码。 |
| T3 P0 | `run-tests.mjs` 自动分流；本地清空云配置并启动隔离生产服务，不使用开发者数据库；云端只做只读检查，写入套件明确 skip。保留原生命周期断言并加强正文/404。 | `test:local` 完整套件；`npm test` 对旧公网版本明确报出正文泄漏，不伪装通过。 | 部署后重跑 npm test；真实 Supabase 双账号流程人工验收。 |
| T4 P1 | `article_summaries` security-invoker 视图在数据库内计算阅读时长；列表无 content；当前正文按 ID 读取；`page-data.ts` React cache 共享 metadata/Page；provider 去掉挂载刷新与阅读后的全量刷新。 | 生产日志核对：一个社区快照、一个正文查询；首页 API/RSC 不含正文，详情不含其他正文。 | 运行 004 迁移；快照仍包含多个有界查询，并非一条 SQL。列表 200、互动各 500 的上限已文档化。 |
| T5 P1 | `site-app.tsx` 按需加载阅读/编辑/账号页；Markdown 单独 chunk；`highlight.ts` 仅注册 JS/TS/Python/Java/SQL/CSS/XML/Bash 八种语法，不导入 common。 | `.next` manifest 与生产 HTML 引用两种统计，脚本强制原始 <800000 / gzip <260000 字节。 | 此数字是入口 JS/CSS，不含 HTML/RSC、图片、字体，也不代表移动网络实测 LCP。 |
| T6 P1 | sitemap 按 500 条遍历全部发布文章和类别；robots、metadataBase、文章 OG/canonical、转义 `<` 的 JSON-LD、静态生成 OG PNG。 | HTTP 内容检查、HTML 标记断言，OG PNG 200。 | SITE_URL 配置为正式 origin；线上需发布后再检查。 |
| T7 P1 | 删除导致提前流式响应的根 loading 边界，metadata 阻塞，校验路径与资源存在性后才进入页面 Suspense；head 内联主题脚本，主题按钮用 external store。 | GET/HEAD 未知路径、非法类别/ID/缺失文章均精确 404；脚本在 head，VM 验证深色存储/系统偏好。 | React 将 stylesheet 提前到脚本之前（实际 HTML 索引 138 < 2490）；脚本仍在 head、body 绘制前。字面“样式前”未满足，真机无白闪待人工确认，T7 标为部分完成。 |
| T8 P2 | 认证限流改为 Supabase 私有表原子窗口计数，SQLite 也持久计数；anon 不再能调用阅读 RPC，登录用户每 UTC 日去重；退出检查 GoTrue 结果并核对会话已撤销；RLS 限制旧会话；注册错误中性化；保留类别/标签关系，删除未用 GIN。 | 嵌入式 PostgreSQL 运行 001/002/004，重复迁移、anon 权限、13 次限制、阅读去重、旧会话 RLS 均验证；提供 VERIFY_PRODUCTION.sql。 | PGlite 的 auth 函数/会话表是本地合约夹具，不能替代真实 Supabase Auth 验收。错误状态/时序没有声称完全防枚举。 |
| T9 P2 | ESLint Next Core Web Vitals + TS，零告警；修正 effects/refs/图片/无用导入；锁定 next/react/react-dom/lucide 版本；移除 Tailwind/PostCSS 与未使用高亮依赖，保留同款 MIT reset。 | lint --max-warnings 0、typecheck、Webpack build、npm ci；秘密扫描与忽略目录核对。 | Next 的若干 ESLint 插件 peer 范围暂未声明 ESLint 10，npm 给出 peer warning；按本地 Next 文档支持 10，实际 lint 已运行。 |

## 指标口径

原有 `.next` 构建在修改前已用 `scripts/measure-first-load.mjs before --manifest` 保存。统一统计 client-reference/build manifest 中的入口 chunk、root、polyfill 和 CSS，并分别 gzip 后求和；这比现代浏览器实际关键路径更保守。

| 指标 | before | after |
| --- | ---: | ---: |
| 入口原始 JS+CSS | 1,648,965 bytes | 726,399 bytes |
| 入口 gzip | 515,343 bytes | 219,063 bytes |
| 社区快照加载 | metadata + Page + hydration 至少 3 次 | 请求内 1 次 |
| 当前正文外的文章正文 | 整个文章列表 | 0 |
| 单次匿名文章 SSR 底层查询 | 原始未单独采样 | 6 个有界查询：列表、当前正文、作者、评论、点赞、关注 |
| 构建总耗时 | 原始构建无计时记录；本轮首个 T1 构建 83.58 秒 | 53.5 秒 |

用户提供的旧浏览器口径为 1240 KB / gzip 378 KB；与 manifest 总计口径不同，不直接拿两套口径计算降幅。构建耗时受缓存/机器负载影响，不作为性能保证。

完整逐资源测量与数据库日志放在忽略的 `test-results/`。最终摘要保留在本文件。

## 需要你做的事

1. 阅读并在 Supabase SQL Editor 运行 `004_production_hardening.sql`，再运行 `VERIFY_PRODUCTION.sql`。不要重跑旧建表文件。
2. Netlify 配置 DATA_BACKEND=supabase、两个现有 Supabase 变量、SITE_URL；不使用 service_role，不关闭 RLS。
3. 审核本地变更后提交、推送 main，由 Netlify Git 集成部署；确认 Published 对应正确 commit。
4. 运行 npm test 和公网 curl -I /unknown-page；无痕按 README 双账号流程走通，并验证退出后旧 Cookie 不能继续操作。
5. 真实浏览器确认深色刷新和手机布局。完整人工步骤见 DEPLOYMENT.md。

## 最终执行结果

- npm ci：成功（包含已声明的 peer/allow-scripts 安装提示，未修改全局 npm 安全策略）。
- npm run typecheck / npm run lint / npm run build：通过；构建命令保持 Webpack。
- npm run test:local：16/16 通过，包含 SQLite 业务生命周期、PGlite 权限合约、启动保护与公开页面断言。
- 生产 HTML 引用统计：726,205 bytes / gzip 218,895 bytes；manifest 保守统计如表。
- SSR 日志：1 个社区快照、6 个有界查询、1 个当前正文读取。
- npm test：当前旧公网版本失败于列表携带 content；云端写入生命周期明确 skip。
- 秘密扫描、忽略目录和 diff whitespace 检查通过；没有提交或推送。

- 公网 HEAD /unknown-page 实测 HTTP 200（旧版）；本地最终 GET/HEAD 均 404。该全局线上验收项尚未通过。
- 最新 npm test：2 pass / 1 fail / 1 skip，失败为旧版列表仍含 content；没有放宽断言。

## 发布前复核

- 维护者已重新执行安装、类型检查、构建、lint 和本地测试，16 项通过；本次发布阶段不再修改应用代码。
- 公钥只读检查确认云端 article_summaries 已可读取，匿名调用 devflow_session_active 被拒绝（42501）。这不替代真实登录验收。
- npm audit --omit=dev：0 个漏洞。完整审计的 5 个 high 均来自 ESLint 开发工具链（braces / micromatch / fast-glob 及上层依赖）。未执行会建议降级 eslint-config-next 的 audit fix --force；工具链升级应单独验证。
- .env.local、数据库、构建产物、测试输出及浏览器临时目录继续忽略；提交前另行检查暂存内容。
