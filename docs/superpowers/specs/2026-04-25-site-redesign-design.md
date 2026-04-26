# Personal site redesign — design spec

**Date:** 2026-04-25
**Owner:** Jay Ravaliya
**Status:** Design approved, ready for implementation plan

## Context

The current site at `jayravaliya.com` is a Jekyll site on the vendored Indigo theme (Sergio Kopplin), unchanged in aesthetic since ~2016. Three sample posts from 2015–2016 still live in `_posts/`; the projects page is driven by a JSON file of 14 hackathon entries; the resume PDF is linked from the nav.

The site needs to do three jobs going forward:

1. Signal "engineer working on the cutting edge of AI in 2026" — the current Indigo theme actively undercuts this.
2. Be a low-friction publishing surface for blog posts and project entries, drafted in conversation with Claude and committed straight to the repo.
3. Stay on the existing custom domain (`jayravaliya.com`) and continue to be hosted from this GitHub repo.

Hosting and CNAME stay; everything else gets rebuilt.

## Decisions at a glance

| Area | Decision |
|---|---|
| Vibe | Editorial — warm serif, calm palette, writer's voice |
| Stack | Astro 5.x, vanilla CSS, TypeScript, content collections |
| Hosting | GitHub Pages, custom domain `jayravaliya.com` |
| Build | GitHub Actions → `actions/deploy-pages@v4`, no `gh-pages` branch |
| Layout | Single-page hub: bio → /now → writing → projects |
| Sitemap | Minimal: `/`, `/posts/<slug>/`, `/projects/<slug>/` (no archive pages) |
| Color mode | Auto (respect `prefers-color-scheme`) with manual toggle, persisted in `localStorage` |
| Typography | Source Serif 4 (variable, self-hosted) for body/headings; system sans for UI; system mono for code |
| Tagline | *Software engineer. I build with AI and write about it.* |
| Content workflow | Markdown files + frontmatter; Claude drafts in conversation, commits + pushes; no CMS |
| Resume | Removed from nav; PDF stays at `public/JayRavaliya_Resume.pdf` so old links resolve |
| Migration | Port all 3 existing posts and all 14 hackathon projects as-is; prune later |

## Architecture & stack

- **Astro 5.x** as the static site generator. Use Astro content collections (typed, schema-validated frontmatter via Zod).
- **Vanilla CSS** with custom properties for theming. PostCSS for nesting. No CSS framework; the surface area is small enough that vanilla wins on output size, control, and longevity.
- **TypeScript** for any inline scripts (theme toggle).
- **Hosting:** GitHub Pages.
- **Custom domain:** `jayravaliya.com` via existing CNAME (moved into `public/CNAME` so Astro emits it at the site root). No DNS changes required.
- **Build/deploy:** `.github/workflows/deploy.yml` runs on push to `main`. Steps: checkout → setup Node 20 with cache → `npm ci` → `npm run build` → upload `dist/` as Pages artifact → `actions/deploy-pages@v4`. Repo Pages source is set to "GitHub Actions" (one-time settings change).
- **Repo layout:** standard Astro (`src/`, `public/`, `astro.config.mjs`, `package.json`, `tsconfig.json`).
- **Plugins:** `@astrojs/sitemap` (auto sitemap), `@astrojs/rss` (RSS feed). No analytics, no comments, no newsletter.

## Information architecture

Three URL patterns and a small set of infrastructure files. No archive pages.

```
/                              hub: bio, /now block (if present), writing list, projects list
/posts/<slug>/                 individual post page
/projects/<slug>/              individual project page (only when hasPage: true)
/rss.xml                       full posts feed
/sitemap-index.xml             auto-generated
/robots.txt                    keeps existing
/404.html                      custom 404 in editorial style
/JayRavaliya_Resume.pdf        legacy resume (still resolves so old links don't 404)
```

Rationale for "minimal" — there's no `/writing` archive, no `/projects` archive, no `/about`. The home page IS the index. The bio above the fold IS the about page. Detail pages exist only when they have something extra to say.

## Home page composition

Single column, ~720px max content width, generous whitespace. Top to bottom:

1. **Header strip** — small. Wordmark "Jay Ravaliya" left; theme toggle (sun/moon icon) right. No nav links.
2. **Hero** — name as `<h1>`, tagline beneath in italic serif: *"Software engineer. I build with AI and write about it."* Inline social links underneath: GitHub, X/Twitter, LinkedIn, email — small, muted, no icons-as-decoration.
3. **`/now` block** — appears only when `src/content/now.md` exists. Bordered block, "NOW" label, body rendered as Markdown.
4. **Writing section** — heading "Writing." All posts (excluding `draft: true`), reverse-chronological. Each row: title (link to `/posts/<slug>/`), date, one-line `description` from frontmatter. No pagination. Section hidden entirely if 0 posts.
5. **Projects section** — heading "Projects." All projects, reverse-chronological by `year` (ties broken alphabetically by `name`). Each row: name, blurb, small "→" link. Name links to `/projects/<slug>/` if `hasPage: true`, else to `links[0].url`. Section hidden entirely if 0 projects.
6. **Footer** — copyright, "Built with Astro," theme credit (optional).

No images on the home page. Editorial vibe stays type-only. Inline images allowed inside post bodies; project detail pages may include screenshots.

## Post page (`/posts/<slug>/`)

- Header strip identical to home (wordmark + theme toggle), with the wordmark linking back to `/`.
- Article header: post title (`<h1>`), date, optional tags as small inline labels.
- Body: Markdown rendered with Shiki for syntax highlighting (theme matches light/dark site mode), standard remark plugins for footnotes and GFM tables.
- Footer of article: prev/next post links by date (when applicable). No "related posts," no comments, no share buttons.
- Same site footer as home.

## Project page (`/projects/<slug>/`)

Only generated when `hasPage: true` for that entry.

- Header strip identical to home.
- Article header: project name, year, status badge (Live / WIP / Archived).
- Body: Markdown — anything you want to say about it. Supports inline images.
- Links block at the bottom: each `links[]` entry rendered as a labeled link.
- Same site footer as home.

## Theming

Defined as CSS custom properties on `:root`. Swapped via `@media (prefers-color-scheme: dark)` and a `[data-theme="dark"|"light"]` attribute on `<html>` when the user toggles manually.

**Light palette** (warm cream paper):
- `--bg`: `#f7f3ec`
- `--text`: `#1a1a1a`
- `--text-muted`: `#6b5d48`
- `--label`: `#998870` (uppercase metadata, dates)
- `--border`: `#d8cfc0`
- `--accent`: `#a14a16` (deep rust; used for links)

**Dark palette** (warm off-black; explicitly not cold/clinical):
- `--bg`: `#15130f`
- `--text`: `#ebe6db`
- `--text-muted`: `#c9beab`
- `--label`: `#a8957a`
- `--border`: `#2c2820`
- `--accent`: `#e0a060` (softer amber; used for links)

**Theme toggle behavior:**
- Sun/moon icon button in the header strip.
- On click: toggles `[data-theme]` on `<html>`, writes choice to `localStorage["theme"]`.
- On page load: an inline `<script>` in `<head>` reads `localStorage["theme"]` and sets `[data-theme]` *before paint* to avoid the flash.
- If no localStorage value, no `[data-theme]` is set; the OS preference wins via the media query.

## Typography

- **Body / headings:** Source Serif 4 (variable font), self-hosted via `@fontsource-variable/source-serif-4`. No Google Fonts call.
- **UI / labels / metadata:** `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Code:** `ui-monospace, "SF Mono", Menlo, Consolas, monospace`.
- **Body baseline:** 18px, line-height 1.6.
- **Type scale:** modest and editorial. Headings use weight + size, not loud color.

## Content model

Three Astro content collections, all schema-validated.

### `src/content/posts/<slug>.md`

```ts
{
  title: string,
  description: string,        // ~1 line; shown on home + as <meta description>
  date: Date,
  draft: boolean,             // default false; drafts skipped at build
  tags: string[]              // optional
}
```

Body: Markdown. Standard support — code blocks via Shiki, footnotes, tables, inline images.

### `src/content/projects/<slug>.md`

```ts
{
  name: string,
  blurb: string,              // ~1 line
  year: number,
  status: 'live' | 'wip' | 'archived',  // default 'live'
  links: { label: string, url: string }[],
  hasPage: boolean            // default false; true → render /projects/<slug>/
}
```

Body: Markdown. Only rendered when `hasPage: true`.

### `src/content/now.md` (singleton, optional)

No frontmatter required. Body is Markdown. Home page renders the block iff this file exists.

## Claude content workflow

No CMS. No slash commands at the start. The working flow:

1. Jay (in conversation): "Write a post about X — here's the gist." (Or: "Add a new project entry for Y.")
2. Claude: drafts the file under `src/content/posts/` or `src/content/projects/`, presents it for review.
3. Jay: requests edits.
4. Claude: applies edits, then `git add / commit / push` to `main`. The GitHub Action deploys.
5. Jay: spot-checks the live site.

`/now` follows the same loop, just overwriting `src/content/now.md`.

**Drafts:** set `draft: true` to stage half-written posts in the repo without publishing.

**Future slash commands:** add to `.claude/commands/` *only* once a flow has proven repetitive and friction-y. Candidates we might want later: "promote draft," "import GitHub repo as project card." Not building these now.

## Build & deploy

- Local dev: `npm run dev` → `http://localhost:4321`.
- Build: `npm run build` → `dist/`.
- `.github/workflows/deploy.yml`:
  - Triggers: push to `main`, manual `workflow_dispatch`.
  - Permissions: `pages: write`, `id-token: write`.
  - Concurrency: one deploy at a time, cancel in-progress on new push.
  - Steps: checkout → `actions/setup-node@v4` (Node 20, npm cache) → `npm ci` → `npm run build` → `actions/upload-pages-artifact@v3` (path `./dist`) → `actions/deploy-pages@v4`.
- Repo settings change (one-time): Pages → Source → "GitHub Actions."
- `CNAME` lives at `public/CNAME` so Astro emits it at site root unchanged.

## Migration plan

Done as a single PR on a `redesign` branch.

1. **Scaffold Astro** with `npm create astro@latest`. Add content collections, sitemap plugin, RSS plugin, Source Serif 4 font package.
2. **Delete Jekyll scaffolding:** `_config.yml`, `_layouts/`, `_includes/`, `_sass/`, `_data/`, `_posts/` (after porting), `.travis.yml`, `Gemfile`, `Gemfile.lock`, `Rakefile`, `travis.sh`, the existing `package.json`, `index.html`, `about.md`, `projects.html`, `tags.html`, `blog/`, `.jekyll-cache/`. Recoverable from git history.
   - **Images in `assets/images/`:** any image still referenced by a ported post moves to `public/assets/images/` so existing `/assets/images/<file>` paths in post Markdown keep resolving. Theme-only images (profile shots used by Indigo's header, etc.) get dropped.
3. **Port all 3 posts** from `_posts/` → `src/content/posts/`. Map old frontmatter to new shape (`title`, `description`, `date`, `tags`). Drop fields not in the new schema (`layout`, `image`, `headerImage`, `author`, `blog`). Keep slugs as-is. Old post URLs were `/<title>/`; new URLs are `/posts/<slug>/` — mismatch acknowledged, not adding redirects (audience for these specific posts is effectively zero).
4. **Port all 14 projects** from `_data/projects.json` → individual files in `src/content/projects/`. Each entry maps to:
   - `name` ← existing name
   - `year` ← parsed from existing date
   - `blurb` ← `"Built at <hackathon>"` (auto-filled; can be hand-edited later)
   - `links: [{ label: 'Project', url: <existing link> }]`
   - `hasPage: false`
   - `status: 'archived'`
5. **CNAME** moves to `public/CNAME`.
6. **Resume PDF** stays at `public/JayRavaliya_Resume.pdf`. Removed from any nav.
7. **`.claude/settings.local.json`** preserved as-is.
8. **`.gitignore`** updated for Node (`node_modules/`, `dist/`, `.astro/`).
9. **Pages settings** flipped to "GitHub Actions" source.
10. **First deploy:** verify on a Pages preview, then merge to `main`.

## Out of scope (intentional)

- Analytics
- Comments / newsletter / Webmentions
- `/about`, `/uses`, `/tags`, `/reading`, `/now` *as a separate route* — `/now` is an inline block, not a page
- Search
- A "kickoff" blog post (nice to have, not blocking)
- Curating/pruning the ported hackathon projects (do in place after launch)
- Curating/pruning the ported posts (do in place after launch)
- New resume (drop in when ready by replacing the PDF)
- Redirects from old `/<title>/` URLs to new `/posts/<slug>/` URLs

## Open follow-ups (post-launch)

- Decide which hackathon projects to keep as `status: 'live'` vs. drop.
- Decide whether to keep the two theme-demo posts long-term or prune.
- First real `/now` content drop.
- New resume PDF when ready.
- Add `.claude/commands/` slash commands if/when content-publishing flows get repetitive.
