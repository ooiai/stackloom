import type { Metadata } from "next"

import { LegalPageView } from "@/components/web/legal/legal-page-view"
import { buildTermsDocument } from "@/components/web/legal/helpers"
import { getLocaleMessages, getMessageValue } from "@/lib/i18n"
import { getRequestLocale } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return {
    title: getMessageValue(
      messages,
      "legal.terms.meta.title",
      "Stackloom Terms of Service"
    ),
    description: getMessageValue(
      messages,
      "legal.terms.meta.description",
      "Read the Terms of Service for using Stackloom."
    ),
  }
}

export default async function TermsPage() {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return <LegalPageView document={buildTermsDocument(messages)} />
}
