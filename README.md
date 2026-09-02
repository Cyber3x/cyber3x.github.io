# nlukic.com

Personal site of Neven Lukić: a blog, a public notes garden, and a page about the tools I
use. Built with [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/),
deployed to GitHub Pages.

## Develop

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type check + production build into dist/
npm run preview    # serve dist/ locally
npm run format     # prettier --write
```

## Content

### Posts

Markdown or MDX files in `src/content/posts/`. Frontmatter:

```yaml
---
title: "Post title"
description: "One sentence for meta tags and RSS."
date: "27 Sep 2025"
image: "/static/cover.jpeg" # optional, defaults to the placeholder
public: true # false = draft, built in dev only
---
```

The filename is the URL: `my-post.md` becomes `/posts/my-post`.

### Notes and uses

See `docs/garden-plan.md` for the notes garden and the uses page; both are in progress.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site with the
official Astro action and publishes it to GitHub Pages. Pull requests and pushes to `dev`
run `.github/workflows/ci.yml` (Prettier check + build).

Work happens on `dev` and lands on `main` through a pull request.

## Credits

Started from Nicholas Ly's [Miniblog](https://github.com/nicholasly/miniblog) template, MIT
licensed. See `LICENSE`.
