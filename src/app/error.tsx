"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" tabIndex={-1} className="not-found">
      <span className="eyebrow">LET’S TRY THAT AGAIN</span>
      <h1>内容暂时没有加载成功</h1>
      <p>
        请检查网络连接后重试；首次配置 Supabase 时，请确认初始化 SQL 已执行。
      </p>
      <button className="button primary" onClick={reset}>
        重新加载
      </button>
    </main>
  );
}
