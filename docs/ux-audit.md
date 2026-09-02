# UX audit against Apple's Human Interface Guidelines

Date: 2026-09-02. Scope: the site as built on `dev` at that date (home, posts index, post
page, notes and uses stubs, 404, header, footer, theme toggle). Reference:
https://developer.apple.com/design/human-interface-guidelines/ (Typography, Color, Dark
Mode, Accessibility, Layout, Motion). Contrast ratios below were computed from the exact
Tailwind v4 oklch values the build emits, using the WCAG formula the HIG cites.

Severity: **High** = fails a stated HIG threshold or blocks a group of users. **Medium** =
degrades the experience for some users or contexts. **Low** = polish.

---

## Findings, ordered by priority

### 1. Article links fail the minimum contrast ratio. High

- HIG: "At a minimum, make sure the contrast ratio between colors is no lower than 4.5:1.
  For custom foreground and background colors, strive for a contrast ratio of 7:1."
- Site: prose links are `text-blue-500` in both themes.
  - Light: blue-500 on white = **3.76:1**
  - Dark: blue-500 on zinc-800 = **3.96:1**
- Article text is 18px, which is about 13.5pt, so the 4.5:1 rule applies, not the 3:1
  large-text allowance.
- Fix: `text-blue-600 dark:text-blue-400` in `global.css` under `article a`. Keep the
  underline; it already satisfies "convey information with more than color alone."

### 2. Theme toggle and nav links are below the minimum hit target. High

- HIG: default control size 44x44pt, minimum 28x28pt; "consider spacing between controls
  as important as size."
- Site: the toggle is a 16px icon with 4px padding and a 1px border, about **26x26px**.
  Nav links are bare text about 24px tall with 16px gaps.
- Fix: toggle `p-2` and `size-5` (about 38px), or keep the visual size and extend the
  target with `min-h-11 min-w-11 grid place-items-center`. Nav links: add `py-2` and
  `-my-2` so the tap area grows without moving the layout.

### 3. Heading structure is inconsistent across pages. High

- HIG (Typography, Layout): "Adjust font weight, size, and color as needed to emphasize
  important information and help people visualize hierarchy" and "place the most
  important items near the top and leading side." Screen readers navigate by headings.
- Site:
  - Home has no `h1` at all; the intro is a `<p>`.
  - Post pages render the title as `h1` and then Markdown `#` headings as more `h1`s
    inside the article, so one page has several top-level headings.
- Fix: on home, make the intro paragraph the `h1` styled as body text, or add a visually
  hidden `h1` with the site name. For posts, either author post bodies starting at `##`,
  or demote heading levels by one when rendering. The second option keeps authoring
  natural and is a few lines in a Markdown plugin. Until then, the CSS sizes for article
  `h1` and `h2` should stay one step apart, which they are.

### 4. Native controls stay light in dark mode. High

- HIG (Dark Mode): "Ensure that your app looks good in both appearance modes."
- Site: `color-scheme` is never set, so scrollbars, form controls, and the default
  focus ring render in the light scheme on the dark page.
- Fix: in `global.css`, `:root { color-scheme: light } .dark { color-scheme: dark }`.
  Also add `<meta name="color-scheme" content="light dark">` in the head.

### 5. No skip link; keyboard path goes through the nav on every page. Medium

- HIG (Accessibility): "Let people use the keyboard alone to navigate and interact."
- Site: focus styles exist (browser default `focus-visible`), but there is no way to
  jump past the header. On post pages that is five stops before content.
- Fix: a visually hidden "Skip to content" link as the first child of `body`, revealed
  on focus, targeting `<main id="main">`.

### 6. Theme toggle does not announce its state. Medium

- HIG (Accessibility): convey state, not only appearance; (Color) "avoid relying solely
  on color to indicate interactivity or state."
- Site: the button has `aria-label="Toggle theme"` and a duplicate `sr-only` span. A
  screen reader hears "Toggle theme, button" with no idea which theme is active.
- Fix: drop the `sr-only` span; set `aria-pressed` to reflect dark mode, or update the
  label to "Switch to light mode" / "Switch to dark mode" on each toggle.

### 7. Active nav item is distinguished by color only. Medium

- HIG (Color): "Avoid relying solely on color to differentiate between objects, indicate
  interactivity, or communicate essential information."
- Site: active link is zinc-900 vs zinc-500. `aria-current="page"` is set, which covers
  assistive tech, but sighted users with low color vision get a subtle cue.
- Fix: add `underline underline-offset-4` or `font-semibold` to the active link.

### 8. Toggle icon and dark-mode borders are low contrast. Medium

- HIG (Accessibility): 3:1 for UI components against adjacent colors.
- Site: toggle icon zinc-500 on zinc-800 = **3.08:1**, borderline. Toggle border
  zinc-600 on zinc-800 = 1.93:1; article borders zinc-700 on zinc-800 = 1.42:1.
- Fix: icon to `text-muted` (zinc-400 in dark, 5.66:1). Borders are decorative on code
  blocks and images and can stay, but the toggle's border is its only boundary; use
  `dark:border-zinc-500` there or rely on the icon and drop the border.

### 9. Light-mode secondary text is at AA, not at the 7:1 target. Low

- Site: zinc-500 on white = **4.83:1** for dates, descriptions, footer (14px), inactive
  nav. Passes the minimum; misses the "strive for 7:1" guidance.
- Fix, optional: `text-muted` light value to zinc-600 (about 7.6:1). The dark value
  zinc-400 on zinc-800 is 5.66:1 and reads well; the previous zinc-500 was 3.08:1 and
  failed, so the recent `text-muted` change was the right call.

### 10. Accent red on white is at the minimum. Low

- Site: red-600 on white = **4.76:1** for the name on home and article headings.
  Orange-500 on zinc-800 = 5.15:1 in dark. Both pass at heading sizes.
- Fix, optional: red-700 in light for a wider margin (about 6.5:1). Keep orange in dark.

### 11. Inline code and tables can force horizontal page scroll on phones. Medium

- HIG (Layout): "Design a layout that adapts gracefully to context changes."
- Site: inline `code` has `whitespace-nowrap`, so a long identifier in a sentence pushes
  the page wider than the viewport. Tables are `w-full table-auto` with no scroll
  container.
- Fix: drop `whitespace-nowrap` from inline code, or keep it and add
  `overflow-wrap: anywhere` to the paragraph. Wrap tables in an `overflow-x-auto` block.

### 12. Dates are plain text. Low

- Site: `formatDate` outputs "September 27, 2025" in a `<span>`.
- Fix: `<time datetime={date.toISOString()}>` so assistive tech and crawlers get the
  machine-readable value.

### 13. Images have no intrinsic dimensions. Low

- HIG (Layout): avoid content shifting under people as it loads.
- Site: post images come from `public/` via Markdown `![]()`, so no `width`/`height`,
  which causes layout shift while the image loads, and no responsive sizes.
- Fix: move post images next to the post or under `src/assets` so Astro's image pipeline
  emits dimensions and responsive variants. This matters more once notes bring many
  attachments (see the garden plan).

### 14. RSS is not discoverable from the page head. Low

- Site: the feed is linked in the footer only.
- Fix: `<link rel="alternate" type="application/rss+xml" title="Posts" href="/rss.xml">`
  in the layout head. Feed readers pick it up from any page URL.

### 15. Manual theme toggle without a "system" option. Low

- HIG (Dark Mode): "Avoid offering an app-specific appearance setting." On the web a
  toggle is conventional and expected, so this is not a defect. The site already follows
  the system until the user makes a choice, which is the right default.
- Fix, optional: a three-state control (system, light, dark) so a user can return to
  following the system without clearing storage.

---

## What already meets the guidance

- **Typography.** Two typefaces only, regular/medium/bold weights, no light weights.
  Article at 18px with 1.625 leading and a measure of about 60 to 65 characters. All
  sizes in rem, so browser text zoom scales the whole page. Metric-matched fallback font
  prevents reflow when Atkinson loads.
- **Dark mode.** Follows `prefers-color-scheme` before first paint, so no flash. Body
  text is zinc-300 on zinc-800 (10.1:1), not pure white on pure black, which matches the
  HIG's advice to soften white in dark contexts. Both appearances are tested by the
  build's dual Shiki themes for code.
- **Motion.** The only animation is a 180ms crossfade on navigation, and Astro's router
  disables it under `prefers-reduced-motion`. Nothing loops, bounces, or autoplays.
- **Layout.** One reading column, consistent 16px page margin, header and footer
  aligned to it, sections grouped by whitespace. Most important content sits at the top
  on every page except home, where centering is a deliberate choice for a single
  paragraph.
- **Semantics.** Landmarks are present: `header`, `nav`, `main`, `footer`. Links in prose
  are underlined and colored, so interactivity is not conveyed by color alone there.
  Empty states on notes and uses say what will appear rather than showing nothing.

## Suggested order of work

1. Items 1, 4, 14: one CSS edit and two head lines. Ten minutes.
2. Items 2, 6, 7, 8: theme toggle and header. One small PR.
3. Items 3, 5, 11, 12: heading demotion plugin, skip link, overflow, `<time>`. One PR.
4. Items 9, 10, 13, 15: taste and infrastructure; fold into the garden work.
