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
