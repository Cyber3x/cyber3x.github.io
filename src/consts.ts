export const SITE_URL = "https://blog.nlukic.com";
export const SITE_TITLE = "SUDO INSTALL OPSEC";
export const SITE_DESCRIPTION =
  "Neven's corner of the internet: blog posts, public notes, and the tools I use.";
export const SITE_SOURCE_CODE_LINK =
  "https://github.com/Cyber3x/cyber3x.github.io";

export const EMAIL = "neven@nlukic.com";

export const SITE_NAV = [
  { label: "home", href: "/" },
  { label: "posts", href: "/posts" },
  // Re-enable once the first notes exist (garden plan, Phase 2).
  // { label: "notes", href: "/notes" },
  // Re-enable with the software/services list (garden plan, Phase 3).
  // { label: "gear", href: "/uses" },
  { label: "computer", href: "/computer" },
  { label: "software", href: "/software" },
] as const;
