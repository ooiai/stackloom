import type { Metadata } from "next"

import { PricingPageView } from "@/components/web/pricing/pricing-page-view"
import { buildPricingDocument } from "@/components/web/pricing/helpers"
import { getLocaleMessages, getMessageValue } from "@/lib/i18n"
import { getRequestLocale } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return {
    title: getMessageValue(messages, "pricing.meta.title", "Stackloom Pricing"),
    description: getMessageValue(
      messages,
      "pricing.meta.description",
      "Choose the Stackloom plan that fits your workspace."
    ),
  }
}

export default async function PricingPage() {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return <PricingPageView document={buildPricingDocument(messages)} />
}
