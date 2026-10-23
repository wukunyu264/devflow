"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Moon,
  Sun,
  PenLine,
  ChevronDown,
  ArrowUpRight,
  LogOut,
  LayoutDashboard,
  UserRound,
  Bookmark,
  Compass,
  Flame,
  Users,
  Code2,
  Server,
  Sparkles,
  Coffee,
  Terminal,
  Database,
  Wrench,
  Network,
  X,
  Menu,
  ArrowRight,
} from "lucide-react";
import { useCommunity } from "./community-provider";
import { Avatar, Logo } from "./ui";
import { categories } from "@/lib/types";

export function Header() {
  const { data, dark, toggleTheme, act } = useCommunity();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="主导航">
          <Link className={pathname === "/" ? "active" : ""} href="/">
            首页
          </Link>
          <Link
            className={pathname === "/discover" ? "active" : ""}
            href="/discover"
          >
            发现
          </Link>
          <Link
            className={pathname === "/category/ai" ? "active" : ""}
            href="/category/ai"
          >
            AI 专区
            <span className="new-dot" />
          </Link>
        </nav>
        <form
          action="/search"
          method="get"
          className="global-search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(search.trim())}`);
            input.current?.blur();
          }}
        >
          <Search size={17} />
          <input
            name="q"
            ref={input}
            aria-label="搜索文章、标签或作者"
            placeholder="搜索你感兴趣的技术…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>Ctrl K</kbd>
        </form>
        <div className="header-actions">
          <button
            className="icon-button theme-button"
            onClick={toggleTheme}
            aria-label={dark ? "切换浅色模式" : "切换深色模式"}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link className="button primary write-button" href="/write">
            <PenLine size={16} />
            <span>写文章</span>
          </Link>
          {data.user ? (
            <div className="user-menu-wrap">
              <button
                className="user-trigger"
                onClick={() => setMenu(!menu)}
                aria-label="打开账户菜单"
                aria-expanded={menu}
              >
                <Avatar user={data.user} />
                <ChevronDown size={13} />
              </button>
              {menu && (
                <>
                  <button
                    className="menu-dismiss"
                    aria-label="关闭账户菜单"
                    onClick={() => setMenu(false)}
                  />
                  <div className="user-dropdown">
                    <div>
                      <strong>{data.user.name}</strong>
                      <small>今天也有值得分享的灵感</small>
                    </div>
                    <Link href={`/user/${data.user.id}`}>
                      <UserRound size={16} />
                      我的主页
                    </Link>
                    <Link href="/dashboard">
                      <LayoutDashboard size={16} />
                      创作中心
                    </Link>
                    <Link href="/bookmarks">
                      <Bookmark size={16} />
                      我的收藏
                    </Link>
                    <button
                      onClick={async () => {
                        if (await act("logout", {}, "已退出登录")) {
                          setMenu(false);
                          router.push("/");
                        }
                      }}
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link className="login-link" href="/login">
              登录<span> / 注册</span>
            </Link>
          )}
          <button
            className="icon-button mobile-menu-button"
            aria-label="展开导航"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobile && (
        <div className="mobile-menu">
          <Link href="/">首页</Link>
          <Link href="/discover">发现</Link>
          <Link href="/category/ai">AI 专区</Link>
          <Link href="/bookmarks">我的收藏</Link>
          <Link href="/dashboard">创作中心</Link>
          <Link href="/write">写文章</Link>
          {!data.user && <Link href="/login">登录 / 注册</Link>}
        </div>
      )}
    </header>
  );
}
const icons = [
  Code2,
  Server,
  Sparkles,
  Coffee,
  Terminal,
  Database,
  Wrench,
  Network,
];
export function Sidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { data } = useCommunity();
  return (
    <aside className="left-sidebar">
      <div className="sidebar-sticky">
        <div className="nav-group">
          <Link
            className={`side-link ${pathname === "/" && params.get("feed") !== "following" ? "selected" : ""}`}
            href="/"
          >
            <Compass size={19} />
            为你推荐
            <span className="selected-dot" />
          </Link>
          <Link
            className={`side-link ${params.get("feed") === "following" ? "selected" : ""}`}
            href="/?feed=following"
          >
            <Users size={19} />
            我的关注
          </Link>
          <Link
            className={`side-link ${pathname === "/trending" ? "selected" : ""}`}
            href="/trending"
          >
            <Flame size={19} />
            热门文章<span className="hot-mark">HOT</span>
          </Link>
        </div>
        <p className="nav-label">探索技术</p>
        <nav className="category-nav" aria-label="文章分类">
          {categories.map((c, i) => {
            const Icon = icons[i];
            return (
              <Link
                key={c.slug}
                className={`side-link ${pathname === `/category/${c.slug}` ? "selected" : ""}`}
                href={`/category/${c.slug}`}
              >
                <Icon size={18} />
                {c.label}
                {c.slug === "ai" && <span className="tiny-label">NEW</span>}
              </Link>
            );
          })}
        </nav>
        <div className="nav-group personal-nav">
          <Link
            href="/bookmarks"
            className={`side-link ${pathname === "/bookmarks" ? "selected" : ""}`}
          >
            <Bookmark size={18} />
            我的收藏
          </Link>
          <Link
            href="/dashboard"
            className={`side-link ${pathname === "/dashboard" ? "selected" : ""}`}
          >
            <LayoutDashboard size={18} />
            创作中心
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span className="community-status">
            <i />
            让灵感，在这里发生
          </span>
          <p>© 2026 DevFlow</p>
          <div>
            <Link href="/about">
              关于社区
              <ArrowUpRight size={10} />
            </Link>
            <Link href="/guidelines">社区公约</Link>
          </div>
          <span className="local-mode">
            {data.mode === "local" ? "LOCAL COMMUNITY" : "BUILT FOR DEVELOPERS"}
          </span>
        </div>
      </div>
    </aside>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo small />
          <p>让技术沉淀，让灵感流动。</p>
        </div>
        <nav className="footer-links" aria-label="页脚导航">
          <Link href="/discover">发现内容</Link>
          <Link href="/category/ai">AI 专区</Link>
          <Link href="/about">
            关于 DevFlow <ArrowRight size={13} />
          </Link>
          <Link href="/guidelines">社区公约</Link>
        </nav>
        <div className="footer-baseline">
          <span>DEVFLOW / BUILT FOR DEVELOPERS</span>
          <span>© 2026 DevFlow</span>
        </div>
      </div>
    </footer>
  );
}
