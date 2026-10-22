-- Generated sample content. Historical views/likes are demonstration seed metrics.
-- Safe to rerun: existing records are retained.
begin;
insert into public.profiles (id,name,bio,color,role,created_at) values ('10000000-0000-4000-8000-000000000001','林间有风','前端工程师 · 把复杂的问题，写成简单的答案。','#d6e9d9','前端工程师','2026-08-01T00:00:00Z') on conflict(id) do nothing;
insert into public.profiles (id,name,bio,color,role,created_at) values ('10000000-0000-4000-8000-000000000002','代码漫游者','全栈开发者，热爱开源与构建。','#e5ddf7','全栈开发者','2026-08-01T00:00:00Z') on conflict(id) do nothing;
insert into public.profiles (id,name,bio,color,role,created_at) values ('10000000-0000-4000-8000-000000000003','陈一舟','在 AI 与工程的交叉点，记录探索的过程。','#f5dfcd','AI 应用工程师','2026-08-01T00:00:00Z') on conflict(id) do nothing;
insert into public.profiles (id,name,bio,color,role,created_at) values ('10000000-0000-4000-8000-000000000004','苏木','后端工程师，关注系统的可靠性和可维护性。','#cfe5ef','后端工程师','2026-08-01T00:00:00Z') on conflict(id) do nothing;
insert into public.profiles (id,name,bio,color,role,created_at) values ('10000000-0000-4000-8000-000000000005','小鹿同学','Python 爱好者，让工具替我们处理重复劳动。','#f5e8bb','独立开发者','2026-08-01T00:00:00Z') on conflict(id) do nothing;
insert into public.profiles (id,name,bio,color,role,created_at) values ('10000000-0000-4000-8000-000000000006','无声的代码','数据库与架构，分享来自工程实践的思考。','#d7dff7','架构师','2026-08-01T00:00:00Z') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','React 的心智模型：从「写组件」到「理解渲染」','重新认识 render、状态与副作用。用几个简单的例子，拆开 React 渲染机制背后的逻辑，让每一次更新都有迹可循。','frontend',ARRAY['React','前端进阶']::text[],'react','published',1298,86,'2026-10-22T03:00:00.000Z','2026-10-22T03:00:00.000Z','> 重新认识 render、状态与副作用。用几个简单的例子，拆开 React 渲染机制背后的逻辑，让每一次更新都有迹可循。

## 渲染是一张状态的快照

组件每次执行都会得到当前状态的快照。事件处理函数闭包捕获的，也是这一次渲染中的值。理解这一点，就能解释为什么定时器里读取到的状态有时不是最新值。渲染应保持纯粹：相同的 props 与 state 应产生相同的界面描述。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  function incrementTwice() {
    setCount(current => current + 1);
    setCount(current => current + 1);
  }

  return <button onClick={incrementTwice}>{count}</button>;
}
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

连续两次 setCount(count + 1) 使用同一个快照，因此不能表达“在上一次结果上再加一”。当新状态依赖旧状态时，应使用函数式更新。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

把可以直接从 props 或 state 计算的值留在渲染过程中。只有需要与外部系统同步时，才考虑 Effect；用户点击触发的动作通常适合放在事件处理函数中。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','从零构建 RAG：让大模型真正读懂你的知识库','从文档切分、向量检索到答案生成，带你走通 RAG 的完整链路，以及那些容易被忽略的工程细节。','ai',ARRAY['RAG','大语言模型']::text[],'ai','published',1471,117,'2026-10-22T02:00:00.000Z','2026-10-22T02:00:00.000Z','> 从文档切分、向量检索到答案生成，带你走通 RAG 的完整链路，以及那些容易被忽略的工程细节。

## 先检索，再生成

RAG 把外部知识作为上下文提供给模型。关键不是一次塞入更多文字，而是在有限上下文里选择有用且可追溯的片段。每个片段都应该保留来源、标题和更新时间，以便回答附带可验证的引用。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```python
def answer(question, index, llm):
    candidates = index.search(question, top_k=12)
    passages = rerank(question, candidates)[:4]
    context = "\n\n".join(p.text for p in passages)
    return llm.generate(
        question=question, context=context,
        instruction="仅依据上下文回答；证据不足时说明。"
    )
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

切分过小会丢失语义，切分过大会降低检索精度。不要只凭几个“回答看起来正确”的例子来判断效果，应把检索召回与回答正确率分开评估。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

准备二十个真实问题并标注对应文档。先观察目标片段是否进入检索候选，再优化重排与提示词。文档更新时，应同步清理旧片段与旧向量。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','TypeScript 类型体操之外：写出更可靠的业务代码','类型的价值不在于复杂，而在于减少不可能的状态。聊聊联合类型、类型收窄与边界验证在真实项目里的应用。','frontend',ARRAY['TypeScript','工程实践']::text[],'typescript','published',1644,148,'2026-10-22T01:00:00.000Z','2026-10-22T01:00:00.000Z','> 类型的价值不在于复杂，而在于减少不可能的状态。聊聊联合类型、类型收窄与边界验证在真实项目里的应用。

## 让状态自己说明含义

多个布尔值组合常常产生无效状态，例如 loading 与 success 同时为真。可辨识联合类型把合法状态直接表达在类型里，让编译器帮助我们检查遗漏的分支。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```typescript
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

function render(state: RequestState<string>) {
  if (state.status === "success") return state.data;
  if (state.status === "error") return state.message;
  return "等待结果";
}
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

as 断言不会执行运行时校验。服务端返回的 JSON 应当视为 unknown，通过 Zod 等校验工具解析后再进入业务层。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

先重构一个状态复杂的请求组件，删除互相重叠的布尔值。类型设计应帮助团队理解业务，而不是给每一个简单对象套上复杂的泛型。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','Next.js App Router 实战：把服务端组件用在对的地方','服务端组件与客户端组件如何划分？从数据获取到交互边界，梳理一个可维护的全栈应用应该怎样组织。','frontend',ARRAY['Next.js','React']::text[],'next','published',1817,179,'2026-10-21T03:00:00.000Z','2026-10-21T03:00:00.000Z','> 服务端组件与客户端组件如何划分？从数据获取到交互边界，梳理一个可维护的全栈应用应该怎样组织。

## 把交互边界放小一点

服务端组件可以在服务端读取数据，并将可序列化的结果交给客户端组件。按钮和输入框需要客户端状态，而展示性的文章正文通常不需要。明确边界后可以减少发送到浏览器的 JavaScript。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```tsx
// app/posts/page.tsx — Server Component
export default async function PostsPage() {
  const posts = await db.posts.findMany();
  return <PostList posts={posts} />;
}

// LikeButton.tsx — Client Component
"use client";
export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>赞</button>;
}
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

不要在客户端组件中导入数据库客户端或私钥模块。缓存策略也应根据数据是否包含用户信息来选择，私有数据不能进入共享缓存。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

从页面顶部开始标出服务端与客户端边界。将搜索框、收藏按钮等交互拆成小组件，保持数据访问集中且有明确的授权检查。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','少写一点 CSS，多理解一点布局','从 Grid、Flex 到容器查询，不靠魔法数字，也能写出适应不同屏幕的稳定布局。','frontend',ARRAY['CSS','响应式']::text[],'css','published',1990,210,'2026-10-21T02:00:00.000Z','2026-10-21T02:00:00.000Z','> 从 Grid、Flex 到容器查询，不靠魔法数字，也能写出适应不同屏幕的稳定布局。

## 让内容决定布局

固定宽度和大量断点往往在真实内容里失效。Grid 的 minmax 与 auto-fit 能让卡片根据可用空间自动排列；Flex 的 min-width: 0 则解决文本把布局撑开的常见问题。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```css
.cards {
  display: grid;
  grid-template-columns: repeat(
    auto-fit, minmax(min(100%, 260px), 1fr)
  );
  gap: 24px;
}
.card { min-width: 0; }
.card img { width: 100%; aspect-ratio: 16 / 9; }
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

overflow: hidden 可以掩盖横向溢出，但不一定解决根因。检查长 URL、代码块和 flex 子项的最小宽度，通常比给整个页面裁切更有效。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

用 360、768、1280 三种宽度检查内容，再用特别长的标题与标签做压力测试。布局稳定之后，再微调留白与字体比例。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000003','AI Agent 不是一个循环：聊聊工具调用与执行边界','一个可靠的 Agent，需要的不只是提示词。状态、工具协议、重试和权限，才是从 Demo 走向产品的关键。','ai',ARRAY['AI Agent','工程实践']::text[],'agent','published',2163,31,'2026-10-21T01:00:00.000Z','2026-10-21T01:00:00.000Z','> 一个可靠的 Agent，需要的不只是提示词。状态、工具协议、重试和权限，才是从 Demo 走向产品的关键。

## 先定义工具的契约

模型负责选择工具与构造参数，执行层负责验证参数、检查权限并记录结果。二者之间的边界需要明确。对外部有副作用的操作应当有幂等键，避免网络重试造成重复执行。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```typescript
const tool = {
  name: "search_documents",
  async execute(input: unknown, actor: User) {
    const { query } = SearchSchema.parse(input);
    await authorize(actor, "documents:read");
    return search(query, { tenantId: actor.tenantId });
  }
};
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

工具返回的文档可能包含不可信指令。将其当作数据而非系统指令，并对最大步骤数、预算和超时时间设置限制。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

先用确定性的工作流实现主要路径，再在需要灵活选择的节点引入模型。记录每次调用的参数、耗时和失败原因，方便复盘。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000004','Spring Boot 接口设计：从能跑到值得维护','统一错误结构、参数校验与领域边界。把这些基础做好，团队就能少花很多时间排查接口问题。','java',ARRAY['Java','Spring Boot']::text[],'java','published',2336,62,'2026-10-20T03:00:00.000Z','2026-10-20T03:00:00.000Z','> 统一错误结构、参数校验与领域边界。把这些基础做好，团队就能少花很多时间排查接口问题。

## 明确输入边界与错误语义

Controller 应负责协议层的工作：解析请求、校验参数、转交业务服务并组织响应。业务规则应留在 Service 或领域对象中，避免控制器变成所有逻辑的汇合点。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```java
public record CreateArticleRequest(
    @NotBlank @Size(max = 120) String title,
    @NotBlank String content
) {}

@PostMapping("/articles")
public ArticleResponse create(
    @Valid @RequestBody CreateArticleRequest request
) {
    return articleService.create(request);
}
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

HTTP 200 并不适合包装所有错误。验证失败用 400，未认证用 401，权限不足用 403，资源不存在用 404，能让调用方可靠地区分失败类型。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

先为接口定义稳定的错误码与响应结构，记录 requestId。日志保留诊断信息，返回给用户的信息则应避免泄露数据库与内部实现。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000005','Python 异步编程：并发很简单，控制并发才是重点','asyncio、任务取消与信号量。用一个小型采集器，理解如何写出不会压垮下游的异步程序。','python',ARRAY['Python','asyncio']::text[],'python','published',2509,93,'2026-10-20T02:00:00.000Z','2026-10-20T02:00:00.000Z','> asyncio、任务取消与信号量。用一个小型采集器，理解如何写出不会压垮下游的异步程序。

## 限制同时在途的请求

asyncio 适合 I/O 密集型任务，但不意味着创建越多任务就越快。数据库连接数、服务限流与内存都会成为瓶颈。信号量可以限制同时进入临界区的任务数量。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```python
import asyncio

async def fetch_all(urls, client):
    semaphore = asyncio.Semaphore(5)

    async def fetch(url):
        async with semaphore:
            async with asyncio.timeout(10):
                return await client.get(url)

    return await asyncio.gather(*(fetch(u) for u in urls))
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

在异步函数中调用同步阻塞操作，会阻塞整个事件循环。CPU 密集型工作需要考虑进程池；阻塞 I/O 可以用 asyncio.to_thread 隔离。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

给每个外部请求设置超时，并明确一项失败是否应取消其他任务。用目标服务的实际限流约束来确定并发上限，而不是随意调大数字。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000006','PostgreSQL 索引不是越多越好：一次慢查询优化记录','从 EXPLAIN ANALYZE 出发，理解联合索引、回表和排序成本，让优化建立在证据上。','database',ARRAY['PostgreSQL','性能优化']::text[],'database','published',2682,124,'2026-10-20T01:00:00.000Z','2026-10-20T01:00:00.000Z','> 从 EXPLAIN ANALYZE 出发，理解联合索引、回表和排序成本，让优化建立在证据上。

## 先看执行计划，再决定索引

索引是否有效取决于查询条件、数据分布和返回比例。先收集查询的实际执行时间与扫描行数，区分数据库读取慢与应用处理慢。联合索引的列顺序也应围绕真实查询设计。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, created_at
FROM articles
WHERE author_id = $1 AND status = ''published''
ORDER BY created_at DESC
LIMIT 20;

CREATE INDEX articles_author_published_idx
ON articles (author_id, created_at DESC)
WHERE status = ''published'';
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

索引会占用空间并增加写入成本。低选择性条件未必适合单列索引，执行计划也可能随着表增长和统计信息变化而变化。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

用接近生产的数据量测试优化前后的计划。记录扫描行数与 buffer 命中率，确认收益后再上线，定期清理重复或长期未使用的索引。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000002','把 Git 用顺手：从小提交到可读的团队协作','提交历史也是工程文档。分享一套实用的分支、审查与冲突处理习惯，让协作更轻松。','tools',ARRAY['Git','开发效率']::text[],'git','published',2855,155,'2026-10-19T03:00:00.000Z','2026-10-19T03:00:00.000Z','> 提交历史也是工程文档。分享一套实用的分支、审查与冲突处理习惯，让协作更轻松。

## 一次提交表达一个完整意图

小提交不是机械地减少行数，而是让一个改动可以独立理解与回滚。把重命名、格式化和业务变更分开，会显著降低审查成本。提交说明应描述为什么改变，而不只是复述文件名。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```bash
git status --short
git diff
git add -p
git diff --cached
git commit -m "fix: prevent duplicate bookmark creation"

# 查看某个函数附近的变更历史
git log -p -- src/bookmarks.ts
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

不要在共享分支上随意改写历史。解决冲突后应重新运行相关检查，因为每一侧单独正确的代码，组合后也可能引入新的问题。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

开 PR 前从头阅读一次自己的 diff。删除调试日志，补上行为改变的说明，并为审查者提供可以复现的验证步骤。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000006','设计一个不会重复扣款的接口：幂等性入门','网络不可靠，重试却很常见。用幂等键、事务和唯一约束，理解可靠写入的基本设计。','architecture',ARRAY['系统设计','后端']::text[],'architecture','published',3028,186,'2026-10-19T02:00:00.000Z','2026-10-19T02:00:00.000Z','> 网络不可靠，重试却很常见。用幂等键、事务和唯一约束，理解可靠写入的基本设计。

## 让重试成为安全操作

客户端没有收到成功响应，并不能证明服务端没有完成操作。幂等性让同一个业务请求可以被重复提交，而不产生重复副作用。幂等键应由业务意图确定，并与请求参数一起校验。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```sql
BEGIN;
INSERT INTO idempotency_keys (key, request_hash)
VALUES ($1, $2)
ON CONFLICT (key) DO NOTHING;

-- 已存在时读取此前结果；参数不同则拒绝复用
-- 首次执行时，在同一事务中写入业务记录与结果
COMMIT;
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

先查询再插入存在并发竞争，数据库唯一约束才是最后的防线。外部支付服务不在本地事务中，需要用提供方幂等键或可靠事件机制补足边界。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

测试同一个请求并发发送十次，以及服务端完成后响应丢失的场景。给幂等记录设定合理保留时间，并记录可供重放的执行结果。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000005','构建自己的命令行工具：把重复工作交给脚本','用 Node.js 做一个实用的项目检查器，从参数解析、退出码到友好的终端输出。','tools',ARRAY['Node.js','CLI']::text[],'terminal','published',3201,217,'2026-10-19T01:00:00.000Z','2026-10-19T01:00:00.000Z','> 用 Node.js 做一个实用的项目检查器，从参数解析、退出码到友好的终端输出。

## 先做好输入输出约定

CLI 的用户既可能是开发者，也可能是自动化流水线。普通结果输出到 stdout，错误和诊断信息输出到 stderr，并通过退出码表达是否成功。这样工具才能自然地组合进脚本。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```javascript
import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";

const { values } = parseArgs({
  options: { file: { type: "string", short: "f" } }
});
try {
  const text = await readFile(values.file ?? "package.json", "utf8");
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch (error) {
  console.error("无法读取有效的 JSON 文件");
  process.exitCode = 1;
}
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

不要把参数直接拼接进 shell 命令，也不要在日志中输出凭据。对会覆盖或删除文件的命令，提供明确的目标检查与 dry-run 选项。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

选一个每天重复三次的小任务，先做最小工具。补上 --help 与清晰的错误提示，然后把它放进团队能发现的脚本入口。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000003','大模型应用的评估：不要只凭「感觉还不错」','从测试集到回归评估，为 AI 产品建立一条可持续迭代的质量基线。','ai',ARRAY['LLM','评估']::text[],'ai','published',3374,38,'2026-10-18T03:00:00.000Z','2026-10-18T03:00:00.000Z','> 从测试集到回归评估，为 AI 产品建立一条可持续迭代的质量基线。

## 从失败案例建立数据集

评估不是上线前的一次验收，而是开发过程的一部分。每遇到一个有代表性的失败，就把它变成可重复执行的案例，并记录期望行为。知识问答、工具调用和结构化输出应该使用不同维度的指标。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```python
cases = load_cases("evals.jsonl")
results = []
for case in cases:
    output = run_application(case["input"])
    results.append({
        "id": case["id"],
        "valid": validate_schema(output),
        "score": grade(output, case["rubric"]),
    })
print(summarize(results))
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

仅使用模型作为评委可能把风格偏好误当作事实正确性。格式、引用存在性与工具参数等可确定检查，应优先使用代码验证。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

先准备覆盖常见问题、边界情况和对抗输入的小型数据集。每次更改提示词、模型或检索策略后运行回归，比较质量、延迟和成本。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000014','10000000-0000-4000-8000-000000000004','Java 虚拟线程：更轻的线程，不等于更少的资源限制','理解虚拟线程的适用场景，以及连接池、超时与背压为何依然不可缺少。','java',ARRAY['Java','并发']::text[],'java','published',3547,69,'2026-10-18T02:00:00.000Z','2026-10-18T02:00:00.000Z','> 理解虚拟线程的适用场景，以及连接池、超时与背压为何依然不可缺少。

## 线程成本与下游容量是两件事

虚拟线程可以让阻塞式 I/O 代码拥有较低的线程管理成本，但数据库连接数和第三方接口配额不会随之增加。应用需要继续限制对稀缺资源的并发访问。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var future = executor.submit(() -> {
        // 使用设置了连接与读取超时的 HTTP 客户端
        return client.send(request, BodyHandlers.ofString());
    });
    var response = future.get(5, TimeUnit.SECONDS);
    System.out.println(response.statusCode());
}
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

不要用无限任务队列代替容量规划。CPU 密集型任务不会因为线程更轻而自动提速，监控指标应该包含在途请求、连接等待和超时率。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

先在 I/O 密集型接口上做基准测试，对比相同负载下的吞吐、尾延迟和内存，再决定是否迁移。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000015','10000000-0000-4000-8000-000000000004','Redis 缓存的正确打开方式：一致性与失效策略','缓存命中只是开始。谈谈缓存穿透、击穿与数据更新时容易踩到的坑。','backend',ARRAY['Redis','缓存']::text[],'database','published',3720,100,'2026-10-18T01:00:00.000Z','2026-10-18T01:00:00.000Z','> 缓存命中只是开始。谈谈缓存穿透、击穿与数据更新时容易踩到的坑。

## 先定义能接受多旧的数据

缓存策略取决于业务的一致性要求。文章列表可以接受短暂延迟，余额和库存则需要更严格的处理。明确允许的过期窗口后，再决定 TTL、主动失效和回源策略。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```typescript
async function getArticle(id: string) {
  const key = `article:${id}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const article = await database.findArticle(id);
  if (article) {
    await redis.set(key, JSON.stringify(article), { EX: 60 });
  }
  return article;
}
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

数据库更新后删除缓存也有竞争窗口。对强一致性的关键读路径，不能仅依靠 TTL；要明确读写协议，并测试并发与失败恢复。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

缓存应有命中率、回源耗时和错误率指标。TTL 添加适量随机扰动可减少集中失效，热点数据则应配合请求合并与容量保护。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000016','10000000-0000-4000-8000-000000000005','用 Python 数据类，让数据处理流水线更清楚','从散落的字典到明确的数据模型，用 dataclass 表达约束，降低跨步骤传递数据的成本。','python',ARRAY['Python','数据工程']::text[],'python','published',3893,131,'2026-10-17T03:00:00.000Z','2026-10-17T03:00:00.000Z','> 从散落的字典到明确的数据模型，用 dataclass 表达约束，降低跨步骤传递数据的成本。

## 用模型表达数据的形状

当字典在多个函数之间流动时，拼错键名和隐含默认值很容易造成问题。数据类把字段、默认值和不可变性放在同一个位置，类型检查器与编辑器都能提供帮助。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```python
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class Order:
    id: str
    amount: Decimal
    currency: str = "CNY"

def format_order(order: Order) -> str:
    return f"{order.id}: {order.amount} {order.currency}"
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

类型注解本身不验证运行时输入。外部 JSON 应在边界进行解析和验证，金额等字段也应选择合适的精确类型。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

从一个经常出错的字典结构开始替换。保持模型简单，把校验放在输入边界，避免在每一个处理步骤里重复转换数据。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000017','10000000-0000-4000-8000-000000000001','前端性能优化，从一张瀑布图开始','先测量，再优化。通过资源加载瀑布图找到真正的阻塞点，让页面更快地呈现重要内容。','frontend',ARRAY['性能优化','Web']::text[],'css','published',4066,162,'2026-10-17T02:00:00.000Z','2026-10-17T02:00:00.000Z','> 先测量，再优化。通过资源加载瀑布图找到真正的阻塞点，让页面更快地呈现重要内容。

## 找出关键路径上的等待

性能问题常来自资源之间的依赖链，而不只是某个文件太大。先观察 HTML、关键 CSS、字体和首屏图片的发起时间，确认用户何时能看到主要内容、何时能完成交互。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```html
<!-- 为首屏关键图片保留尺寸，避免布局偏移 -->
<img
  src="/hero.webp"
  width="1200"
  height="630"
  fetchpriority="high"
  alt="文章封面"
/>
<!-- 非首屏图片延迟加载 -->
<img src="/secondary.webp" loading="lazy" alt="示意图" />
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

对所有资源添加 preload 会争抢带宽。性能指标也需要结合真实设备与网络条件，而不能只观察开发机上的一次跑分。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

记录优化前后的 LCP、INP 和 CLS，保持测试条件一致。每次只调整一个主要因素，确认收益来自哪一项变化。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
insert into public.articles (id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,content) values ('20000000-0000-4000-8000-000000000018','10000000-0000-4000-8000-000000000006','从单体到模块化：小团队也能做好的架构设计','在拆微服务之前，先把模块边界和依赖方向理清楚。好的架构，应当让下一次改动更容易。','architecture',ARRAY['架构设计','模块化']::text[],'architecture','published',4239,193,'2026-10-17T01:00:00.000Z','2026-10-17T01:00:00.000Z','> 在拆微服务之前，先把模块边界和依赖方向理清楚。好的架构，应当让下一次改动更容易。

## 边界比部署单元更重要

模块化单体让团队先在同一个部署单元里建立清晰边界。每个模块拥有自己的业务概念与公开接口，其他模块不应直接修改其内部数据。这样能够减少协作成本，也为未来拆分保留选择。

理解原理之后，我们用一个小例子把思路落到代码中。以下代码用于展示核心模式；应用到项目时，还需要结合自己的依赖与上下文。

## 用代码理解这个过程

```typescript
// billing/public.ts：模块对外的接口
export interface BillingService {
  createInvoice(orderId: string): Promise<Invoice>;
}

// orders/application.ts：依赖接口而非实现细节
export async function completeOrder(
  order: Order, billing: BillingService
) {
  await order.complete();
  return billing.createInvoice(order.id);
}
```

阅读代码时，建议先看输入和输出，再关注中间的数据流。明确每一步的职责，比记住某一种语法更重要。

## 容易忽略的边界

仅把文件放进不同目录并不等于模块化。如果模块仍通过共享表、内部函数和循环导入紧密耦合，拆分部署只会把问题转移到网络上。

| 检查项 | 应关注的问题 |
| --- | --- |
| 正常路径 | 输入有效时，是否得到预期结果？ |
| 失败路径 | 依赖失败时，错误是否可理解、可恢复？ |
| 并发与边界 | 重复操作、大输入或慢请求会发生什么？ |

## 在实际项目中应用

从变化频率与业务归属识别边界，优先隔离权限、账单等概念稳定的能力。用依赖检查和代码审查守住模块接口。

- 先建立可重复的最小示例，再调整复杂的业务实现。
- 把问题的现象、原因和验证结果一起记录下来。
- 让代码审查关注行为变化，而不仅仅是代码风格。

## 写在最后

技术选择总是与场景有关。这篇文章提供的是一条理解与验证的路径，真正重要的是把它放回自己的项目，观察它解决了什么问题，又引入了什么成本。欢迎在评论区分享你的实践。') on conflict(id) do nothing;
commit;
