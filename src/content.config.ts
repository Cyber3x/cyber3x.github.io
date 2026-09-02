import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    image: z.string().default("/static/blog-placeholder.png"),
    public: z.boolean().default(false),
  }),
});

/**
 * Machines listed on /computer. One Markdown file per machine: specs and metadata
 * in frontmatter, the story of the machine in the body.
 */
const computers = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/computers" }),
  schema: z.object({
    /** Short codename used as the heading and anchor, e.g. "b4r45u". */
    name: z.string(),
    /** What the machine actually is, e.g. "Lenovo ThinkPad X1 Carbon Gen 12". */
    title: z.string(),
    /** One-line role, e.g. "daily driver", "home server", "media center". */
    role: z.string(),
    status: z.enum(["active", "retired"]).default("active"),
    /** Year acquired, and year retired if it is no longer in use. */
    since: z.number().int().optional(),
    until: z.number().int().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    /** Ordered spec rows, rendered as a two-column list. */
    specs: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .default([]),
    /** Related posts or external pages. */
    links: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    /** Lower numbers first. Ties fall back to status (active first), then name. */
    order: z.number().default(100),
    public: z.boolean().default(true),
  }),
});

/**
 * Sections listed on /software. One Markdown file per section (e.g. Firefox extensions,
 * CLI tools). Items live in frontmatter like machine specs; the filename becomes the
 * section's anchor; an optional body renders as prose above the list.
 */
const software = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/software" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    /** Lower numbers first in the tree and on the page. */
    order: z.number().default(100),
    items: z
      .array(
        z.object({
          name: z.string(),
          url: z.url().optional(),
          note: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

export const collections = { posts, computers, software };
