import { getMessageValue, type MessageTree } from "@/lib/i18n"

export const YEARLY_DISCOUNT = 20

export type BillingPeriod = "monthly" | "yearly"

export interface PricingFeatureItem {
  title: string
  tooltip?: string
}

export interface PricingPlan {
  id: string
  name: string
  monthlyPrice: number
  description: string
  buttonText: string
  isPopular?: boolean
  features: PricingFeatureItem[]
}

export interface PricingDocument {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  description: string
  monthlyLabel: string
  yearlyLabel: string
  yearlySaveLabel: string
  perMonthLabel: string
  annualNote: string
  popularLabel: string
  plans: PricingPlan[]
}

const PLAN_IDS = ["starter", "advanced", "premium"] as const

function getPlanFeatures(messages: MessageTree, planId: (typeof PLAN_IDS)[number]) {
  return Array.from({ length: 5 }, (_, index) => {
    const title = getMessageValue(
      messages,
      `pricing.plans.${planId}.features.items.f${index + 1}.title`
    )
    const tooltip = getMessageValue(
      messages,
      `pricing.plans.${planId}.features.items.f${index + 1}.tooltip`
    )

    return {
      title,
      tooltip: tooltip || undefined,
    }
  })
}

export function getYearlyPrice(monthlyPrice: number) {
  return Math.round(monthlyPrice * ((100 - YEARLY_DISCOUNT) / 100))
}

export function buildPricingDocument(messages: MessageTree): PricingDocument {
  const yearlySaveTemplate = getMessageValue(
    messages,
    "pricing.page.billing.save",
    `Save ${YEARLY_DISCOUNT}%`
  )

  return {
    metaTitle: getMessageValue(messages, "pricing.meta.title", "Stackloom Pricing"),
    metaDescription: getMessageValue(
      messages,
      "pricing.meta.description",
      "Choose the Stackloom plan that fits your workspace."
    ),
    eyebrow: getMessageValue(messages, "pricing.page.eyebrow"),
    title: getMessageValue(messages, "pricing.page.title"),
    description: getMessageValue(messages, "pricing.page.description"),
    monthlyLabel: getMessageValue(messages, "pricing.page.billing.monthly"),
    yearlyLabel: getMessageValue(messages, "pricing.page.billing.yearly"),
    yearlySaveLabel: yearlySaveTemplate.replace(
      "{value}",
      String(YEARLY_DISCOUNT)
    ),
    perMonthLabel: getMessageValue(messages, "pricing.page.billing.perMonth"),
    annualNote: getMessageValue(messages, "pricing.page.billing.annualNote"),
    popularLabel: getMessageValue(messages, "pricing.page.popular"),
    plans: PLAN_IDS.map((planId) => ({
      id: planId,
      name: getMessageValue(messages, `pricing.plans.${planId}.name`),
      monthlyPrice: Number(
        getMessageValue(messages, `pricing.plans.${planId}.monthlyPrice`)
      ),
      description: getMessageValue(messages, `pricing.plans.${planId}.description`),
      buttonText: getMessageValue(messages, `pricing.plans.${planId}.buttonText`),
      isPopular:
        getMessageValue(messages, `pricing.plans.${planId}.isPopular`) === "true",
      features: getPlanFeatures(messages, planId),
    })),
  }
}
