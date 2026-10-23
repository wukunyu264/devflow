# QA REPORT 修复记录

基线：用户提供的 `QA-REPORT.md`，线上版本 `a5a5413`。保留原报告，以下记录不把历史发现当成已修复结论。未登录任何云平台账号，未发送真实注册邮件。

## P0：注册

- `src/lib/auth-errors.ts`、`api/community/route.ts`：上游邮件额度错误转 HTTP 429；收件人限制、注册关闭和认证服务故障给出明确可处理提示。登录凭据错误为 401。只输出自定义代码/状态到日志，隐藏供应商原文，不泄漏邮箱是否存在。
- 注册/登录统一去掉邮箱首尾空格并转小写；先确认 profile 可用再签发 Cookie。
- `account.tsx`：待验证页面不再保证邮件一定已发送；保留确认后登录/立即登录两种行为，提交中的按钮也保留可访问名称。
- `tests/auth-api.test.mjs`：执行真实路由，模拟 SMTP 429、未配置收件服务、服务端失败、重复账号、中性提示、确认分支及即时会话分支；不会调用真实 Auth。
- `npm run check:auth`：只读输出注册、Email provider、Confirm email 三个开关。本次检查得到：注册开启、Email 开启、仍需验证邮箱。设置接口不能查询实时邮件额度。

**尚需维护者完成：**按 `DEPLOYMENT.md` 打开 Email provider，演示站关闭 Confirm email 或配置自定义 SMTP。没有这一步，代码不能绕过 Supabase 发信限制，不能宣称线上真实注册已恢复。已有未验证账号要检查状态。没有添加公开可写演示账号，也没有使用 service_role。

## P1：性能、体积、计数

- `public-data.ts`：Next Data Cache 保存匿名快照 60 秒，缓存键隔离数据库；`page-data.ts` 在身份校验后才选择缓存。metadata/Page 保留请求内 React cache。登录用户直读数据库，缓存中没有 JWT、收藏或私人草稿。
- API 的站内写操作用 `revalidateTag(tag, {expire:0})` 立即失效，包括发布、转草稿、删除、评论、资料与互动。保留 private HTTP 响应；不直接为包含登录信息的 HTML 加 public/s-maxage。
- 本地生产服务 trace：文章冷读 1 快照 / 6 次有界查询 / 1 正文；相同匿名文章再次访问 0 次查询。原有生命周期测试验证了发布、删除、阅读量等写后可见性。冷读仍是 6 次查询，合并 RPC 尚未做；此轮不要求新增 SQL 迁移。
- 报告的 416 KB 不是浏览器实测首屏：它包含现代浏览器不下载的 noModule polyfill，而且部分资源大小为原始字节。Next 16 默认已支持 Chrome/Edge/Firefox 111、Safari 16.4；不通过重设 browserslist 或删除框架脚本假造缩包。
- 测量脚本保留含 polyfill 的原有 <800 KB / gzip <260 KB 预算，另列现代浏览器数字。它不是 LCP，也不包括图片和 HTML/RSC。3 个 CSS 的合并、进一步拆分页面入口暂未实施。
- 匿名 view 返回 `{success:true,counted:false,reason:'anonymous'}`；保留既有安全约束：匿名不开放阅读 RPC，登录后按天去重。登录请求返回 `counting: 'signed_in_daily_deduplicated'`，不声称每次都加一。

优化前实测（同一台机器、匿名 Node fetch，5 个 warm 样本；API 另做 20 并发；不是浏览器 LCP）：

| 指标 | 优化前 |
| --- | ---: |
| /community TTFB p50 | 1171 ms |
| /discover TTFB p50 | 1171 ms |
| 文章 TTFB p50 | 1180 ms |
| /api/community TTFB p50 | 1094 ms |
| API 20 并发 p95 | 5297 ms |

用 `node scripts/measure-public.mjs after` 复测。详细结果保存在忽略的 `test-results/public-perf-*.json`；远程延迟受路由、冷启动和 Netlify 缓存适配器影响，不能只凭本地结果承诺 p50 <500 ms。

本地生产产物对比（字节，gzip 按资源分别压缩求和；不冒充实际网络传输）：

| 指标 | 修改前 | 修改后 |
| --- | ---: | ---: |
| 首页 JS/CSS 原始，含兼容脚本 | 764855 | 765185 |
| 首页 JS/CSS gzip，含兼容脚本 | 228833 | 228948 |
| 现代浏览器 JS/CSS gzip，排除 noModule | 189206 | 189321 |
| 匿名文章热读查询次数 | 6 | 0 |

体积略增来自可访问性目标/skip link 与错误页；没有宣称本轮实现缩包。

## P2：接口与安全头

- 不合法/`null`/非 HTTP(S) Origin 返回 403。
- 缺失 action、坏 UUID 及其他 Zod 默认消息统一提供中文 400；保持原有输入强度。
- `next.config.ts` 增加 CSP（frame-ancestors/base-uri/form-action）与 Permissions-Policy（禁 camera/microphone/geolocation）。没有限制现有主题内联脚本。

## P3：收尾与待办

- 登录错误 401；`/index` 永久 301 到根路径。Netlify 的 Proxy/配置重定向顺序与本地不同，因此 Proxy 同样显式处理该旧 URL。
- 根 layout 添加键盘 skip link，所有页面 main 提供对应焦点目标；账号提交按钮的 busy 状态也有名称。
- `proxy.ts` 对不存在的页面路径做轻量语法校验，内部重写到框架的 `/_not-found`（保持 404 与原 URL），使用原有的静态 404 设计；此版本 Next 的运行期 notFound 恢复会返回空 SSR body。测试从 body 删除所有 script 后再检查，不能把 RSC 中的字符串当成 SSR 正文。Proxy 不读数据库；合法 UUID 对应的不存在文章/用户仍由页面校验返回 404，这类运行期缺失内容的无 JS 回退仍受框架限制。
- HTTP/2 协商属于托管边缘/客户端路径问题，需要真实浏览器 Network 协议列复核；没有通过源码假装修复平台协议。
- 成功登录也占认证尝试额度仍保留，计数含义是每邮箱 15 分钟最多 12 次认证请求。没有增加匿名重置 RPC（否则可绕过防爆破）；改为仅失败计数需要单独设计可信的跨实例成功结算。

## 验证

`npm run typecheck`、`npm run build`、`npm run lint` 已通过；`npm run test:local` **21/21 通过**。部署后 `npm test`。本地测试与云端只读测试均包含新的模拟 Auth 用例。真正的云端注册、退出与跨账号写入仍由维护者使用自己的两个账号验收。
