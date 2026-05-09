"use client"

import { Sparkles } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PricingPlanCard } from "./pricing-plan-card"
import type { BillingPeriod, PricingDocument } from "./helpers"

interface PricingPageViewProps {
  document: PricingDocument
}

export function PricingPageView({ document }: PricingPageViewProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly")

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-10 px-6 py-10 sm:px-8 lg:py-14">
      <section className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Badge variant="primary-light" radius="full" className="gap-1.5">
              <Sparkles className="size-3.5" />
              {document.eyebrow}
            </Badge>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {document.title}
            </h1>
            <p className="mx-auto max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {document.description}
            </p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-max flex-col items-center gap-3">
          <div className="inline-flex rounded-full border border-border/70 bg-muted/40 p-1">
            <Button
              type="button"
              size="sm"
              variant={billingPeriod === "monthly" ? "default" : "ghost"}
              className={cn(
                "rounded-full px-4",
                billingPeriod !== "monthly" && "shadow-none"
              )}
              onClick={() => setBillingPeriod("monthly")}
            >
              {document.monthlyLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={billingPeriod === "yearly" ? "default" : "ghost"}
              className={cn(
                "rounded-full px-4",
                billingPeriod !== "yearly" && "shadow-none"
              )}
              onClick={() => setBillingPeriod("yearly")}
            >
              {document.yearlyLabel}
              <span className="ml-1 text-xs text-primary-foreground/80">
                {document.yearlySaveLabel}
              </span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{document.annualNote}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {document.plans.map((plan) => (
          <PricingPlanCard
            key={plan.id}
            plan={plan}
            billingPeriod={billingPeriod}
            perMonthLabel={document.perMonthLabel}
            popularLabel={document.popularLabel}
          />
        ))}
      </section>
    </main>
  )
}
