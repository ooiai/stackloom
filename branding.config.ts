/**
 * Branding configuration — single source of truth for product identity.
 *
 * When this project is used as a StackLoom-based product scaffold:
 *   1. Run `bash scripts/create-project.sh` to create a new product project.
 *      The script copies this repo and rewrites this file with your values.
 *   2. You can then edit this file manually at any time.
 *
 * The values here are also used by scripts/upgrade-project.sh to avoid
 * overwriting your branding when merging upstream StackLoom updates.
 */
export const branding = {
  /** Human-readable application name shown in UI, emails, and page titles. */
  appName: "StackLoom",

  /** URL-safe slug used for database names, cookie prefixes, etc. */
  appSlug: "stackloom",

  /** Short description used in metadata/SEO. */
  appDescription: "Multi-tenant SaaS admin scaffold",

  /** Support contact address used in legal pages and email templates. */
  supportEmail: "support@stackloom.local",

  /**
   * The upstream StackLoom GitHub URL.
   * Product projects should NOT change this — it is used by upgrade-project.sh
   * to fetch foundation updates.
   */
  upstreamUrl: "git@github.com:ooiai/stackloom.git",
} as const

export type Branding = typeof branding
