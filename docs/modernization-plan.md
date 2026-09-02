# Stack modernization plan

Baseline (2026-09-02): Astro 5.1, Tailwind 3.4 via `@astrojs/tailwind`, legacy content
collections API, Node 18 in CI, `peaceiris/actions-gh-pages` deploy to `gh-pages` branch.
Build passes and produces 7 routes: `/`, `/posts`, 5 post pages, plus `robots.txt`,
`rss.xml`, `sitemap-index.xml`.

Targets: Astro 7.x, Tailwind 4.x via `@tailwindcss/vite`, Content Layer API, Node 22 LTS,
official `withastro/action` deploy. Public URLs must not change.

Workflow: one phase per PR `dev` -> `main`. Each phase must pass `npm run build`
(`astro check` + build), keep the same route list in `dist/`, and be eyeballed with
`npm run preview` in light and dark mode (fonts, heading colors, code blocks, theme
toggle, post list, RSS, sitemap) before moving on.

Rationale for the order: the Content Layer migration works on Astro 5 and is required by
Astro 6+. Tailwind 4 is supported from Astro 5.2 and `@astrojs/tailwind` blocks Astro 7,
so Tailwind goes before the Astro bump. Astro 6+ needs Node >= 22.12, so CI Node must be
bumped before or with the Astro upgrade.

---

## Phase 1: Prep and safety net

- [x] Add `clsx` as an explicit dependency (used in `src/lib/utils.ts`, only present
      transitively today).
- [x] Add `"engines": { "node": ">=22.12" }` to `package.json` and a `.nvmrc` with `22`.
- [x] In `.github/workflows/deploy.yml`: `actions/checkout@v3` -> `@v5`,
      `actions/setup-node@v3` -> `@v5`, `node-version: 18` -> `22`. This is a stopgap;
      the workflow is replaced in Phase 5.
- [x] Rename `package.json` `name` from `miniblog` to `blog.nlukic.com` (cosmetic).
- [x] Record the baseline: `npm run build` and save the list of files under `dist/` to
      compare against after each phase.

Verify: build passes, deploy on merge still works.

## Phase 2: Content Layer API (still on Astro 5)

- [x] Move `src/content/config.ts` -> `src/content.config.ts`.
- [x] Replace `type: "content"` with
      `loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/posts" })`
      (`glob` from `astro/loaders`). Import `z` from `astro/zod` instead of
      `astro:content` (required in Astro 6+).
- [x] Posts stay in `src/content/posts/`. With the glob loader the entry `id` is the
      filename without extension, so it equals the old `slug` and URLs are unchanged.
- [x] `src/pages/posts/[...slug].astro`: `post.slug` -> `post.id`,
      `await post.render()` -> `await render(post)` with `render` imported from
      `astro:content`.
- [x] `src/pages/posts/index.astro` and `src/pages/rss.xml.js`: `post.slug` -> `post.id`.
- [x] Delete `.astro/` and rebuild to regenerate types.

Verify: same 5 post URLs in `dist/`, RSS links identical, no legacy-collections warning
in the build log.

## Phase 3: Tailwind 3 -> 4

- [x] `npx astro add tailwind` (installs `@tailwindcss/vite` and adds it to
      `vite.plugins` in `astro.config.mjs`). Remove `tailwind()` from `integrations`
      and uninstall `@astrojs/tailwind`. Delete `tailwind.config.ts`.
- [x] Rewrite the top of `src/styles/global.css`:
  - `@tailwind base/components/utilities` -> `@import "tailwindcss";`
  - `@custom-variant dark (&:where(.dark, .dark *));` keeps class-based dark mode
    driven by `<html class="dark">`, which the toggle script relies on.
  - `@theme { --font-sans: "Geist", ...; --font-mono: "Geist Mono", ...; }` replaces
    the `fontFamily` extension from `tailwind.config.ts`.
- [x] Border color: v4 defaults `border` to `currentColor` instead of `gray-200`. The
      site relies on the old default in `global.css` (inline code, `pre`, `img`,
      `video`, `kbd`, `th`, `td`, `blockquote`) and `ThemeToggle.astro`. Either add the
      documented compat rule in `@layer base` or add `border-zinc-200` explicitly next
      to each `border`. Prefer explicit classes; it is a handful of places.
- [x] `src/components/Header.astro` uses `@apply` inside a scoped `<style>`. In v4 that
      needs `@reference "../styles/global.css";` at the top of the style block. Simpler:
      drop the style block and put the classes on the three `<a>` tags.
- [x] Check renamed utilities. In use: `rounded`, `rounded-md`, `rounded-lg` (unchanged),
      `size-4`, `text-nowrap` (fine). Nothing uses `shadow`, `ring`, `outline-none`, or
      `!` prefixes. Nested `@apply` inside `@layer components` is supported by v4's
      native nesting.
- [x] `hover:` variants now sit behind `@media (hover: hover)`. Accept this; touch
      devices simply skip hover styles.
- [x] Bump tooling: `prettier-plugin-tailwindcss` -> 0.8.x and add
      `"tailwindStylesheet": "./src/styles/global.css"` to the prettier config;
      `tailwind-merge` -> 3.x (v4-aware class conflict rules). Note: the 0.8.x plugin
      crashes under Prettier 3.4, so `prettier`, `prettier-plugin-astro` and
      `prettier-plugin-astro-organize-imports` were bumped to latest at the same time.
- [x] Skipped `npx @tailwindcss/upgrade`; the migration was done by hand since the
      stylesheet is small.

Verify: light/dark heading colors, code block borders and Shiki dark override, theme
toggle button border, table borders, fonts loading (check the network tab for the two
woff2 files), `npm run format:check` passes.

## Phase 4: Astro 5 -> 7

- [ ] `npx @astrojs/upgrade` to bump `astro`, `@astrojs/mdx` (-> 8), `@astrojs/rss`,
      `@astrojs/sitemap`, `@astrojs/check`, `typescript`. Review its output; apply
      manually if it refuses on the major jump.
- [ ] `src/layouts/Layout.astro`: `ViewTransitions` -> `ClientRouter`
      (`import { ClientRouter } from "astro:transitions"`). The old name is removed
      in v6.
- [ ] Astro 7 compiler is Rust-based and strict about HTML: unclosed tags fail the
      build. Audit the four `.astro` files. Nothing suspicious found on first read, but
      the build will tell.
- [ ] Astro 7 default Markdown processor is Sätteri, not remark/rehype. This project
      uses no remark or rehype plugins, so no action. `shikiConfig.themes` (dual
      light/dark) is still supported; confirm the rendered `<pre>` still carries
      `.astro-code` and `--shiki-dark*` CSS variables that `global.css` overrides in
      dark mode. If the class or variable names changed, update the override.
- [ ] `compressHTML` default is now `'jsx'`. Check `src/pages/index.astro`: the space
      between `<span>Neven's</span>` and `blog.` is on the same line, so it should
      survive. If it does not, use `{" "}`.
- [ ] Zod 4 ships with Astro 6+. Schema uses `z.string()`, `z.coerce.date()`,
      `z.boolean()`, `.default()`: all fine.
- [ ] Shiki 4 ships with Astro 6+. Confirm `catppuccin-latte` and `catppuccin-mocha`
      are still bundled theme names.
- [ ] Vite 8 underneath. No custom Vite config beyond the Tailwind plugin.
- [ ] Remove `strictNullChecks` from `tsconfig.json` if `astro/tsconfigs/strict`
      already sets it (it does); keep the file minimal.

Verify: full build, route list unchanged, view transitions still animate between pages,
theme persists across navigation (the `astro:after-swap` hooks), code highlighting in
both themes, sitemap and RSS regenerate.

## Phase 5: Deploy workflow

- [ ] Replace `.github/workflows/deploy.yml` with the official pattern:
      `actions/checkout@v5` + `withastro/action@v6` (build job, `node-version: 22`) then
      `actions/deploy-pages@v5` (deploy job), with
      `permissions: { contents: read, pages: write, id-token: write }` and a
      `concurrency` group so overlapping pushes cancel.
- [ ] Move `CNAME` from the repo root to `public/CNAME` so it is copied into `dist/`
      and served by Pages. The root file is unused today (the old action wrote its own).
- [ ] Manual step, repo settings: Settings -> Pages -> Source -> "GitHub Actions".
      Until this is flipped the new workflow will fail on the deploy step.
- [ ] After the first successful deploy, delete the now-unused `gh-pages` branch.
- [ ] Add `.github/workflows/ci.yml` running on pull requests and pushes to `dev`:
      `npm ci`, `npm run build`, `npm run format:check`. Gives a red/green check on the
      `dev` -> `main` PR before anything hits production.

Verify: push to `main` deploys, `https://blog.nlukic.com` serves the new build with the
custom domain intact and HTTPS still enforced, `robots.txt` and `sitemap-index.xml`
resolve.

## Phase 6: Hygiene (optional, small)

- [ ] Drafts are hidden from the list and RSS but still built and included in the
      sitemap. Filter `public === false` out of `getStaticPaths` when
      `import.meta.env.PROD`, and pass a `filter` to the sitemap integration. Dev keeps
      rendering drafts for preview.
- [ ] Delete the four Miniblog template posts once the above lands, or keep them as
      local-only reference by prefixing filenames with `_` (the glob pattern skips
      `_*` files).
- [ ] Replace the template `README.md` with a short project README: what the site is,
      how to run it, how to add a post, how deploys work.
- [ ] `formatDate` uses `Intl.DateTimeFormat` as a plain call; `new` is not required but
      is the conventional form. Leave unless touching the file anyway.

---

## Out of scope for this plan

Design changes, new pages (about, projects), analytics, comments, and content work.
These come after the stack is current.
