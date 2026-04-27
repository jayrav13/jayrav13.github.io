# CLAUDE.md — jayrav13.github.io / jayravaliya.com

## This site does not own the entire domain

This repo (https://github.com/jayrav13/jayrav13.github.io) is the user-pages site, served at `jayravaliya.com` via CNAME. **It does not own the entire domain.** Any other repo under `jayrav13/<name>` that has GitHub Pages enabled automatically also serves at:

```
https://jayravaliya.com/<repo-name>/*
```

GitHub does not coordinate route conflicts between project-pages and user-pages: if this Astro site declares a route at `/<repo-name>/...` AND a project-pages repo of the same name exists, behavior is undefined / depends on which Pages build serves the path first. **Avoid colliding** — top-level Astro routes must not match the name of any sibling Pages-enabled repo, and vice versa.

## Currently-known sibling Pages repos

This list is the single source of truth — none of the sibling repos carry their own copy. Keep it in sync as new gems / projects launch their own Pages site.

| Sibling repo | Owns path | Notes |
|---|---|---|
| https://github.com/jayrav13/ruby-pure-greeks | `/ruby-pure-greeks/*` | Docs site for the `pure_greeks` Ruby gem. Source is `main` / `/docs`, Jekyll cayman theme. |

## When to update this list

- A sibling repo enables GitHub Pages → add a row.
- A sibling repo is renamed → update the path column.
- A sibling repo disables Pages or moves docs elsewhere → remove the row.

## When the list affects decisions on this Astro site

Before adding any top-level route to this site (anything under `src/pages/<name>/`, or any redirect rule, or any new page collection), check the list above. If `<name>` matches a sibling repo, the project-pages site for that repo is going to shadow or be shadowed by your new Astro route. Pick a different name or coordinate explicitly.

## Routes currently served by THIS Astro site

(Best-effort — confirm against `src/pages/` if making changes.)

- `/` — landing
- `/projects` — project list
- `/posts` — blog post list

`/pages` is currently free if you want a namespaced sub-path for things like sibling-Pages aliasing.
