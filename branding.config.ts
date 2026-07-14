/**
 * Branding configuration — single source of truth for product identity.
 *
 * Edit this file to update your application branding.
 * Do NOT change upstreamUrl — it is used by upgrade-project.sh.
 */
export const branding = {
  /** Human-readable application name shown in UI, emails, and page titles. */
  appName: "lanningcloud",

  /** URL-safe slug used for database names, cookie prefixes, etc. */
  appSlug: "lanningcloud",

  /** Short description used in metadata/SEO. */
  appDescription: "lanningcloud — powered by StackLoom",

  /** Support contact address used in legal pages and email templates. */
  supportEmail: "jerry@gmail.com",

  /**
   * The upstream StackLoom GitHub URL.
   * Do NOT change — used by scripts/upgrade-project.sh.
   */
  upstreamUrl: "git@github.com:ooiai/stackloom.git",
} as const

export type Branding = typeof branding
