# Personal site redesign — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-25-site-redesign-design.md` (read before starting any task)

**Goal:** Replace the Jekyll/Indigo personal site at `jayravaliya.com` with an Astro 5 static site that matches the editorial design spec, ships via GitHub Actions, and uses content collections for posts and projects.

**Architecture:** Astro 5 SSG with typed content collections (Zod schemas). Vanilla CSS with custom-property theming and a `prefers-color-scheme` + `localStorage` toggle. Source Serif 4 self-hosted via `@fontsource-variable/source-serif-4`. RSS via `@astrojs/rss`, sitemap via `@astrojs/sitemap`. Built and deployed by `.github/workflows/deploy.yml` to GitHub Pages on push to `main`.

**Tech Stack:** Astro 5, TypeScript (strict), Node 20, vanilla CSS + PostCSS nesting, Source Serif 4 (variable, self-hosted), GitHub Actions Pages deploy.

**Branch strategy:** All work happens on a `redesign` branch off `main`. Land as a single PR after the live preview looks right. Optionally executed in a git worktree (`git worktree add ../jay-redesign redesign`) for isolation.

**Verification approach:** Static-site work doesn't fit classic TDD — there are no functions to drive out test-first. Verification per task is one or more of: `npm run build` exits 0; spot-check a generated file in `dist/`; visit a route in `npm run dev` and confirm what's rendered. Don't skip these checks — they're the test suite.

---

## Task 1 — Branch setup

**Files:** none modified yet; we create the branch we'll work on.

- [x] **Step 1: Confirm clean working tree**

  Run: `git status`
  Expected: `nothing to commit, working tree clean` (apart from any uncommitted memory files outside the repo).

- [x] **Step 2: Create and switch to `redesign` branch**

  Run: `git checkout -b redesign`
  Expected: `Switched to a new branch 'redesign'`

- [x] **Step 3: Sanity-check the spec is readable**

  Run: `head -30 docs/superpowers/specs/2026-04-25-site-redesign-design.md`
  Expected: shows the spec header through the "Decisions at a glance" table.

- [x] **Step 4: No commit yet** — branch creation alone doesn't need one.

---

## Task 2 — Scaffold Astro into the repo

We scaffold into a temp dir (Astro's installer wants an empty target) then move the result into the repo root, leaving Jekyll files in place for now.

**Files:**
- Create: `package.json`, `tsconfig.json`, `astro.config.mjs`, `src/`, `public/`, `.gitignore` (extended)
- Other existing files unchanged

- [x] **Step 1: Scaffold Astro in a temp directory**

  Run:
  ```bash
  rm -rf /tmp/jay-astro-scaffold
  npm create astro@latest /tmp/jay-astro-scaffold -- \
    --template minimal --typescript strict --no-install --no-git --yes
  ```
  Expected: scaffold completes, `/tmp/jay-astro-scaffold` contains `package.json`, `astro.config.mjs`, `src/`, `public/`, `tsconfig.json`, `.gitignore`, etc.

  If your `npm create astro@latest` version rejects the `--yes` flag, drop it and answer the two prompts manually (it will ask whether to install deps and init git — say no to both).

- [x] **Step 2: Verify the scaffold structure**

  Run: `ls -la /tmp/jay-astro-scaffold`
  Expected: shows the files listed above. Sanity-check `package.json` mentions `"astro": "^5.x"`.

- [x] **Step 3: Rename the existing repo `package.json` so it doesn't conflict**

  The current repo has a Jekyll-era `package.json`. Move it aside; we'll delete it in the cleanup task.
  ```bash
  mv package.json _legacy_package.json
  ```

- [x] **Step 4: Copy scaffold files into the repo root**

  ```bash
  cp /tmp/jay-astro-scaffold/package.json .
  cp /tmp/jay-astro-scaffold/tsconfig.json .
  cp /tmp/jay-astro-scaffold/astro.config.mjs .
  cp -r /tmp/jay-astro-scaffold/src .
  cp -r /tmp/jay-astro-scaffold/public ./public_astro
  # Merge: keep existing public/ (CNAME etc) handled later; for now keep the scaffold's public separate
  ```

  Then merge the scaffolded `public_astro/` contents into the repo:
  ```bash
  mkdir -p public
  # Move scaffold's favicon.svg / etc into public/, preserving anything already there
  cp -n public_astro/* public/ 2>/dev/null || true
  rm -rf public_astro
  ```

- [x] **Step 5: Append Astro-specific entries to `.gitignore`**

  Open `.gitignore` and ensure these lines are present (append if missing):
  ```
  node_modules/
  dist/
  .astro/
  .DS_Store
  *.log
  npm-debug.log*
  yarn-debug.log*
  yarn-error.log*
  .env
  .env.production
  ```

- [x] **Step 6: Install dependencies**

  Run: `npm install`
  Expected: completes without errors. `node_modules/` and `package-lock.json` appear.

- [x] **Step 7: Verify dev server boots**

  Run: `npm run dev` (foreground; Ctrl+C after verifying)
  Expected: prints `Local: http://localhost:4321/`. Open it in a browser; you should see Astro's default minimal page. This proves the scaffold works.

- [x] **Step 8: Commit**

  ```bash
  git add .gitignore package.json package-lock.json tsconfig.json astro.config.mjs src public _legacy_package.json
  git commit -m "Scaffold Astro 5 minimal template alongside Jekyll site"
  ```

---

## Task 3 — Project configuration

Set Astro's config to the right site URL, output mode, and add the plugins listed in the spec.

**Files:**
- Modify: `astro.config.mjs`
- Modify: `package.json` (add deps)
- Modify: `tsconfig.json` (verify strict)

- [x] **Step 1: Install required packages**

  ```bash
  npm install @astrojs/sitemap @astrojs/rss @fontsource-variable/source-serif-4
  ```
  Expected: all three install. `package.json` `dependencies` now includes them.

- [x] **Step 2: Replace `astro.config.mjs` with this content**

  ```js
  // @ts-check
  import { defineConfig } from 'astro/config';
  import sitemap from '@astrojs/sitemap';

  export default defineConfig({
    site: 'https://jayravaliya.com',
    trailingSlash: 'always',
    build: {
      format: 'directory',
    },
    integrations: [sitemap()],
    markdown: {
      shikiConfig: {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        wrap: true,
      },
    },
  });
  ```

- [x] **Step 3: Confirm `tsconfig.json` extends Astro's strict preset**

  It should contain at minimum:
  ```json
  {
    "extends": "astro/tsconfigs/strict",
    "include": [".astro/types.d.ts", "**/*"],
    "exclude": ["dist"]
  }
  ```
  If the scaffold differs, replace its content with the above.

- [x] **Step 4: Verify config compiles**

  Run: `npm run build`
  Expected: `Server built in …`, `Complete!`. (The minimal scaffold has at least an `index.astro`, so the build should produce `dist/index.html`.) If it errors, fix before continuing.

- [x] **Step 5: Commit**

  ```bash
  git add astro.config.mjs tsconfig.json package.json package-lock.json
  git commit -m "Configure Astro: site URL, sitemap, Shiki themes, strict TS"
  ```

---

## Task 4 — Content collection schemas

Define the typed shape of `posts` and `projects` collections (and the optional `now` singleton) per the spec.

**Files:**
- Create: `src/content.config.ts`
- Create directories: `src/content/posts/` (empty for now), `src/content/projects/` (empty for now)

- [x] **Step 1: Create empty content directories with `.gitkeep`**

  ```bash
  mkdir -p src/content/posts src/content/projects
  touch src/content/posts/.gitkeep src/content/projects/.gitkeep
  ```

- [x] **Step 2: Create `src/content.config.ts`**

  ```ts
  import { defineCollection, z } from 'astro:content';
  import { glob } from 'astro/loaders';

  const posts = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
    }),
  });

  const projects = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
    schema: z.object({
      name: z.string(),
      blurb: z.string(),
      year: z.number().int(),
      status: z.enum(['live', 'wip', 'archived']).default('live'),
      links: z
        .array(z.object({ label: z.string(), url: z.string().url() }))
        .default([]),
      hasPage: z.boolean().default(false),
    }),
  });

  // Single-file collection: src/content/now.md, optional.
  // Empty schema (passthrough) — body is the only thing that matters.
  const now = defineCollection({
    loader: glob({ pattern: 'now.md', base: './src/content' }),
    schema: z.object({}).passthrough(),
  });

  export const collections = { posts, projects, now };
  ```

- [x] **Step 3: Verify schemas type-check**

  Run: `npm run build`
  Expected: build succeeds. (No content yet, so no validation runs — but the config must parse.)

- [x] **Step 4: Commit**

  ```bash
  git add src/content.config.ts src/content/posts/.gitkeep src/content/projects/.gitkeep
  git commit -m "Define content collections for posts and projects"
  ```

---

## Task 5 — Theme system & global styles

Vanilla CSS with custom properties. Light + dark palettes per spec, swapped via media query and `[data-theme]` attribute.

**Files:**
- Create: `src/styles/theme.css`
- Create: `src/styles/global.css`
- Create: `src/styles/prose.css`

- [x] **Step 1: Create `src/styles/theme.css`**

  ```css
  /* Editorial palette — warm cream paper / warm off-black.
     Colors set on :root and overridden under prefers-color-scheme: dark
     and the [data-theme] attribute when the user toggles. */

  :root {
    --bg: #f7f3ec;
    --text: #1a1a1a;
    --text-muted: #6b5d48;
    --label: #998870;
    --border: #d8cfc0;
    --accent: #a14a16;

    --font-serif: 'Source Serif 4 Variable', 'Iowan Old Style', 'Palatino', Georgia, serif;
    --font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #15130f;
      --text: #ebe6db;
      --text-muted: #c9beab;
      --label: #a8957a;
      --border: #2c2820;
      --accent: #e0a060;
    }
  }

  /* Manual override via toggle */
  :root[data-theme='light'] {
    --bg: #f7f3ec;
    --text: #1a1a1a;
    --text-muted: #6b5d48;
    --label: #998870;
    --border: #d8cfc0;
    --accent: #a14a16;
  }

  :root[data-theme='dark'] {
    --bg: #15130f;
    --text: #ebe6db;
    --text-muted: #c9beab;
    --label: #a8957a;
    --border: #2c2820;
    --accent: #e0a060;
  }
  ```

- [x] **Step 2: Create `src/styles/global.css`**

  ```css
  @import '@fontsource-variable/source-serif-4';
  @import './theme.css';

  *, *::before, *::after { box-sizing: border-box; }

  html {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-serif);
    font-size: 18px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }

  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }

  a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
  }
  a:hover { text-decoration-thickness: 2px; }

  h1, h2, h3, h4 {
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.01em;
    margin: 1.5em 0 0.5em;
  }
  h1 { font-size: 2.25rem; margin-top: 0.25em; }
  h2 { font-size: 1.4rem; }
  h3 { font-size: 1.15rem; }

  hr {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 2em 0;
  }

  .label {
    font-family: var(--font-sans);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--label);
  }

  .muted { color: var(--text-muted); }

  /* Visually-hidden helper for accessible labels */
  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0);
    white-space: nowrap; border: 0;
  }
  ```

- [x] **Step 3: Create `src/styles/prose.css` for article body styling**

  ```css
  /* Used inside post and project bodies. */

  .prose {
    font-family: var(--font-serif);
    font-size: 1.05rem;
    line-height: 1.7;
  }

  .prose p { margin: 1em 0; }
  .prose h2 { margin-top: 2em; }
  .prose h3 { margin-top: 1.5em; }

  .prose blockquote {
    margin: 1.25em 0;
    padding: 0.25em 1em;
    border-left: 3px solid var(--border);
    color: var(--text-muted);
    font-style: italic;
  }

  .prose code {
    font-family: var(--font-mono);
    font-size: 0.92em;
    background: color-mix(in srgb, var(--border) 50%, transparent);
    padding: 0.1em 0.3em;
    border-radius: 3px;
  }

  .prose pre {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    overflow-x: auto;
    padding: 14px 16px;
    border-radius: 6px;
    border: 1px solid var(--border);
    line-height: 1.5;
  }
  .prose pre code {
    background: transparent;
    padding: 0;
  }

  .prose img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1.25em 0;
  }

  .prose ul, .prose ol { padding-left: 1.5em; }
  .prose li { margin: 0.35em 0; }

  .prose a { color: var(--accent); }
  ```

- [x] **Step 4: Verify CSS compiles** (will be exercised via BaseLayout in next task)

  Run: `npm run build`
  Expected: still succeeds. CSS files aren't yet imported anywhere, so no visible effect.

- [x] **Step 5: Commit**

  ```bash
  git add src/styles
  git commit -m "Add editorial theme palette, global styles, and prose styles"
  ```

---

## Task 6 — BaseLayout

The HTML skeleton wrapping every page. Includes the inline pre-paint theme script to avoid the FOUC flash.

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [x] **Step 1: Create `src/layouts/BaseLayout.astro`**

  ```astro
  ---
  import '../styles/global.css';
  import Header from '../components/Header.astro';
  import Footer from '../components/Footer.astro';

  interface Props {
    title: string;
    description?: string;
    ogType?: 'website' | 'article';
  }

  const { title, description, ogType = 'website' } = Astro.props;
  const canonicalURL = new URL(Astro.url.pathname, Astro.site).toString();
  const fullTitle = title === 'Jay Ravaliya' ? title : `${title} — Jay Ravaliya`;
  ---
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="generator" content={Astro.generator} />
      <link rel="canonical" href={canonicalURL} />
      <link rel="alternate" type="application/rss+xml" title="Jay Ravaliya — Writing" href="/rss.xml" />

      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonicalURL} />

      <meta name="twitter:card" content="summary" />

      <!-- Pre-paint theme bootstrap: read localStorage and set [data-theme]
           before the page renders so the user never sees the wrong palette. -->
      <script is:inline>
        (function () {
          try {
            var stored = localStorage.getItem('theme');
            if (stored === 'light' || stored === 'dark') {
              document.documentElement.setAttribute('data-theme', stored);
            }
          } catch (e) {}
        })();
      </script>
    </head>
    <body>
      <Header />
      <main>
        <slot />
      </main>
      <Footer />
    </body>
  </html>
  ```

- [x] **Step 2: Build won't pass yet** because Header and Footer don't exist. Don't run build until Task 7 completes.

- [x] **Step 3: Commit**

  ```bash
  git add src/layouts/BaseLayout.astro
  git commit -m "Add BaseLayout with pre-paint theme bootstrap"
  ```

---

## Task 7 — Header, ThemeToggle, Footer

Three small components used by every page.

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/ThemeToggle.astro`
- Create: `src/components/Footer.astro`

- [x] **Step 1: Create `src/components/ThemeToggle.astro`**

  ```astro
  ---
  // Client-side only. The button toggles document.documentElement[data-theme]
  // and persists the choice to localStorage. The pre-paint script in BaseLayout
  // applies the stored value before render.
  ---
  <button
    type="button"
    class="theme-toggle"
    aria-label="Toggle color theme"
    data-theme-toggle
  >
    <svg class="icon icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4"></circle>
      <line x1="12" y1="2" x2="12" y2="4"></line>
      <line x1="12" y1="20" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="4" y2="12"></line>
      <line x1="20" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line>
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line>
    </svg>
    <svg class="icon icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  </button>

  <style>
    .theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      width: 32px;
      height: 32px;
      border-radius: 4px;
      cursor: pointer;
      padding: 0;
      transition: color 120ms ease, border-color 120ms ease;
    }
    .theme-toggle:hover { color: var(--text); border-color: var(--label); }

    /* Show sun in dark mode (so user can switch to light), moon in light mode (and vice versa). */
    .icon-sun { display: none; }
    .icon-moon { display: inline; }

    @media (prefers-color-scheme: dark) {
      .icon-sun { display: inline; }
      .icon-moon { display: none; }
    }
    :root[data-theme='dark'] .icon-sun { display: inline; }
    :root[data-theme='dark'] .icon-moon { display: none; }
    :root[data-theme='light'] .icon-sun { display: none; }
    :root[data-theme='light'] .icon-moon { display: inline; }
  </style>

  <script>
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      btn.addEventListener('click', () => {
        const root = document.documentElement;
        const current =
          root.getAttribute('data-theme') ??
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = current === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
      });
    }
  </script>
  ```

- [x] **Step 2: Create `src/components/Header.astro`**

  ```astro
  ---
  import ThemeToggle from './ThemeToggle.astro';
  ---
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="wordmark">Jay Ravaliya</a>
      <ThemeToggle />
    </div>
  </header>

  <style>
    .site-header {
      border-bottom: 1px solid var(--border);
    }
    .header-inner {
      max-width: 720px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .wordmark {
      font-family: var(--font-serif);
      font-weight: 600;
      font-size: 1rem;
      color: var(--text);
      text-decoration: none;
      letter-spacing: -0.01em;
    }
    .wordmark:hover { color: var(--accent); }
  </style>
  ```

- [x] **Step 3: Create `src/components/Footer.astro`**

  ```astro
  ---
  const year = new Date().getFullYear();
  ---
  <footer class="site-footer">
    <div class="footer-inner">
      <span>© {year} Jay Ravaliya</span>
      <span class="muted"> · Built with <a href="https://astro.build">Astro</a></span>
    </div>
  </footer>

  <style>
    .site-footer {
      border-top: 1px solid var(--border);
      margin-top: 64px;
    }
    .footer-inner {
      max-width: 720px;
      margin: 0 auto;
      padding: 24px;
      font-family: var(--font-sans);
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .footer-inner a { color: var(--text-muted); }
    .footer-inner a:hover { color: var(--accent); }
  </style>
  ```

- [x] **Step 4: Replace the scaffold's `src/pages/index.astro` with a smoke-test page** so we can verify the layout renders.

  ```astro
  ---
  import BaseLayout from '../layouts/BaseLayout.astro';
  ---
  <BaseLayout title="Jay Ravaliya" description="Software engineer. I build with AI and write about it.">
    <h1>Hello from the Astro site</h1>
    <p>Smoke test. Replace with the real home page in Task 9.</p>
  </BaseLayout>
  ```

- [x] **Step 5: Verify dev server**

  Run: `npm run dev`
  Open `http://localhost:4321`. Expected:
  - Header strip with "Jay Ravaliya" wordmark on left and a moon (or sun) icon on right.
  - Centered single-column body, serif font, cream or warm-dark background depending on your OS.
  - Click the icon — palette should flip.
  - Reload — palette stays.
  - Footer at the bottom with copyright + Astro link.

  Ctrl+C to stop.

- [x] **Step 6: Verify build**

  Run: `npm run build`
  Expected: `Complete!`. `dist/index.html` exists.

- [x] **Step 7: Commit**

  ```bash
  git add src/components src/pages/index.astro
  git commit -m "Add Header, ThemeToggle, Footer; smoke-test home renders"
  ```

---

## Task 8 — Home page components

Build the four content components the home page composes: Hero, NowBlock, WritingList, ProjectList.

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/NowBlock.astro`
- Create: `src/components/WritingList.astro`
- Create: `src/components/ProjectList.astro`

- [x] **Step 1: Create `src/components/Hero.astro`**

  ```astro
  ---
  // Site-owner identity block at the top of the home page.
  // Inline social links — small, muted, no icons-as-decoration.
  const socials = [
    { label: 'GitHub', url: 'https://github.com/jayrav13' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/jayrav13/' },
    { label: 'Email', url: 'mailto:jayrav13@gmail.com' },
  ];
  ---
  <section class="hero">
    <h1 class="name">Jay Ravaliya</h1>
    <p class="tagline">Software engineer. I build with AI and write about it.</p>
    <p class="socials">
      {socials.map((s, i) => (
        <>
          {i > 0 && <span class="sep"> · </span>}
          <a href={s.url}>{s.label}</a>
        </>
      ))}
    </p>
  </section>

  <style>
    .hero { margin-bottom: 48px; }
    .name {
      font-size: 2.5rem;
      font-weight: 600;
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }
    .tagline {
      font-style: italic;
      color: var(--text-muted);
      font-size: 1.1rem;
      margin: 0 0 18px;
    }
    .socials {
      font-family: var(--font-sans);
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }
    .socials a { color: var(--text-muted); }
    .socials a:hover { color: var(--accent); }
    .sep { color: var(--label); }
  </style>
  ```

  Note: The social URLs above are placeholders pulled from the existing site's `_config.yml`. If any are wrong, fix them in this file — they're hardcoded by design (not enough churn to warrant a config file).

- [x] **Step 2: Create `src/components/NowBlock.astro`**

  ```astro
  ---
  // Renders src/content/now.md if it exists. Uses the `now` content collection
  // defined in src/content.config.ts — empty when the file is absent.
  import { getCollection, render } from 'astro:content';

  const entries = await getCollection('now');
  const entry = entries[0];
  const Content = entry ? (await render(entry)).Content : null;
  ---
  {Content && (
    <section class="now">
      <span class="label">Now</span>
      <div class="now-body">
        <Content />
      </div>
    </section>
  )}

  <style>
    .now {
      border-left: 3px solid var(--label);
      padding: 8px 16px;
      margin: 24px 0 32px;
      background: color-mix(in srgb, var(--border) 30%, transparent);
    }
    .now .label { display: block; margin-bottom: 4px; }
    .now-body :global(p) { margin: 0.4em 0; font-size: 0.95rem; }
    .now-body :global(p:first-child) { margin-top: 0; }
    .now-body :global(p:last-child) { margin-bottom: 0; }
  </style>
  ```

  No extra dependencies — Astro renders the markdown natively.

- [x] **Step 3: Create `src/components/WritingList.astro`**

  ```astro
  ---
  import { getCollection } from 'astro:content';

  const all = await getCollection('posts', ({ data }) => !data.draft);
  const posts = all.sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  ---
  {posts.length > 0 && (
    <section class="writing">
      <h2>Writing</h2>
      <ul class="post-list">
        {posts.map((p) => (
          <li class="post-row">
            <a class="post-title" href={`/posts/${p.id}/`}>
              {p.data.title}
            </a>
            <span class="post-date">{fmt(p.data.date)}</span>
            {p.data.description && (
              <p class="post-desc">{p.data.description}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )}

  <style>
    .writing { margin: 48px 0; }
    .writing h2 {
      font-family: var(--font-sans);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--label);
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
      margin: 0 0 16px;
    }
    .post-list { list-style: none; padding: 0; margin: 0; }
    .post-row {
      padding: 10px 0;
      border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    }
    .post-row:last-child { border-bottom: none; }
    .post-title {
      font-weight: 600;
      color: var(--text);
      text-decoration: none;
    }
    .post-title:hover { color: var(--accent); }
    .post-date {
      font-family: var(--font-sans);
      font-size: 0.75rem;
      color: var(--label);
      margin-left: 8px;
    }
    .post-desc {
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
    }
  </style>
  ```

- [x] **Step 4: Create `src/components/ProjectList.astro`**

  ```astro
  ---
  import { getCollection } from 'astro:content';

  const all = await getCollection('projects');
  // Reverse-chronological by year, ties broken alphabetically by name.
  const projects = all.sort((a, b) => {
    if (b.data.year !== a.data.year) return b.data.year - a.data.year;
    return a.data.name.localeCompare(b.data.name);
  });

  const targetUrl = (p: (typeof projects)[number]) =>
    p.data.hasPage
      ? `/projects/${p.id}/`
      : p.data.links[0]?.url ?? '#';
  ---
  {projects.length > 0 && (
    <section class="projects">
      <h2>Projects</h2>
      <ul class="project-list">
        {projects.map((p) => (
          <li class="project-row">
            <a class="project-name" href={targetUrl(p)}>
              {p.data.name}
            </a>
            <span class="project-year">{p.data.year}</span>
            {p.data.blurb && (
              <p class="project-blurb">{p.data.blurb} <span class="arrow">→</span></p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )}

  <style>
    .projects { margin: 48px 0; }
    .projects h2 {
      font-family: var(--font-sans);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--label);
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
      margin: 0 0 16px;
    }
    .project-list { list-style: none; padding: 0; margin: 0; }
    .project-row {
      padding: 10px 0;
      border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    }
    .project-row:last-child { border-bottom: none; }
    .project-name {
      font-weight: 600;
      color: var(--text);
      text-decoration: none;
    }
    .project-name:hover { color: var(--accent); }
    .project-year {
      font-family: var(--font-sans);
      font-size: 0.75rem;
      color: var(--label);
      margin-left: 8px;
    }
    .project-blurb {
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .arrow { color: var(--label); margin-left: 4px; }
  </style>
  ```

- [x] **Step 5: Verify build (no content yet → all sections render empty/null)**

  Run: `npm run build`
  Expected: build succeeds. Sections won't render (no content yet) — that's fine.

- [x] **Step 6: Commit**

  ```bash
  git add src/components
  git commit -m "Add Hero, NowBlock, WritingList, ProjectList components"
  ```

---

## Task 9 — Home page composition

Replace the smoke-test home page with the real composition.

**Files:**
- Modify: `src/pages/index.astro`

- [x] **Step 1: Replace `src/pages/index.astro` content**

  ```astro
  ---
  import BaseLayout from '../layouts/BaseLayout.astro';
  import Hero from '../components/Hero.astro';
  import NowBlock from '../components/NowBlock.astro';
  import WritingList from '../components/WritingList.astro';
  import ProjectList from '../components/ProjectList.astro';
  ---
  <BaseLayout
    title="Jay Ravaliya"
    description="Software engineer. I build with AI and write about it."
  >
    <Hero />
    <NowBlock />
    <WritingList />
    <ProjectList />
  </BaseLayout>
  ```

- [x] **Step 2: Verify with dev server**

  Run: `npm run dev`
  Open `http://localhost:4321`. Expected:
  - Header / wordmark / theme toggle.
  - Hero with name, italic tagline, social links.
  - No "/now" block (file doesn't exist).
  - No "Writing" or "Projects" sections (collections are empty).
  - Footer.

  This proves the conditional rendering works. Migration tasks add content.

- [x] **Step 3: Verify build**

  Run: `npm run build`
  Expected: `Complete!`. `dist/index.html` shows the hero with no list sections.

- [x] **Step 4: Commit**

  ```bash
  git add src/pages/index.astro
  git commit -m "Compose home page from Hero, NowBlock, WritingList, ProjectList"
  ```

---

## Task 10 — Post detail page

Dynamic route generating one page per post.

**Files:**
- Create: `src/layouts/ArticleLayout.astro`
- Create: `src/pages/posts/[slug].astro`

- [x] **Step 1: Create `src/layouts/ArticleLayout.astro`**

  ```astro
  ---
  import BaseLayout from './BaseLayout.astro';
  import '../styles/prose.css';

  interface Props {
    title: string;
    description?: string;
    date?: Date;
    tags?: string[];
    meta?: string;
  }

  const { title, description, date, tags, meta } = Astro.props;
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  ---
  <BaseLayout title={title} description={description} ogType="article">
    <article>
      <header class="article-header">
        <h1>{title}</h1>
        <p class="article-meta">
          {date && <span>{fmt(date)}</span>}
          {meta && <><span class="sep"> · </span><span>{meta}</span></>}
          {tags && tags.length > 0 && (
            <>
              <span class="sep"> · </span>
              <span class="tags">{tags.map((t) => `#${t}`).join(' ')}</span>
            </>
          )}
        </p>
      </header>
      <div class="prose">
        <slot />
      </div>
      <slot name="after" />
    </article>
  </BaseLayout>

  <style>
    .article-header { margin: 0 0 32px; }
    .article-header h1 { margin: 0 0 8px; }
    .article-meta {
      font-family: var(--font-sans);
      font-size: 0.85rem;
      color: var(--label);
      margin: 0;
    }
    .article-meta .sep { color: var(--border); }
    .tags { color: var(--text-muted); }
  </style>
  ```

- [x] **Step 2: Create `src/pages/posts/[slug].astro`**

  ```astro
  ---
  import { getCollection, render } from 'astro:content';
  import ArticleLayout from '../../layouts/ArticleLayout.astro';

  export async function getStaticPaths() {
    const posts = await getCollection('posts', ({ data }) => !data.draft);
    return posts.map((entry) => ({
      params: { slug: entry.id },
      props: { entry },
    }));
  }

  const { entry } = Astro.props;
  const { Content } = await render(entry);

  // Compute prev/next by date for the in-article footer nav.
  const all = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  const idx = all.findIndex((p) => p.id === entry.id);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx < all.length - 1 ? all[idx + 1] : null;
  ---
  <ArticleLayout
    title={entry.data.title}
    description={entry.data.description}
    date={entry.data.date}
    tags={entry.data.tags}
  >
    <Content />

    <nav class="post-nav" slot="after">
      {older && (
        <a class="nav-link prev" href={`/posts/${older.id}/`}>
          <span class="label">Older</span>
          <span class="title">{older.data.title}</span>
        </a>
      )}
      {newer && (
        <a class="nav-link next" href={`/posts/${newer.id}/`}>
          <span class="label">Newer</span>
          <span class="title">{newer.data.title}</span>
        </a>
      )}
    </nav>
  </ArticleLayout>

  <style>
    .post-nav {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    .nav-link {
      flex: 1;
      text-decoration: none;
      color: var(--text-muted);
      font-family: var(--font-sans);
      font-size: 0.85rem;
    }
    .nav-link.next { text-align: right; }
    .nav-link .label {
      display: block;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--label);
      margin-bottom: 2px;
    }
    .nav-link .title {
      color: var(--text);
      font-family: var(--font-serif);
      font-weight: 600;
    }
    .nav-link:hover .title { color: var(--accent); }
  </style>
  ```

- [x] **Step 3: Verify build (no posts yet → no routes generated)**

  Run: `npm run build`
  Expected: `Complete!`. No `dist/posts/` dir (collection is empty).

- [x] **Step 4: Commit**

  ```bash
  git add src/layouts/ArticleLayout.astro src/pages/posts/
  git commit -m "Add ArticleLayout and dynamic post detail route"
  ```

---

## Task 11 — Project detail page

Same shape as posts, but routes only emit when `hasPage: true`.

**Files:**
- Create: `src/pages/projects/[slug].astro`

- [x] **Step 1: Create `src/pages/projects/[slug].astro`**

  ```astro
  ---
  import { getCollection, render } from 'astro:content';
  import ArticleLayout from '../../layouts/ArticleLayout.astro';

  export async function getStaticPaths() {
    const projects = await getCollection('projects', ({ data }) => data.hasPage);
    return projects.map((entry) => ({
      params: { slug: entry.id },
      props: { entry },
    }));
  }

  const { entry } = Astro.props;
  const { Content } = await render(entry);

  const statusLabel: Record<string, string> = {
    live: 'Live',
    wip: 'Work in progress',
    archived: 'Archived',
  };
  const meta = `${entry.data.year} · ${statusLabel[entry.data.status]}`;
  ---
  <ArticleLayout
    title={entry.data.name}
    description={entry.data.blurb}
    meta={meta}
  >
    <Content />

    {entry.data.links.length > 0 && (
      <section class="links" slot="after">
        <h2 class="links-heading">Links</h2>
        <ul>
          {entry.data.links.map((l) => (
            <li><a href={l.url}>{l.label}</a></li>
          ))}
        </ul>
      </section>
    )}
  </ArticleLayout>

  <style>
    .links {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    .links-heading {
      font-family: var(--font-sans);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--label);
      margin: 0 0 8px;
    }
    .links ul { list-style: none; padding: 0; margin: 0; }
    .links li { padding: 4px 0; }
  </style>
  ```

- [x] **Step 2: Verify build**

  Run: `npm run build`
  Expected: `Complete!`. Still no routes (no projects yet, and even when added, only `hasPage: true` ones get pages).

- [x] **Step 3: Commit**

  ```bash
  git add src/pages/projects/
  git commit -m "Add dynamic project detail route (hasPage gated)"
  ```

---

## Task 12 — RSS, sitemap, 404, robots

Infrastructure files. Sitemap is already wired up via the integration (Task 3). RSS and 404 need files. `robots.txt` already exists in the repo at the root and needs to move to `public/`.

**Files:**
- Create: `src/pages/rss.xml.ts`
- Create: `src/pages/404.astro`
- Move: `robots.txt` → `public/robots.txt`

- [x] **Step 1: Create `src/pages/rss.xml.ts`**

  ```ts
  import rss from '@astrojs/rss';
  import { getCollection } from 'astro:content';
  import type { APIContext } from 'astro';

  export async function GET(context: APIContext) {
    const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
      (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
    );

    return rss({
      title: 'Jay Ravaliya',
      description: 'Software engineer. I build with AI and write about it.',
      site: context.site!,
      items: posts.map((p) => ({
        title: p.data.title,
        description: p.data.description,
        pubDate: p.data.date,
        link: `/posts/${p.id}/`,
      })),
      customData: `<language>en-us</language>`,
    });
  }
  ```

- [x] **Step 2: Create `src/pages/404.astro`**

  ```astro
  ---
  import BaseLayout from '../layouts/BaseLayout.astro';
  ---
  <BaseLayout title="Not found" description="Page not found.">
    <h1>404</h1>
    <p class="muted">This page doesn't exist (or doesn't anymore).</p>
    <p><a href="/">Back to home</a></p>
  </BaseLayout>
  ```

- [x] **Step 3: Move `robots.txt` to `public/`**

  ```bash
  mkdir -p public
  git mv robots.txt public/robots.txt
  ```

  Then overwrite its content (the existing one is the Jekyll default and lacks a sitemap reference):
  ```
  User-agent: *
  Allow: /

  Sitemap: https://jayravaliya.com/sitemap-index.xml
  ```

- [x] **Step 4: Verify build**

  Run: `npm run build`
  Then: `ls dist`
  Expected files include: `index.html`, `404.html`, `rss.xml`, `sitemap-index.xml`, `sitemap-0.xml`, `robots.txt`.

- [x] **Step 5: Spot-check RSS**

  Run: `head -20 dist/rss.xml`
  Expected: a valid `<rss>` document, with no `<item>` elements yet (no posts).

- [x] **Step 6: Commit**

  ```bash
  git add src/pages/rss.xml.ts src/pages/404.astro public/robots.txt
  git commit -m "Add RSS feed, 404 page, and move robots.txt to public/"
  ```

---

## Task 13 — Migrate posts (one-shot script)

The 3 existing posts use Jekyll's Liquid `{% highlight LANG %}…{% endhighlight %}` tags that don't render in standard Markdown. A small script converts them to fenced code blocks and rewrites frontmatter to the new schema.

**Files:**
- Create temporarily: `scripts/migrate-posts.mjs`
- Create: `src/content/posts/<slug>.md` × 3
- Delete after run: `scripts/migrate-posts.mjs`

- [x] **Step 1: Inspect the source files**

  Run: `ls _posts/`
  Expected: 3 `.markdown` files plus `.gitkeep`. Confirm.

- [x] **Step 2: Create `scripts/migrate-posts.mjs`**

  ```js
  // One-shot: convert _posts/*.markdown → src/content/posts/<slug>.md
  // - Maps Jekyll frontmatter to the new schema (title, description, date, tags)
  //   and drops fields we don't use (layout, image, headerImage, author, blog,
  //   projects, hidden, jemoji, externalLink, star).
  // - Converts {% highlight LANG %}…{% endhighlight %} blocks to fenced code blocks.
  // Run with: node scripts/migrate-posts.mjs

  import fs from 'node:fs';
  import path from 'node:path';

  const srcDir = '_posts';
  const outDir = 'src/content/posts';
  fs.mkdirSync(outDir, { recursive: true });

  // Naive YAML frontmatter parser sufficient for our 3 posts.
  // Handles: scalar values, quoted strings, single-line lists [a, b],
  // and the multi-line `tag:\n- foo\n- bar` list shape.
  function parseFrontmatter(text) {
    const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) return { meta: {}, body: text };
    const head = m[1];
    const body = text.slice(m[0].length);
    const meta = {};
    const lines = head.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const kv = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
      if (!kv) { i++; continue; }
      const key = kv[1];
      let val = kv[2].trim();
      if (val === '' && i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        const items = [];
        i++;
        while (i < lines.length && lines[i].startsWith('- ')) {
          items.push(lines[i].slice(2).trim());
          i++;
        }
        meta[key] = items;
        continue;
      }
      val = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      meta[key] = val;
      i++;
    }
    return { meta, body };
  }

  function convertLiquidHighlights(body) {
    return body
      .replace(/\{%\s*highlight\s+raw\s*%\}/g, '```')
      .replace(/\{%\s*highlight\s+([a-zA-Z0-9_-]+)\s*%\}/g, '```$1')
      .replace(/\{%\s*endhighlight\s*%\}/g, '```');
  }

  function deriveSlug(filename) {
    return filename.replace(/\.markdown$|\.md$/, '');
  }

  function deriveDate(filename, fmDate) {
    const m = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    if (typeof fmDate === 'string') return fmDate.split(' ')[0];
    return new Date().toISOString().slice(0, 10);
  }

  function normalizeTags(meta) {
    const raw = meta.tags ?? meta.tag;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return [String(raw)];
  }

  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.markdown') || f.endsWith('.md'));
  for (const file of files) {
    const text = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const { meta, body } = parseFrontmatter(text);

    const title = meta.title || deriveSlug(file);
    const description = meta.description || '';
    const date = deriveDate(file, meta.date);
    const tags = normalizeTags(meta);
    const newBody = convertLiquidHighlights(body).trimStart();

    const fm = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `description: ${JSON.stringify(description)}`,
      `date: ${date}`,
      tags.length > 0
        ? `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`
        : null,
      '---',
      '',
      newBody,
    ].filter((l) => l !== null).join('\n');

    const slug = deriveSlug(file);
    const out = path.join(outDir, `${slug}.md`);
    fs.writeFileSync(out, fm);
    console.log(`  wrote ${out}`);
  }
  console.log(`\nDone. ${files.length} post files written.`);
  ```

- [x] **Step 3: Run the script**

  ```bash
  mkdir -p scripts
  node scripts/migrate-posts.mjs
  ```
  Expected: prints 3 lines, one per post, then `Done. 3 post files written.`

- [x] **Step 4: Spot-check the converted content**

  Run: `cat src/content/posts/2015-07-29-first-python-flask-application.md`
  Expected: new frontmatter (title, description, date, tags), Liquid `{% highlight python %}` blocks replaced with fenced ```` ```python ```` blocks.

- [x] **Step 5: Patch the two theme-demo posts that have an empty `description`**

  The `2016-01-23-indigo-jekyll-theme` and `2016-02-24-markdown-common-elements` posts had descriptions in the original; the converter should have picked them up. If `description` ended up empty in either generated file, manually set:
  - `indigo-jekyll-theme`: `"A simple and minimalist Jekyll theme — example post from the original Indigo template."`
  - `markdown-common-elements`: `"A reference of common Markdown elements — example post from the original Indigo template."`

  Note these were originally `author: johndoe` (theme placeholder content). We're keeping them as-is per Jay's call; he can prune in place after launch.

- [x] **Step 6: Verify build**

  Run: `npm run build`
  Expected: `Complete!`. `dist/posts/<slug>/index.html` exists for all 3 posts. `dist/rss.xml` contains 3 `<item>` entries.

- [x] **Step 7: Verify in dev server**

  Run: `npm run dev`
  Open `http://localhost:4321`. Expected: the "Writing" section now shows 3 entries, newest first. Click each — body renders correctly, code blocks have syntax highlighting.

- [x] **Step 8: Delete the migration script**

  ```bash
  rm scripts/migrate-posts.mjs
  ```

- [x] **Step 9: Commit**

  ```bash
  git add src/content/posts/
  git commit -m "Migrate 3 existing posts to Astro content collection"
  ```

---

## Task 14 — Migrate projects (one-shot script)

Convert `_data/projects.json` (14 hackathon entries) into 14 individual Markdown files under `src/content/projects/`. Use a small Node script that runs once, then delete the script.

**Files:**
- Create temporarily: `scripts/migrate-projects.mjs`
- Create: `src/content/projects/<slug>.md` × 14
- Delete after run: `scripts/migrate-projects.mjs`

- [x] **Step 1: Inspect the source data**

  Run: `cat _data/projects.json | head -25`
  Confirm shape: top-level object has `hackathons.content[]`, each entry has `name`, `link`, and `hackathon: { name, date: { month, year } }`.

- [x] **Step 2: Create `scripts/migrate-projects.mjs`**

  ```js
  // One-shot: convert _data/projects.json → src/content/projects/<slug>.md
  // Source shape: { hackathons: { name, content: [ { name, link, hackathon: { name, date: { month, year } } } ] } }
  // Run with: node scripts/migrate-projects.mjs
  // Safe to re-run; overwrites existing files.

  import fs from 'node:fs';
  import path from 'node:path';

  const src = JSON.parse(fs.readFileSync('_data/projects.json', 'utf8'));
  const outDir = 'src/content/projects';
  fs.mkdirSync(outDir, { recursive: true });

  const slugify = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const entries = src?.hackathons?.content ?? [];
  if (entries.length === 0) {
    console.error('No entries found at hackathons.content — check the JSON shape.');
    process.exit(1);
  }

  // Track slugs to dedupe (the existing JSON has duplicate names like "Bump It Up"
  // and "Google Notepad Extension" pointing at the same repo).
  const used = new Set();
  let written = 0;
  for (const e of entries) {
    const name = e.name ?? 'Untitled';
    const link = e.link ?? '';
    const hackathonName = e?.hackathon?.name ?? '';
    const yearRaw = e?.hackathon?.date?.year ?? '';
    const year = Number(String(yearRaw).match(/\d{4}/)?.[0] ?? new Date().getFullYear());

    let slug = slugify(name);
    let attempt = 1;
    while (used.has(slug)) {
      attempt++;
      slug = `${slugify(name)}-${attempt}`;
    }
    used.add(slug);

    const blurb = hackathonName ? `Built at ${hackathonName}.` : '';

    const fm = [
      '---',
      `name: ${JSON.stringify(name)}`,
      `blurb: ${JSON.stringify(blurb)}`,
      `year: ${year}`,
      `status: archived`,
      link
        ? `links:\n  - label: "Project"\n    url: ${JSON.stringify(link)}`
        : `links: []`,
      `hasPage: false`,
      '---',
      '',
    ].join('\n');

    const file = path.join(outDir, `${slug}.md`);
    fs.writeFileSync(file, fm);
    written++;
    console.log(`  wrote ${file}`);
  }
  console.log(`\nDone. ${written} project files written.`);
  ```

- [x] **Step 3: Run the script**

  ```bash
  mkdir -p scripts
  node scripts/migrate-projects.mjs
  ```
  Expected: prints 14 lines, one per project, then `Done. 14 project files written.` (Note: two entries — "Bump It Up" and "Google Notepad Extension" — share a GitHub URL; both files are still created with deduped slugs.)

- [x] **Step 4: Spot-check one of the generated files**

  Run: `cat src/content/projects/$(ls src/content/projects | head -1)`
  Expected: valid frontmatter with `name`, `blurb` ("Built at …"), `year`, `status: archived`, `links`, `hasPage: false`.

- [x] **Step 5: Verify build**

  Run: `npm run build`
  Expected: `Complete!`. No `dist/projects/<slug>/` routes (all `hasPage: false`).

- [x] **Step 6: Verify in dev server**

  Run: `npm run dev`
  Open `http://localhost:4321`. Expected: "Projects" section now lists 14 entries, reverse-chronological by year. Each name links out to the original `link` URL.

- [x] **Step 7: Delete the migration script**

  ```bash
  rm scripts/migrate-projects.mjs
  rmdir scripts 2>/dev/null || true
  ```

- [x] **Step 8: Commit**

  ```bash
  git add src/content/projects/
  git commit -m "Migrate 14 hackathon projects to Astro content collection"
  ```

---

## Task 15 — Migrate static assets (CNAME, resume, images)

Move site-root files into `public/` so Astro emits them at the site root unchanged.

**Files:**
- Move: `CNAME` → `public/CNAME`
- Move: `assets/JayRavaliya_Resume.pdf` → `public/JayRavaliya_Resume.pdf`
- Move: `assets/images/<files referenced by ported posts>` → `public/assets/images/<same names>`

- [x] **Step 1: Move CNAME**

  ```bash
  git mv CNAME public/CNAME
  cat public/CNAME
  ```
  Expected: `jayravaliya.com`.

- [x] **Step 2: Move resume PDF**

  ```bash
  git mv assets/JayRavaliya_Resume.pdf public/JayRavaliya_Resume.pdf
  ```

- [x] **Step 3: Identify which images the ported posts reference**

  Run:
  ```bash
  grep -rho '/assets/images/[^)" ]*' src/content/posts/ | sort -u
  ```
  This lists every image path the new posts reference. Note the filenames.

- [x] **Step 4: Move just those images to `public/assets/images/`**

  ```bash
  mkdir -p public/assets/images
  ```
  For each filename from Step 3:
  ```bash
  git mv assets/images/<filename> public/assets/images/<filename>
  ```
  (If a referenced file isn't in `assets/images/`, fix the post's reference instead.)

- [x] **Step 5: Verify build**

  Run: `npm run build`
  Then: `ls dist`
  Expected: `CNAME` and `JayRavaliya_Resume.pdf` present at the root of `dist/`. `dist/assets/images/` contains the moved images.

- [x] **Step 6: Spot-check that a post page references the image correctly**

  Run: `npm run dev`
  Open a post that uses an image. Confirm the image loads.

- [x] **Step 7: Commit**

  ```bash
  git add public/
  # any unmoved assets/images/ files will get cleaned up in the next task
  git commit -m "Move CNAME, resume PDF, and referenced post images into public/"
  ```

---

## Task 16 — Delete Jekyll scaffolding

Now that everything has been ported, delete the Jekyll-era files.

**Files:**
- Delete: `_config.yml`, `_layouts/`, `_includes/`, `_sass/`, `_data/`, `_posts/`, `_legacy_package.json`
- Delete: `.travis.yml`, `Gemfile`, `Gemfile.lock`, `Rakefile`, `travis.sh`, `.editorconfig`
- Delete: `index.html`, `about.md`, `projects.html`, `tags.html`, `blog/`
- Delete: `.jekyll-cache/`, `_site/` (if present)
- Delete: any leftover `assets/` (Jekyll-only, after Task 15 moved keepers to `public/`)

- [x] **Step 1: Inspect what's about to be deleted**

  Run: `ls -la`
  Make a mental list of files to remove. Cross-check against the file list above.

- [x] **Step 2: Delete Jekyll source dirs and files**

  ```bash
  git rm -rf _config.yml _layouts _includes _sass _data _posts _legacy_package.json
  git rm -rf .travis.yml Gemfile Gemfile.lock Rakefile travis.sh .editorconfig
  git rm -rf index.html about.md projects.html tags.html blog
  ```

- [x] **Step 3: Delete `assets/` if anything remains**

  ```bash
  ls assets 2>/dev/null && git rm -rf assets || true
  ```

- [x] **Step 4: Delete build/cache dirs (untracked)**

  ```bash
  rm -rf .jekyll-cache _site
  ```

- [x] **Step 5: Verify the repo is now Astro-only**

  Run: `ls -la`
  Expected files at root: `.git`, `.github` (added in next task), `.gitignore`, `.claude`, `astro.config.mjs`, `docs`, `node_modules`, `package-lock.json`, `package.json`, `public`, `README.md`, `src`, `tsconfig.json`. No Jekyll files.

- [x] **Step 6: Verify build still passes**

  Run: `npm run build`
  Expected: `Complete!`.

- [x] **Step 7: Commit**

  ```bash
  git commit -m "Delete Jekyll scaffolding now that Astro site is in place"
  ```

---

## Task 17 — GitHub Actions deploy workflow

Build on push to `main`, publish via `actions/deploy-pages`.

**Files:**
- Create: `.github/workflows/deploy.yml`

- [x] **Step 1: Create `.github/workflows/deploy.yml`**

  ```yaml
  name: Deploy site to GitHub Pages

  on:
    push:
      branches: [main]
    workflow_dispatch:

  permissions:
    contents: read
    pages: write
    id-token: write

  concurrency:
    group: pages
    cancel-in-progress: true

  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - name: Checkout
          uses: actions/checkout@v4

        - name: Setup Node
          uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: npm

        - name: Install dependencies
          run: npm ci

        - name: Build site
          run: npm run build

        - name: Upload Pages artifact
          uses: actions/upload-pages-artifact@v3
          with:
            path: ./dist

    deploy:
      needs: build
      runs-on: ubuntu-latest
      environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
      steps:
        - name: Deploy to GitHub Pages
          id: deployment
          uses: actions/deploy-pages@v4
  ```

- [x] **Step 2: One-time repo settings change**

  Open the repo's Pages settings on GitHub (Settings → Pages). Change **Source** from "Deploy from a branch" to **"GitHub Actions"**. (This step is manual — the engineer needs the user to do it, or the user does it themselves before the first deploy.)

- [x] **Step 3: Commit**

  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "Add GitHub Actions workflow to build and deploy via Pages"
  ```

---

## Task 18 — Final verification & PR

Confirm the site builds, smoke-test the dev server, then open a PR.

- [ ] **Step 1: Clean build from scratch**

  ```bash
  rm -rf dist .astro node_modules
  npm ci
  npm run build
  ```
  Expected: build succeeds end-to-end with no warnings beyond the Source Serif font import.

- [ ] **Step 2: Spot-check `dist/`**

  ```bash
  ls dist
  ls dist/posts
  ls dist/projects 2>/dev/null || echo "(no project detail pages — expected, hasPage:false everywhere)"
  cat dist/CNAME
  test -f dist/JayRavaliya_Resume.pdf && echo "resume present"
  test -f dist/rss.xml && echo "rss present"
  test -f dist/sitemap-index.xml && echo "sitemap present"
  test -f dist/404.html && echo "404 present"
  ```

- [ ] **Step 3: Dev server walkthrough**

  Run: `npm run dev`
  Walk through:
  1. `/` — hero, `/now` hidden, Writing list (3 posts), Projects list (14 entries).
  2. Click each Writing entry — post renders with title/date, body, prev/next nav.
  3. Click a Projects entry — opens external link (since all `hasPage: false`).
  4. `/404` — your custom 404 renders.
  5. Theme toggle works in both directions.
  6. OS theme change is honored when localStorage is cleared (Application → Local Storage → delete `theme` → reload).

  Ctrl+C when done.

- [ ] **Step 4: Push the branch**

  ```bash
  git push -u origin redesign
  ```

- [ ] **Step 5: Open a PR**

  ```bash
  gh pr create --title "Redesign: rebuild on Astro 5" --body "$(cat <<'EOF'
  ## Summary
  - Replace Jekyll/Indigo theme with a minimal Astro 5 site per the design spec
  - Editorial vibe (warm serif, calm palette, auto/light/dark with toggle)
  - Single-page hub layout: hero, optional /now, writing list, projects list
  - All 3 existing posts and all 14 hackathon projects ported as-is
  - GitHub Actions workflow deploys to Pages on push to main

  Spec: docs/superpowers/specs/2026-04-25-site-redesign-design.md
  Plan: docs/superpowers/plans/2026-04-25-site-redesign.md

  ## Pre-merge checklist
  - [ ] Confirm Pages source is set to "GitHub Actions" in repo settings
  - [ ] Spot-check live preview after first deploy
  - [ ] Verify CNAME still resolves jayravaliya.com to Pages

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```

  Expected: PR URL printed.

- [ ] **Step 6: After PR merges**

  - Watch the Action run.
  - Visit `https://jayravaliya.com` — confirm it serves the new site.
  - If anything's broken, hotfix on `main` (small surface, fast iteration).

---

## Post-launch follow-ups (not in this plan)

These are tracked in the spec under "Open follow-ups" — none block the redesign:

- Curate hackathon projects (flip `status` or delete entries).
- Decide whether the two theme-demo posts stay long-term.
- Drop a real `/now` content file when ready.
- Replace resume PDF when new one is ready.
- Add `.claude/commands/` slash commands if content-publishing flows get repetitive.
