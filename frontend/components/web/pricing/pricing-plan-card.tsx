"use client"

import NumberFlow from "@number-flow/react"
import { CircleCheck, CircleHelp } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/reui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  getYearlyPrice,
  type BillingPeriod,
  type PricingDocument,
  type PricingPlan,
} from "./helpers"

interface PricingPlanCardProps {
  plan: PricingPlan
  billingPeriod: BillingPeriod
  perMonthLabel: PricingDocument["perMonthLabel"]
  popularLabel: string
}

export function PricingPlanCard({
  plan,
  billingPeriod,
  perMonthLabel,
  popularLabel,
}: PricingPlanCardProps) {
  const displayPrice =
    billingPeriod === "monthly" ? plan.monthlyPrice : getYearlyPrice(plan.monthlyPrice)

  return (
    <article
      className={cn(
        "relative rounded-3xl border border-border/70 bg-background/90 p-6 shadow-sm transition-[border-color,transform,box-shadow] duration-200",
        plan.isPopular
          ? "border-primary/25 bg-primary/[0.04] shadow-md lg:-translate-y-2"
          : "hover:border-primary/15 hover:shadow-md"
      )}
    >
      {plan.isPopular ? (
        <Badge
          variant="primary-light"
          radius="full"
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
        >
          {popularLabel}
        </Badge>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
          <div className="flex items-end gap-2">
            <NumberFlow
              value={displayPrice}
              prefix="$"
              className="text-4xl font-semibold tracking-tight text-foreground"
            />
            <span className="pb-1 text-sm text-muted-foreground">{perMonthLabel}</span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{plan.description}</p>
        </div>

        <Link
          href="/signup"
          className={buttonVariants({
            variant: plan.isPopular ? "default" : "outline",
            size: "lg",
            className: "w-full",
          })}
        >
          {plan.buttonText}
        </Link>
      </div>

      <Separator className="my-6" />

      <TooltipProvider delay={100}>
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature.title} className="flex items-start gap-2">
              <CircleCheck className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="flex min-w-0 items-start gap-1.5">
                <span className="text-sm leading-6 text-foreground">{feature.title}</span>
                {feature.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger className="mt-1 shrink-0 cursor-help text-muted-foreground transition-colors hover:text-foreground">
                      <CircleHelp className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-60 leading-5">
                      {feature.tooltip}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    </article>
  )
}
