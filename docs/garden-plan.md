# Digital garden plan

Goal: turn the blog into a personal site at `nlukic.com` with three sections that share one
layout, one build, and one deploy:

- `/posts` the blog (existing, dated, mostly frozen once published)
- `/notes` the garden: short notes written in Obsidian, edited in place, all public,
  cross-linked with wikilinks and backlinks
- `/uses` the stack: hardware, apps, CLI tools, services, as data rendered into grouped lists

Decisions already made (2026-09-02):

- Everything on one domain, sections as paths. No subdomains.
- Domain moves from `blog.nlukic.com` to the apex `nlukic.com`. Old blog URLs keep working
  through a path-preserving redirect.
- Notes are authored in Obsidian (or any external editor). The `web-notes/` folder in this
  repo is the vault and the source of truth. Everything in it is public. Private notes never
  enter the repo.
- Builds on the modernized stack: Astro 7, Tailwind 4, Content Layer API, official Pages
  action (see `modernization-plan.md`).

Workflow stays the same: one phase per PR `dev` -> `main`, build green, route list checked,
preview eyeballed in both themes.

---

## Phase 0: Close out hygiene from the modernization plan

Do this first; the garden multiplies the number of pages and the sitemap must be clean.

- [x] Posts with `public: false` are excluded from `getStaticPaths` when
      `import.meta.env.PROD` and from RSS (already). No sitemap filter needed: the sitemap
      is generated from built pages, so unbuilt drafts never appear. Dev keeps rendering
      drafts.
- [x] Delete the four Miniblog template posts (`lorem-ipsum`, `making-miniblog`,
      `customizing-miniblog`, `markdown-style-guide`). The markdown style reference is
      recreated as a note in Phase 2 if still wanted.
- [x] Replace `README.md` with a short project README: what the site is, how to run it,
      how to add a post, how to add a note, how deploys work.

## Phase 1: Site shell for multiple sections

- [x] `src/consts.ts`: `SITE_TITLE` becomes the person, not "Neven's Blog"; add
      `SITE_NAV` = home, posts, notes, uses. `SITE_URL` stays `https://blog.nlukic.com`
      until Phase 4. Unused `BASE` removed.
- [x] `Header.astro` renders nav from `SITE_NAV` with the current section highlighted
      (`aria-current="page"`). Email moved to a new `Footer.astro` alongside RSS and
      source links; the footer is part of `Layout.astro`.
- [x] New `src/pages/index.astro`: two-sentence intro, latest 5 posts. The recent-notes
      block is added in Phase 2 once the collection exists. `h-svh` layout dropped.
- [x] `src/pages/404.astro` with the shared layout.
- [x] Section index pages get a one-line description via `SectionHeading.astro`.
      `/notes` and `/uses` exist as stubs with their descriptions so the nav never 404s.
- [x] Kept the `max-w-xl` reading column everywhere for now.
- [x] Extra: `PostList.astro` shared by home and `/posts`; in dev it also lists drafts
      with a "draft" badge. Page `<title>` is now `Page · Neven Lukić` except on home.

Verify: nav works with view transitions, theme persists, `/posts/...` URLs unchanged.

## Phase 2: Notes from Obsidian

### Vault layout

- [ ] Create `web-notes/` at the repo root. Open it in Obsidian as its own vault (not a
      folder inside another vault). Obsidian writes `.obsidian/` there; add
      `web-notes/.obsidian/` to `.gitignore` so plugin state and workspace files stay out
      of the repo. Commit only the notes and attachments.
- [ ] Obsidian settings for this vault: wikilinks on, new link format "shortest path",
      attachment folder `web-notes/attachments`, properties in YAML frontmatter (default).
- [ ] Note filenames are the titles: `Why I switched to Zed.md`. Spaces and capitals are
      fine; slugs are generated at build time.
- [ ] Attachments: `public/notes/attachments` is a symlink to `../../web-notes/attachments`
      so Astro copies images into `dist/notes/attachments/` with zero build logic. If the
      symlink causes trouble on CI, replace it with a tiny integration that copies the
      folder on `astro:build:done`.

### Collection

- [ ] `src/content.config.ts`: new `notes` collection,
      `glob({ pattern: "**/*.md", base: "./web-notes", retainBody: true, generateId })`
      where `generateId` slugifies the filename (lowercase, spaces and punctuation to
      hyphens, diacritics stripped). Put the slugify function in `src/lib/slug.ts` so the
      wikilink resolver uses the exact same one.
- [ ] Schema, all optional except what is derived: `title` (defaults to filename),
      `description`, `tags: string[]` (Obsidian's native property), `status` enum
      `seed | growing | evergreen` default `seed`, `created: date` optional.
- [ ] `updated` is not frontmatter. Derive it from git at build time with the
      modified-time recipe (an mdast/remark plugin that runs `git log -1 --format=%cI`
      per file and writes it into frontmatter). The deploy action must check out with
      `fetch-depth: 0` for this to be accurate.

### Markdown pipeline

- [ ] Switch the processor to unified: `npm i @astrojs/markdown-remark remark-wiki-link`
      and set `markdown.processor = unified({ remarkPlugins: [...] })`. Reason: the
      Obsidian syntax plugins live in the remark ecosystem. Posts are unaffected; they use
      no special syntax. Shiki config stays as is.
- [ ] `remark-wiki-link` configured with `aliasDivider: "|"`, `pageResolver` = slugify,
      `hrefTemplate` = `/notes/${slug}`, `permalinks` = list of all note slugs so unknown
      targets get a `broken` class (styled muted, no underline) instead of a 404 link.
- [ ] Embeds `![[image.png]]` rewrite to `/notes/attachments/image.png`. Check whether the
      wiki-link plugin's embed handling covers this; otherwise a 20-line remark plugin
      that matches `![[...]]` in text nodes.
- [ ] Obsidian callouts (`> [!note]`) via a remark or rehype callouts plugin, styled in
      `global.css` next to `blockquote`. Optional, do it only if you use callouts.
- [ ] Headings inside wikilinks (`[[Note#Section]]`) map to `/notes/note#section`. Astro's
      heading ids are GitHub-style slugs since v6, so this works if the resolver slugifies
      the fragment the same way.

### Pages

- [ ] `src/pages/notes/index.astro`: all notes sorted by `updated` desc, showing title,
      status badge, tags, updated date. Small enough to be one page for a long time.
- [ ] `src/pages/notes/[slug].astro`: title, status, created/updated, tags, content, then
      a "Linked from" section with backlinks.
- [ ] Backlinks: at build time, scan every note's raw body (`entry.body`, hence
      `retainBody`) for `[[target]]`, resolve with slugify, invert the map. Put this in
      `src/lib/backlinks.ts` and call it once from `getStaticPaths`.
- [ ] `src/pages/notes/tags/[tag].astro`: notes per tag, plus a tag cloud on the index.
- [ ] `src/pages/notes/rss.xml.ts`: separate feed for notes, sorted by updated. The main
      `/rss.xml` stays posts only.
- [ ] Sitemap: notes are all public, nothing to filter.

Verify: a note with a wikilink to another note, an alias link, a link to a missing note, an
image embed, a callout, and a tag renders correctly; backlinks appear on the target;
`updated` matches the last commit touching the file; the same note edited in Obsidian and
committed shows the new date after deploy.

## Phase 3: Uses page

- [ ] Data collection `uses` from `src/data/uses/*.yaml`, one file per category
      (`hardware.yaml`, `desktop.yaml`, `cli.yaml`, `dev.yaml`, `services.yaml`), each a
      list of `{ name, url?, note?, since? }`. Schema in `content.config.ts` with a
      `file()` or `glob()` loader.
- [ ] `src/pages/uses/index.astro`: intro paragraph, then one section per category in a
      fixed order, entries as a compact list: name linked, one-line note in muted text.
- [ ] Optional: a `changelog` list at the bottom, or rely on git history.
- [ ] Link `/uses` from the home page intro ("here is what I use").

Verify: adding a tool is a three-line YAML edit and nothing else.

## Phase 4: Domain move to nlukic.com

DNS is on Cloudflare. Today: apex `nlukic.com` is proxied and served by a Cloudflare redirect
rule to `blog.nlukic.com`; `blog.nlukic.com` is an A record to a single GitHub Pages IP.

- [ ] Repo: `public/CNAME` -> `nlukic.com`; `SITE_URL` -> `https://nlukic.com`; `BASE`
      const updated or removed. Do this on `dev`, do not merge yet.
- [ ] Cloudflare DNS, apex `@`: remove the current proxied A records; add four A records
      `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and four
      AAAA records `2606:50c0:8000::153` through `2606:50c0:8003::153`. DNS only (grey
      cloud) until GitHub has issued the certificate; proxy can be turned on later if
      wanted.
- [ ] Cloudflare: delete the redirect rule that sends `nlukic.com` to the blog.
- [ ] Cloudflare: `www` CNAME -> `cyber3x.github.io`, DNS only, or a redirect rule
      `www.nlukic.com/*` -> `https://nlukic.com/$1`.
- [ ] GitHub repo Settings -> Pages -> Custom domain: `nlukic.com`. Wait for the DNS check
      to pass, then tick Enforce HTTPS. Certificate issuance can take up to an hour.
- [ ] Merge the `dev` PR. The deploy publishes with the new CNAME. Confirm
      `https://nlukic.com/` and `https://nlukic.com/posts/` load with a valid certificate.
- [ ] Redirect the old blog host: change `blog.nlukic.com` to a proxied placeholder record
      (AAAA `100::`, orange cloud) and add a Cloudflare redirect rule
      `blog.nlukic.com/*` -> `https://nlukic.com/$1`, 301. Post paths and `/rss.xml` are
      unchanged, so every existing link and feed subscription lands correctly.
- [ ] Update the `blog.nlukic.com` A record removal only after the redirect rule is live;
      order matters to avoid a window where the old host returns nothing.
- [ ] Update the GitHub repo description and any profile links to the new URL.

Verify: old post URL on the blog host 301s to the same path on the apex; RSS readers keep
working; `curl -I https://nlukic.com` shows GitHub Pages headers and HTTPS; sitemap URLs use
the new domain.

## Phase 5: Polish (later, pick what earns its place)

- [ ] Client-side search across posts and notes with Pagefind (indexes `dist/` after
      build, no server). A garden benefits from this earlier than a blog does.
- [ ] Generated OpenGraph images per post and note instead of the shared placeholder.
- [ ] Note graph view. Fun, rarely useful; do it last if at all.
- [ ] "Recently changed" feed on the home page that merges posts and notes.

---

## Open questions to settle during Phase 2

- Whether the `web-notes/` vault is where notes are born, or whether you write in your main
  vault and move finished notes over. The plan assumes notes are born there. If you want to
  publish from the main vault instead, the collection `base` can point at a subfolder of it
  through a symlink, but then the main vault's `.obsidian` and private folders must never
  be inside that subfolder.
- Whether `status` is worth maintaining by hand. If not, drop it and let `updated` age
  speak for itself.
