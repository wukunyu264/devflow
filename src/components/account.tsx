"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { request, useCommunity } from "./community-provider";
import { Logo, Spinner } from "./ui";

export function Account({ register = false }: { register?: boolean }) {
  const { refresh, data } = useCommunity();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const rawNext = params.get("next") || "/";
  const next = /^\/(?![\/\\])/.test(rawNext) ? rawNext : "/";
  const otherHref = `${register ? "/login" : "/register"}?next=${encodeURIComponent(next)}`;
  return (
    <main id="main-content" tabIndex={-1} className="auth-page">
      <section className="auth-art">
        <Logo />
        <div className="auth-art-content">
          <span className="auth-art-eyebrow">
            <i />A COMMUNITY OF BUILDERS
          </span>
          <h1>
            好的想法，
            <br />
            在交流中
            <br />
            <em>生长。</em>
          </h1>
          <p>
            每一次记录，都是对热爱的回应。
            <br />
            每一次分享，都让灵感走得更远。
          </p>
          <div className="auth-orbits">
            <span />
            <span />
            <span />
            <Sparkles size={54} strokeWidth={1} />
            <i>✳</i>
          </div>
          <div className="auth-art-footer">
            <div className="mini-avatar-stack">
              <span>林</span>
              <span>陈</span>
              <span>苏</span>
              <span>鹿</span>
            </div>
            <p>与热爱技术的人，一起创造。</p>
          </div>
        </div>
        <span className="auth-art-copyright">
          DEVFLOW — KEEP BUILDING, KEEP SHARING.
        </span>
      </section>
      <section className="auth-form-section">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} />
          返回首页
        </Link>
        <div className="auth-form-inner">
          {confirmed ? (
            <div className="confirmation-state">
              <span>
                <Mail size={30} />
              </span>
              <h1>查看一下你的邮箱</h1>
              <p>
                注册申请已提交。如需验证，请查看 <strong>{email}</strong> 的收件箱和垃圾邮件。<br />
                完成验证后回来登录；如果已有账号，可直接登录。
              </p>
              <Link href={otherHref} className="button primary">
                前往登录 <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-form-heading">
                <span className="eyebrow">
                  {register
                    ? "YOUR NEXT CHAPTER STARTS HERE"
                    : "GOOD TO HAVE YOU BACK"}
                </span>
                <h1>{register ? "从这里，开始你的故事" : "欢迎回来。"}</h1>
                <p>
                  {register
                    ? "创建账号，让每一份经验都有回响。"
                    : "让我们继续发现、记录与分享。"}
                </p>
              </div>
              <form
                className="auth-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  setBusy(true);
                  try {
                    const result = await request(
                      register ? "register" : "login",
                      { email, password, name: register ? name : undefined },
                    );
                    if (result.confirmation) {
                      setConfirmed(true);
                      return;
                    }
                    await refresh();
                    toast.success(
                      register ? "欢迎加入 DevFlow！" : "欢迎回来！",
                    );
                    router.push(next);
                    router.refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {register && (
                  <label>
                    你的昵称
                    <div className="input-with-icon">
                      <UserRound size={17} />
                      <input
                        required
                        minLength={2}
                        maxLength={24}
                        autoComplete="nickname"
                        placeholder="想让大家怎么称呼你？"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </label>
                )}
                <label>
                  邮箱地址
                  <div className="input-with-icon">
                    <Mail size={17} />
                    <input
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </label>
                <label>
                  密码
                  <div className="input-with-icon">
                    <LockKeyhole size={17} />
                    <input
                      type={visible ? "text" : "password"}
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete={
                        register ? "new-password" : "current-password"
                      }
                      placeholder={
                        register ? "设置至少 8 位的密码" : "输入你的密码"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={visible ? "隐藏密码" : "显示密码"}
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
                {register && (
                  <p className="password-help">
                    建议组合使用字母、数字和符号。
                  </p>
                )}
                {error && (
                  <div role="alert" className="form-error">
                    {error}
                  </div>
                )}
                <button className="button primary auth-submit" disabled={busy} aria-label={register ? "创建我的账号" : "登录 DevFlow"} aria-busy={busy}>
                  {busy ? (
                    <Spinner />
                  ) : register ? (
                    "创建我的账号"
                  ) : (
                    "登录 DevFlow"
                  )}
                  {!busy && <ArrowRight size={16} />}
                </button>
              </form>
              <p className="auth-switch">
                {register ? "已经是社区的一员？" : "还没有账号？"}
                <Link href={otherHref}>
                  {register ? "直接登录" : "加入 DevFlow"} <ArrowUpRightIcon />
                </Link>
              </p>
              <div className="auth-agreement">
                {register
                  ? "注册即表示你同意"
                  : "真诚分享，友善交流。阅读我们的"}
                <Link href="/guidelines">社区公约</Link>。
              </div>
              {data.mode === "local" && (
                <p className="local-auth-note">
                  <span />
                  本地开发模式 · 账号安全保存在本机数据库
                </p>
              )}
            </>
          )}
        </div>
        <div className="auth-footer">
          让技术沉淀，让灵感流动。<span>© 2026 DevFlow</span>
        </div>
      </section>
    </main>
  );
}
function ArrowUpRightIcon() {
  return <span aria-hidden="true">↗</span>;
}
