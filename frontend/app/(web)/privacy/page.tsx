import type { Metadata } from "next"

import { LegalPageView } from "@/components/web/legal/legal-page-view"
import { buildPrivacyDocument } from "@/components/web/legal/helpers"
import { getLocaleMessages, getMessageValue } from "@/lib/i18n"
import { getRequestLocale } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return {
    title: getMessageValue(
      messages,
      "legal.privacy.meta.title",
      "Stackloom Privacy Policy"
    ),
    description: getMessageValue(
      messages,
      "legal.privacy.meta.description",
      "Read the Privacy Policy for using Stackloom."
    ),
  }
}

export default async function PrivacyPage() {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return <LegalPageView document={buildPrivacyDocument(messages)} />
}
