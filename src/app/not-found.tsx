import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="not-found">
      <span className="eyebrow">A LITTLE OFF THE PATH</span>
      <strong>
        404<span>✳</span>
      </strong>
      <h1>灵感还在，页面走丢了。</h1>
      <p>换一条路，也许会遇到新的发现。</p>
      <Link href="/" className="button primary">
        回到 DevFlow ↗
      </Link>
    </main>
  );
}
