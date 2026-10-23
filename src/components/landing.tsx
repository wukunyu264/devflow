import Link from "next/link";
import type { ComponentProps } from "react";
import { LandingMotion } from "./landing-motion";
import styles from "./landing.module.css";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      {diagonal ? (
        <path
          d="M6 18 18 6M6 6h12v12"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : (
        <path
          d="M4 12h16m-6-6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}

function Brand() {
  return (
    <PortalLink href="/" className={styles.brand} aria-label="DevFlow 首页">
      <svg
        viewBox="0 0 32 36"
        width="28"
        height="32"
        fill="currentColor"
        aria-hidden="true"
      >
        <g transform="rotate(-20 16 18)">
          <rect x="2" y="9" width="7" height="20" rx="2" />
          <rect x="12" y="3" width="7" height="32" rx="2" />
          <rect x="22" y="9" width="7" height="20" rx="2" />
        </g>
      </svg>
      <span>
        DevFlow<span className={styles.brandDot}>.</span>
      </span>
    </PortalLink>
  );
}

const destinations = [
  {
    number: "01",
    eyebrow: "READ & CONNECT",
    title: "进入技术社区",
    text: "真实的实践、深入的思考。找到下一篇值得读的技术文章。",
    href: "/community",
    className: styles.readCard,
    word: "Read.",
    tags: ["前端开发", "后端工程", "架构设计"],
  },
  {
    number: "02",
    eyebrow: "FOLLOW YOUR CURIOSITY",
    title: "发现新的灵感",
    text: "跨过熟悉的边界，从不同的技术领域找到新的视角。",
    href: "/discover",
    className: styles.discoverCard,
    word: "Explore.",
    tags: ["新的视角", "新的连接", "新的可能"],
  },
  {
    number: "03",
    eyebrow: "BUILD WITH INTELLIGENCE",
    title: "探索 AI 的下一步",
    text: "从模型到应用，从第一个 Prompt 到真正落地的产品。",
    href: "/category/ai",
    className: styles.aiCard,
    word: "Think.",
    tags: ["大语言模型", "AI Agent", "工程实践"],
  },
  {
    number: "04",
    eyebrow: "TURN IDEAS INTO IMPACT",
    title: "写下你的第一篇",
    text: "把解决过的问题记录下来，让你的经验成为别人的起点。",
    href: "/write",
    className: styles.writeCard,
    word: "Create.",
    tags: ["记录经验", "分享实践", "一起成长"],
  },
];

export function Landing() {
  return (
    <LandingMotion
      className={styles.root}
      controlClassName={styles.motionControl}
    >
      <header className={styles.header}>
        <Brand />
        <nav aria-label="首页导航" className={styles.nav}>
          <PortalLink href="/community">技术社区</PortalLink>
          <PortalLink href="/discover">发现</PortalLink>
          <PortalLink href="/category/ai">AI 专区</PortalLink>
          <PortalLink href="#explore">探索 DevFlow</PortalLink>
        </nav>
        <PortalLink href="/dashboard" className={styles.headerCta}>
          创作中心 <Arrow diagonal />
        </PortalLink>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section
          className={styles.hero}
          aria-labelledby="landing-title"
          data-landing-animate
        >
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroGrid} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                <span /> A HOME FOR CURIOUS MINDS
              </p>
              <h1 id="landing-title">
                让想法，
                <br />
                <span>自由生长</span>。
              </h1>
              <p className={styles.heroDescription}>
                把实践写成文章，让经验与更多开发者相遇。
                <br />
                你的下一份灵感，从这里开始。
              </p>
              <div className={styles.heroActions}>
                <PortalLink href="/community" className={styles.primaryLink}>
                  进入技术社区 <Arrow />
                </PortalLink>
                <PortalLink href="/write" className={styles.secondaryLink}>
                  开始创作 <Arrow diagonal />
                </PortalLink>
              </div>
              <p className={styles.heroNote}>记录热爱 · 分享经验 · 连接彼此</p>
            </div>
            <div className={styles.scene} aria-hidden="true">
              <div className={styles.sceneOrbit} />
              <div className={styles.orb}>
                <span>
                  Ideas
                  <br />
                  in motion.
                </span>
                <i />
              </div>
              <div className={styles.codeWindow}>
                <div className={styles.windowBar}>
                  <span>
                    <i />
                    <i />
                    <i />
                  </span>
                  <small>hello, devflow</small>
                  <span>↗</span>
                </div>
                <div className={styles.codeLines}>
                  <p>
                    <em>const</em> idea = {"{"}
                  </p>
                  <p>
                    &nbsp; curiosity: <b>true</b>,
                  </p>
                  <p>
                    &nbsp; possibilities: <b>Infinity</b>,
                  </p>
                  <p>
                    &nbsp; next: <strong>&apos;start building&apos;</strong>
                  </p>
                  <p>{"}"};</p>
                  <p className={styles.codeComment}>
                    {"// make something that matters."}
                  </p>
                </div>
                <span className={styles.codeCursor} />
              </div>
              <div className={styles.journalCard}>
                <div className={styles.journalTop}>
                  <span>DEVFLOW JOURNAL</span>
                  <span>↗</span>
                </div>
                <div className={styles.journalArt}>
                  <span />
                  <span />
                  <span />
                </div>
                <small>THOUGHTS WORTH SHARING</small>
                <strong>
                  每一份经验，
                  <br />
                  都有新的可能。
                </strong>
                <div className={styles.journalRule} />
                <span className={styles.journalBottom}>
                  READ. BUILD. SHARE.
                </span>
              </div>
              <span className={styles.sceneTag}>由好奇驱动，为创造而生 ↗</span>
              <span className={styles.sceneCross}>+</span>
            </div>
          </div>
          <div className={styles.heroBottom}>
            <span>OPEN KNOWLEDGE. ENDLESS POSSIBILITIES.</span>
            <PortalLink href="#explore">
              向下探索 <span>↓</span>
            </PortalLink>
            <span>DEVFLOW / COMMUNITY</span>
          </div>
        </section>

        <section
          className={styles.explore}
          id="explore"
          aria-labelledby="explore-title"
        >
          <div className={styles.sectionIntro} data-landing-reveal>
            <p className={styles.sectionLabel}>01 / FIND YOUR NEXT CHAPTER</p>
            <div>
              <h2 id="explore-title">
                从好奇开始，
                <br />
                找到你的下一站。
              </h2>
              <p>
                阅读、探索，或者开始创作。
                <br />
                选择属于你的方式，走进 DevFlow。
              </p>
            </div>
          </div>
          <div className={styles.destinationGrid}>
            {destinations.map((item) => (
              <PortalLink
                href={item.href}
                key={item.href}
                className={`${styles.destination} ${item.className}`}
                data-landing-reveal
              >
                <div className={styles.destinationTop}>
                  <span>
                    {item.number} / {item.eyebrow}
                  </span>
                  <span className={styles.destinationArrow}>
                    <Arrow diagonal />
                  </span>
                </div>
                <div className={styles.destinationWord} aria-hidden="true">
                  {item.word}
                  <span />
                </div>
                <div className={styles.destinationCopy}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <div className={styles.destinationTags}>
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </PortalLink>
            ))}
          </div>
        </section>

        <section
          className={styles.create}
          aria-labelledby="create-title"
          data-landing-animate
        >
          <div className={styles.createInner}>
            <div data-landing-reveal>
              <p className={styles.sectionLabel}>
                02 / YOUR IDEAS DESERVE A HOME
              </p>
              <h2 id="create-title">
                不止于阅读，
                <br />
                更在于<span>创造</span>。
              </h2>
              <p className={styles.createDescription}>
                一次踩坑、一段思考、一个小工具，
                <br />
                都值得被认真记录。把你的经验，带到这里。
              </p>
              <PortalLink href="/write" className={styles.primaryLink}>
                开始我的创作 <Arrow />
              </PortalLink>
            </div>
            <div className={styles.createVisual} aria-hidden="true">
              <span>KEEP</span>
              <span className={styles.createOutline}>BUILDING.</span>
              <div className={styles.createLine} />
              <span>KEEP</span>
              <span>
                SHARING<span className={styles.createDot}>.</span>
              </span>
            </div>
          </div>
          <div className={styles.manifesto} data-landing-reveal>
            <span>保持好奇。</span>
            <span>真诚分享。</span>
            <span>一起生长。</span>
            <PortalLink href="/guidelines">
              了解社区公约 <Arrow diagonal />
            </PortalLink>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <Brand />
        <p>让技术沉淀，让灵感流动。</p>
        <nav aria-label="首页页脚导航">
          <PortalLink href="/community">技术社区</PortalLink>
          <PortalLink href="/about">关于 DevFlow</PortalLink>
          <PortalLink href="/guidelines">社区公约</PortalLink>
        </nav>
        <span>© 2026 DevFlow</span>
      </footer>
    </LandingMotion>
  );
}

// Explicit top fragment prevents the catch-all router retaining the portal scroll position.
function PortalLink({
  href,
  ...props
}: { href: string } & Omit<ComponentProps<"a">, "href">) {
  if (href.startsWith("#")) return <a href={href} {...props} />;
  return <Link href={`${href}#top`} {...props} />;
}
