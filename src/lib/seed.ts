import type { Article, Category, Profile } from "./types";

export const authors: Profile[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "林间有风",
    bio: "前端工程师 · 把复杂的问题，写成简单的答案。",
    color: "#d6e9d9",
    role: "前端工程师",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "代码漫游者",
    bio: "全栈开发者，热爱开源与构建。",
    color: "#e5ddf7",
    role: "全栈开发者",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "陈一舟",
    bio: "在 AI 与工程的交叉点，记录探索的过程。",
    color: "#f5dfcd",
    role: "AI 应用工程师",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "苏木",
    bio: "后端工程师，关注系统的可靠性和可维护性。",
    color: "#cfe5ef",
    role: "后端工程师",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    name: "小鹿同学",
    bio: "Python 爱好者，让工具替我们处理重复劳动。",
    color: "#f5e8bb",
    role: "独立开发者",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    name: "无声的代码",
    bio: "数据库与架构，分享来自工程实践的思考。",
    color: "#d7dff7",
    role: "架构师",
    created_at: "2026-08-01T00:00:00Z",
  },
];

type Topic = {
  title: string;
  excerpt: string;
  category: Category;
  tags: string[];
  cover: string;
  author: number;
  heading: string;
  explanation: string;
  code: string;
  language: string;
  pitfall: string;
  practice: string;
};
const topics: Topic[] = [
  {
    title: "React 的心智模型：从「写组件」到「理解渲染」",
    excerpt:
      "重新认识 render、状态与副作用。用几个简单的例子，拆开 React 渲染机制背后的逻辑，让每一次更新都有迹可循。",
    category: "frontend",
    tags: ["React", "前端进阶"],
    cover: "react",
    author: 0,
    heading: "渲染是一张状态的快照",
    explanation:
      "组件每次执行都会得到当前状态的快照。事件处理函数闭包捕获的，也是这一次渲染中的值。理解这一点，就能解释为什么定时器里读取到的状态有时不是最新值。渲染应保持纯粹：相同的 props 与 state 应产生相同的界面描述。",
    language: "tsx",
    code: "function Counter() {\n  const [count, setCount] = useState(0);\n\n  function incrementTwice() {\n    setCount(current => current + 1);\n    setCount(current => current + 1);\n  }\n\n  return <button onClick={incrementTwice}>{count}</button>;\n}",
    pitfall:
      "连续两次 setCount(count + 1) 使用同一个快照，因此不能表达“在上一次结果上再加一”。当新状态依赖旧状态时，应使用函数式更新。",
    practice:
      "把可以直接从 props 或 state 计算的值留在渲染过程中。只有需要与外部系统同步时，才考虑 Effect；用户点击触发的动作通常适合放在事件处理函数中。",
  },
  {
    title: "从零构建 RAG：让大模型真正读懂你的知识库",
    excerpt:
      "从文档切分、向量检索到答案生成，带你走通 RAG 的完整链路，以及那些容易被忽略的工程细节。",
    category: "ai",
    tags: ["RAG", "大语言模型"],
    cover: "ai",
    author: 2,
    heading: "先检索，再生成",
    explanation:
      "RAG 把外部知识作为上下文提供给模型。关键不是一次塞入更多文字，而是在有限上下文里选择有用且可追溯的片段。每个片段都应该保留来源、标题和更新时间，以便回答附带可验证的引用。",
    language: "python",
    code: 'def answer(question, index, llm):\n    candidates = index.search(question, top_k=12)\n    passages = rerank(question, candidates)[:4]\n    context = "\\n\\n".join(p.text for p in passages)\n    return llm.generate(\n        question=question, context=context,\n        instruction="仅依据上下文回答；证据不足时说明。"\n    )',
    pitfall:
      "切分过小会丢失语义，切分过大会降低检索精度。不要只凭几个“回答看起来正确”的例子来判断效果，应把检索召回与回答正确率分开评估。",
    practice:
      "准备二十个真实问题并标注对应文档。先观察目标片段是否进入检索候选，再优化重排与提示词。文档更新时，应同步清理旧片段与旧向量。",
  },
  {
    title: "TypeScript 类型体操之外：写出更可靠的业务代码",
    excerpt:
      "类型的价值不在于复杂，而在于减少不可能的状态。聊聊联合类型、类型收窄与边界验证在真实项目里的应用。",
    category: "frontend",
    tags: ["TypeScript", "工程实践"],
    cover: "typescript",
    author: 1,
    heading: "让状态自己说明含义",
    explanation:
      "多个布尔值组合常常产生无效状态，例如 loading 与 success 同时为真。可辨识联合类型把合法状态直接表达在类型里，让编译器帮助我们检查遗漏的分支。",
    language: "typescript",
    code: 'type RequestState<T> =\n  | { status: "idle" }\n  | { status: "loading" }\n  | { status: "success"; data: T }\n  | { status: "error"; message: string };\n\nfunction render(state: RequestState<string>) {\n  if (state.status === "success") return state.data;\n  if (state.status === "error") return state.message;\n  return "等待结果";\n}',
    pitfall:
      "as 断言不会执行运行时校验。服务端返回的 JSON 应当视为 unknown，通过 Zod 等校验工具解析后再进入业务层。",
    practice:
      "先重构一个状态复杂的请求组件，删除互相重叠的布尔值。类型设计应帮助团队理解业务，而不是给每一个简单对象套上复杂的泛型。",
  },
  {
    title: "Next.js App Router 实战：把服务端组件用在对的地方",
    excerpt:
      "服务端组件与客户端组件如何划分？从数据获取到交互边界，梳理一个可维护的全栈应用应该怎样组织。",
    category: "frontend",
    tags: ["Next.js", "React"],
    cover: "next",
    author: 1,
    heading: "把交互边界放小一点",
    explanation:
      "服务端组件可以在服务端读取数据，并将可序列化的结果交给客户端组件。按钮和输入框需要客户端状态，而展示性的文章正文通常不需要。明确边界后可以减少发送到浏览器的 JavaScript。",
    language: "tsx",
    code: '// app/posts/page.tsx — Server Component\nexport default async function PostsPage() {\n  const posts = await db.posts.findMany();\n  return <PostList posts={posts} />;\n}\n\n// LikeButton.tsx — Client Component\n"use client";\nexport function LikeButton() {\n  const [liked, setLiked] = useState(false);\n  return <button onClick={() => setLiked(!liked)}>赞</button>;\n}',
    pitfall:
      "不要在客户端组件中导入数据库客户端或私钥模块。缓存策略也应根据数据是否包含用户信息来选择，私有数据不能进入共享缓存。",
    practice:
      "从页面顶部开始标出服务端与客户端边界。将搜索框、收藏按钮等交互拆成小组件，保持数据访问集中且有明确的授权检查。",
  },
  {
    title: "少写一点 CSS，多理解一点布局",
    excerpt:
      "从 Grid、Flex 到容器查询，不靠魔法数字，也能写出适应不同屏幕的稳定布局。",
    category: "frontend",
    tags: ["CSS", "响应式"],
    cover: "css",
    author: 0,
    heading: "让内容决定布局",
    explanation:
      "固定宽度和大量断点往往在真实内容里失效。Grid 的 minmax 与 auto-fit 能让卡片根据可用空间自动排列；Flex 的 min-width: 0 则解决文本把布局撑开的常见问题。",
    language: "css",
    code: ".cards {\n  display: grid;\n  grid-template-columns: repeat(\n    auto-fit, minmax(min(100%, 260px), 1fr)\n  );\n  gap: 24px;\n}\n.card { min-width: 0; }\n.card img { width: 100%; aspect-ratio: 16 / 9; }",
    pitfall:
      "overflow: hidden 可以掩盖横向溢出，但不一定解决根因。检查长 URL、代码块和 flex 子项的最小宽度，通常比给整个页面裁切更有效。",
    practice:
      "用 360、768、1280 三种宽度检查内容，再用特别长的标题与标签做压力测试。布局稳定之后，再微调留白与字体比例。",
  },
  {
    title: "AI Agent 不是一个循环：聊聊工具调用与执行边界",
    excerpt:
      "一个可靠的 Agent，需要的不只是提示词。状态、工具协议、重试和权限，才是从 Demo 走向产品的关键。",
    category: "ai",
    tags: ["AI Agent", "工程实践"],
    cover: "agent",
    author: 2,
    heading: "先定义工具的契约",
    explanation:
      "模型负责选择工具与构造参数，执行层负责验证参数、检查权限并记录结果。二者之间的边界需要明确。对外部有副作用的操作应当有幂等键，避免网络重试造成重复执行。",
    language: "typescript",
    code: 'const tool = {\n  name: "search_documents",\n  async execute(input: unknown, actor: User) {\n    const { query } = SearchSchema.parse(input);\n    await authorize(actor, "documents:read");\n    return search(query, { tenantId: actor.tenantId });\n  }\n};',
    pitfall:
      "工具返回的文档可能包含不可信指令。将其当作数据而非系统指令，并对最大步骤数、预算和超时时间设置限制。",
    practice:
      "先用确定性的工作流实现主要路径，再在需要灵活选择的节点引入模型。记录每次调用的参数、耗时和失败原因，方便复盘。",
  },
  {
    title: "Spring Boot 接口设计：从能跑到值得维护",
    excerpt:
      "统一错误结构、参数校验与领域边界。把这些基础做好，团队就能少花很多时间排查接口问题。",
    category: "java",
    tags: ["Java", "Spring Boot"],
    cover: "java",
    author: 3,
    heading: "明确输入边界与错误语义",
    explanation:
      "Controller 应负责协议层的工作：解析请求、校验参数、转交业务服务并组织响应。业务规则应留在 Service 或领域对象中，避免控制器变成所有逻辑的汇合点。",
    language: "java",
    code: 'public record CreateArticleRequest(\n    @NotBlank @Size(max = 120) String title,\n    @NotBlank String content\n) {}\n\n@PostMapping("/articles")\npublic ArticleResponse create(\n    @Valid @RequestBody CreateArticleRequest request\n) {\n    return articleService.create(request);\n}',
    pitfall:
      "HTTP 200 并不适合包装所有错误。验证失败用 400，未认证用 401，权限不足用 403，资源不存在用 404，能让调用方可靠地区分失败类型。",
    practice:
      "先为接口定义稳定的错误码与响应结构，记录 requestId。日志保留诊断信息，返回给用户的信息则应避免泄露数据库与内部实现。",
  },
  {
    title: "Python 异步编程：并发很简单，控制并发才是重点",
    excerpt:
      "asyncio、任务取消与信号量。用一个小型采集器，理解如何写出不会压垮下游的异步程序。",
    category: "python",
    tags: ["Python", "asyncio"],
    cover: "python",
    author: 4,
    heading: "限制同时在途的请求",
    explanation:
      "asyncio 适合 I/O 密集型任务，但不意味着创建越多任务就越快。数据库连接数、服务限流与内存都会成为瓶颈。信号量可以限制同时进入临界区的任务数量。",
    language: "python",
    code: "import asyncio\n\nasync def fetch_all(urls, client):\n    semaphore = asyncio.Semaphore(5)\n\n    async def fetch(url):\n        async with semaphore:\n            async with asyncio.timeout(10):\n                return await client.get(url)\n\n    return await asyncio.gather(*(fetch(u) for u in urls))",
    pitfall:
      "在异步函数中调用同步阻塞操作，会阻塞整个事件循环。CPU 密集型工作需要考虑进程池；阻塞 I/O 可以用 asyncio.to_thread 隔离。",
    practice:
      "给每个外部请求设置超时，并明确一项失败是否应取消其他任务。用目标服务的实际限流约束来确定并发上限，而不是随意调大数字。",
  },
  {
    title: "PostgreSQL 索引不是越多越好：一次慢查询优化记录",
    excerpt:
      "从 EXPLAIN ANALYZE 出发，理解联合索引、回表和排序成本，让优化建立在证据上。",
    category: "database",
    tags: ["PostgreSQL", "性能优化"],
    cover: "database",
    author: 5,
    heading: "先看执行计划，再决定索引",
    explanation:
      "索引是否有效取决于查询条件、数据分布和返回比例。先收集查询的实际执行时间与扫描行数，区分数据库读取慢与应用处理慢。联合索引的列顺序也应围绕真实查询设计。",
    language: "sql",
    code: "EXPLAIN (ANALYZE, BUFFERS)\nSELECT id, title, created_at\nFROM articles\nWHERE author_id = $1 AND status = 'published'\nORDER BY created_at DESC\nLIMIT 20;\n\nCREATE INDEX articles_author_published_idx\nON articles (author_id, created_at DESC)\nWHERE status = 'published';",
    pitfall:
      "索引会占用空间并增加写入成本。低选择性条件未必适合单列索引，执行计划也可能随着表增长和统计信息变化而变化。",
    practice:
      "用接近生产的数据量测试优化前后的计划。记录扫描行数与 buffer 命中率，确认收益后再上线，定期清理重复或长期未使用的索引。",
  },
  {
    title: "把 Git 用顺手：从小提交到可读的团队协作",
    excerpt:
      "提交历史也是工程文档。分享一套实用的分支、审查与冲突处理习惯，让协作更轻松。",
    category: "tools",
    tags: ["Git", "开发效率"],
    cover: "git",
    author: 1,
    heading: "一次提交表达一个完整意图",
    explanation:
      "小提交不是机械地减少行数，而是让一个改动可以独立理解与回滚。把重命名、格式化和业务变更分开，会显著降低审查成本。提交说明应描述为什么改变，而不只是复述文件名。",
    language: "bash",
    code: 'git status --short\ngit diff\ngit add -p\ngit diff --cached\ngit commit -m "fix: prevent duplicate bookmark creation"\n\n# 查看某个函数附近的变更历史\ngit log -p -- src/bookmarks.ts',
    pitfall:
      "不要在共享分支上随意改写历史。解决冲突后应重新运行相关检查，因为每一侧单独正确的代码，组合后也可能引入新的问题。",
    practice:
      "开 PR 前从头阅读一次自己的 diff。删除调试日志，补上行为改变的说明，并为审查者提供可以复现的验证步骤。",
  },
  {
    title: "设计一个不会重复扣款的接口：幂等性入门",
    excerpt:
      "网络不可靠，重试却很常见。用幂等键、事务和唯一约束，理解可靠写入的基本设计。",
    category: "architecture",
    tags: ["系统设计", "后端"],
    cover: "architecture",
    author: 5,
    heading: "让重试成为安全操作",
    explanation:
      "客户端没有收到成功响应，并不能证明服务端没有完成操作。幂等性让同一个业务请求可以被重复提交，而不产生重复副作用。幂等键应由业务意图确定，并与请求参数一起校验。",
    language: "sql",
    code: "BEGIN;\nINSERT INTO idempotency_keys (key, request_hash)\nVALUES ($1, $2)\nON CONFLICT (key) DO NOTHING;\n\n-- 已存在时读取此前结果；参数不同则拒绝复用\n-- 首次执行时，在同一事务中写入业务记录与结果\nCOMMIT;",
    pitfall:
      "先查询再插入存在并发竞争，数据库唯一约束才是最后的防线。外部支付服务不在本地事务中，需要用提供方幂等键或可靠事件机制补足边界。",
    practice:
      "测试同一个请求并发发送十次，以及服务端完成后响应丢失的场景。给幂等记录设定合理保留时间，并记录可供重放的执行结果。",
  },
  {
    title: "构建自己的命令行工具：把重复工作交给脚本",
    excerpt:
      "用 Node.js 做一个实用的项目检查器，从参数解析、退出码到友好的终端输出。",
    category: "tools",
    tags: ["Node.js", "CLI"],
    cover: "terminal",
    author: 4,
    heading: "先做好输入输出约定",
    explanation:
      "CLI 的用户既可能是开发者，也可能是自动化流水线。普通结果输出到 stdout，错误和诊断信息输出到 stderr，并通过退出码表达是否成功。这样工具才能自然地组合进脚本。",
    language: "javascript",
    code: 'import { parseArgs } from "node:util";\nimport { readFile } from "node:fs/promises";\n\nconst { values } = parseArgs({\n  options: { file: { type: "string", short: "f" } }\n});\ntry {\n  const text = await readFile(values.file ?? "package.json", "utf8");\n  console.log(JSON.stringify(JSON.parse(text), null, 2));\n} catch (error) {\n  console.error("无法读取有效的 JSON 文件");\n  process.exitCode = 1;\n}',
    pitfall:
      "不要把参数直接拼接进 shell 命令，也不要在日志中输出凭据。对会覆盖或删除文件的命令，提供明确的目标检查与 dry-run 选项。",
    practice:
      "选一个每天重复三次的小任务，先做最小工具。补上 --help 与清晰的错误提示，然后把它放进团队能发现的脚本入口。",
  },
  {
    title: "大模型应用的评估：不要只凭「感觉还不错」",
    excerpt: "从测试集到回归评估，为 AI 产品建立一条可持续迭代的质量基线。",
    category: "ai",
    tags: ["LLM", "评估"],
    cover: "ai",
    author: 2,
    heading: "从失败案例建立数据集",
    explanation:
      "评估不是上线前的一次验收，而是开发过程的一部分。每遇到一个有代表性的失败，就把它变成可重复执行的案例，并记录期望行为。知识问答、工具调用和结构化输出应该使用不同维度的指标。",
    language: "python",
    code: 'cases = load_cases("evals.jsonl")\nresults = []\nfor case in cases:\n    output = run_application(case["input"])\n    results.append({\n        "id": case["id"],\n        "valid": validate_schema(output),\n        "score": grade(output, case["rubric"]),\n    })\nprint(summarize(results))',
    pitfall:
      "仅使用模型作为评委可能把风格偏好误当作事实正确性。格式、引用存在性与工具参数等可确定检查，应优先使用代码验证。",
    practice:
      "先准备覆盖常见问题、边界情况和对抗输入的小型数据集。每次更改提示词、模型或检索策略后运行回归，比较质量、延迟和成本。",
  },
  {
    title: "Java 虚拟线程：更轻的线程，不等于更少的资源限制",
    excerpt: "理解虚拟线程的适用场景，以及连接池、超时与背压为何依然不可缺少。",
    category: "java",
    tags: ["Java", "并发"],
    cover: "java",
    author: 3,
    heading: "线程成本与下游容量是两件事",
    explanation:
      "虚拟线程可以让阻塞式 I/O 代码拥有较低的线程管理成本，但数据库连接数和第三方接口配额不会随之增加。应用需要继续限制对稀缺资源的并发访问。",
    language: "java",
    code: "try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    var future = executor.submit(() -> {\n        // 使用设置了连接与读取超时的 HTTP 客户端\n        return client.send(request, BodyHandlers.ofString());\n    });\n    var response = future.get(5, TimeUnit.SECONDS);\n    System.out.println(response.statusCode());\n}",
    pitfall:
      "不要用无限任务队列代替容量规划。CPU 密集型任务不会因为线程更轻而自动提速，监控指标应该包含在途请求、连接等待和超时率。",
    practice:
      "先在 I/O 密集型接口上做基准测试，对比相同负载下的吞吐、尾延迟和内存，再决定是否迁移。",
  },
  {
    title: "Redis 缓存的正确打开方式：一致性与失效策略",
    excerpt: "缓存命中只是开始。谈谈缓存穿透、击穿与数据更新时容易踩到的坑。",
    category: "backend",
    tags: ["Redis", "缓存"],
    cover: "database",
    author: 3,
    heading: "先定义能接受多旧的数据",
    explanation:
      "缓存策略取决于业务的一致性要求。文章列表可以接受短暂延迟，余额和库存则需要更严格的处理。明确允许的过期窗口后，再决定 TTL、主动失效和回源策略。",
    language: "typescript",
    code: "async function getArticle(id: string) {\n  const key = `article:${id}`;\n  const cached = await redis.get(key);\n  if (cached) return JSON.parse(cached);\n\n  const article = await database.findArticle(id);\n  if (article) {\n    await redis.set(key, JSON.stringify(article), { EX: 60 });\n  }\n  return article;\n}",
    pitfall:
      "数据库更新后删除缓存也有竞争窗口。对强一致性的关键读路径，不能仅依靠 TTL；要明确读写协议，并测试并发与失败恢复。",
    practice:
      "缓存应有命中率、回源耗时和错误率指标。TTL 添加适量随机扰动可减少集中失效，热点数据则应配合请求合并与容量保护。",
  },
  {
    title: "用 Python 数据类，让数据处理流水线更清楚",
    excerpt:
      "从散落的字典到明确的数据模型，用 dataclass 表达约束，降低跨步骤传递数据的成本。",
    category: "python",
    tags: ["Python", "数据工程"],
    cover: "python",
    author: 4,
    heading: "用模型表达数据的形状",
    explanation:
      "当字典在多个函数之间流动时，拼错键名和隐含默认值很容易造成问题。数据类把字段、默认值和不可变性放在同一个位置，类型检查器与编辑器都能提供帮助。",
    language: "python",
    code: 'from dataclasses import dataclass\nfrom decimal import Decimal\n\n@dataclass(frozen=True)\nclass Order:\n    id: str\n    amount: Decimal\n    currency: str = "CNY"\n\ndef format_order(order: Order) -> str:\n    return f"{order.id}: {order.amount} {order.currency}"',
    pitfall:
      "类型注解本身不验证运行时输入。外部 JSON 应在边界进行解析和验证，金额等字段也应选择合适的精确类型。",
    practice:
      "从一个经常出错的字典结构开始替换。保持模型简单，把校验放在输入边界，避免在每一个处理步骤里重复转换数据。",
  },
  {
    title: "前端性能优化，从一张瀑布图开始",
    excerpt:
      "先测量，再优化。通过资源加载瀑布图找到真正的阻塞点，让页面更快地呈现重要内容。",
    category: "frontend",
    tags: ["性能优化", "Web"],
    cover: "css",
    author: 0,
    heading: "找出关键路径上的等待",
    explanation:
      "性能问题常来自资源之间的依赖链，而不只是某个文件太大。先观察 HTML、关键 CSS、字体和首屏图片的发起时间，确认用户何时能看到主要内容、何时能完成交互。",
    language: "html",
    code: '<!-- 为首屏关键图片保留尺寸，避免布局偏移 -->\n<img\n  src="/hero.webp"\n  width="1200"\n  height="630"\n  fetchpriority="high"\n  alt="文章封面"\n/>\n<!-- 非首屏图片延迟加载 -->\n<img src="/secondary.webp" loading="lazy" alt="示意图" />',
    pitfall:
      "对所有资源添加 preload 会争抢带宽。性能指标也需要结合真实设备与网络条件，而不能只观察开发机上的一次跑分。",
    practice:
      "记录优化前后的 LCP、INP 和 CLS，保持测试条件一致。每次只调整一个主要因素，确认收益来自哪一项变化。",
  },
  {
    title: "从单体到模块化：小团队也能做好的架构设计",
    excerpt:
      "在拆微服务之前，先把模块边界和依赖方向理清楚。好的架构，应当让下一次改动更容易。",
    category: "architecture",
    tags: ["架构设计", "模块化"],
    cover: "architecture",
    author: 5,
    heading: "边界比部署单元更重要",
    explanation:
      "模块化单体让团队先在同一个部署单元里建立清晰边界。每个模块拥有自己的业务概念与公开接口，其他模块不应直接修改其内部数据。这样能够减少协作成本，也为未来拆分保留选择。",
    language: "typescript",
    code: "// billing/public.ts：模块对外的接口\nexport interface BillingService {\n  createInvoice(orderId: string): Promise<Invoice>;\n}\n\n// orders/application.ts：依赖接口而非实现细节\nexport async function completeOrder(\n  order: Order, billing: BillingService\n) {\n  await order.complete();\n  return billing.createInvoice(order.id);\n}",
    pitfall:
      "仅把文件放进不同目录并不等于模块化。如果模块仍通过共享表、内部函数和循环导入紧密耦合，拆分部署只会把问题转移到网络上。",
    practice:
      "从变化频率与业务归属识别边界，优先隔离权限、账单等概念稳定的能力。用依赖检查和代码审查守住模块接口。",
  },
];

export const seedArticles: Article[] = topics.map((t, i) => ({
  id: `20000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  author_id: authors[t.author].id,
  title: t.title,
  excerpt: t.excerpt,
  category: t.category,
  tags: t.tags,
  cover: t.cover,
  status: "published",
  views: 160 + ((i * 173 + 1138) % 5100),
  seed_likes: 18 + ((i * 31 + 68) % 210),
  created_at: new Date(
    Date.UTC(2026, 9, 22 - Math.floor(i / 3), 3 - (i % 3)),
  ).toISOString(),
  updated_at: new Date(
    Date.UTC(2026, 9, 22 - Math.floor(i / 3), 3 - (i % 3)),
  ).toISOString(),
  content: `> ${t.excerpt}\n\n## ${t.heading}\n\n${t.explanation}\n\n理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。\n\n## 用代码理解这个过程\n\n\`\`\`${t.language}\n${t.code}\n\`\`\`\n\n阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。\n\n## 容易忽略的边界\n\n${t.pitfall}\n\n| 检查项 | 应关注的问题 |\n| --- | --- |\n| 正常路径 | 输入有效时，是否得到预期结果？ |\n| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |\n| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |\n\n## 在实际项目中应用\n\n${t.practice}\n\n- 先建立可重复的最小示例，再调整复杂的业务实现。\n- 把问题的现象、原因和验证结果一起记录下来。\n- 让代码审查关注行为变化，而不仅仅是代码风格。\n\n## 写在最后\n\n技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。`,
}));
