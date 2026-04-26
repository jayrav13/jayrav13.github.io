# jayravaliya.com

Personal site of [Jay Ravaliya](https://jayravaliya.com). Built with [Astro](https://astro.build), deployed to GitHub Pages.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
```

## Build

```bash
npm run build    # output: dist/
npm run preview  # serve the built site locally
```

## Deploy

Push to `main`. The workflow at `.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages on every commit.

## Layout

- `src/pages/` — routes (`index.astro`, `404.astro`, `posts/[slug].astro`, `projects/[slug].astro`, `rss.xml.ts`)
- `src/content/posts/` — long-form writing (Markdown)
- `src/content/projects/` — projects index (Markdown frontmatter)
- `src/content.config.ts` — Zod schemas for both collections
- `src/components/` — page sections (Hero, WritingList, ProjectList, etc.)
- `src/layouts/` — page shells (BaseLayout, ArticleLayout)
- `src/styles/` — theme tokens, global styles, prose styles
- `src/site.ts` — site name + tagline
- `public/` — files served verbatim at the site root (CNAME, resume, etc.)
