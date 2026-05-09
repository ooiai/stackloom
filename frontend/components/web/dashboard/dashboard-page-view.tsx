"use client"

import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/reui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function DashboardPageView() {
  const t = useTranslations("navigation.dashboard.page")

  const summaryCards = [
    {
      label: t("summary.workspaces.label"),
      value: "12",
      hint: t("summary.workspaces.hint"),
      trend: t("summary.workspaces.trend"),
      icon: Building2,
    },
    {
      label: t("summary.members.label"),
      value: "248",
      hint: t("summary.members.hint"),
      trend: t("summary.members.trend"),
      icon: Users2,
    },
    {
      label: t("summary.reliability.label"),
      value: "99.94%",
      hint: t("summary.reliability.hint"),
      trend: t("summary.reliability.trend"),
      icon: ShieldCheck,
    },
  ] as const

  const workItems = [
    {
      title: t("projects.launch.title"),
      subtitle: t("projects.launch.subtitle"),
      status: t("projects.launch.status"),
      progress: 78,
      badgeVariant: "success-light" as const,
      progressClass: "bg-emerald-500",
    },
    {
      title: t("projects.billing.title"),
      subtitle: t("projects.billing.subtitle"),
      status: t("projects.billing.status"),
      progress: 64,
      badgeVariant: "info-light" as const,
      progressClass: "bg-sky-500",
    },
    {
      title: t("projects.permissions.title"),
      subtitle: t("projects.permissions.subtitle"),
      status: t("projects.permissions.status"),
      progress: 46,
      badgeVariant: "warning-light" as const,
      progressClass: "bg-amber-500",
    },
    {
      title: t("projects.success.title"),
      subtitle: t("projects.success.subtitle"),
      status: t("projects.success.status"),
      progress: 92,
      badgeVariant: "primary-light" as const,
      progressClass: "bg-primary",
    },
  ] as const

  const focusItems = [
    {
      title: t("focus.items.approvals.title"),
      description: t("focus.items.approvals.description"),
      icon: CheckCircle2,
    },
    {
      title: t("focus.items.permissions.title"),
      description: t("focus.items.permissions.description"),
      icon: ShieldCheck,
    },
    {
      title: t("focus.items.automation.title"),
      description: t("focus.items.automation.description"),
      icon: Activity,
    },
  ] as const

  const updates = [
    {
      title: t("updates.items.launch.title"),
      meta: t("updates.items.launch.meta"),
    },
    {
      title: t("updates.items.billing.title"),
      meta: t("updates.items.billing.meta"),
    },
    {
      title: t("updates.items.ops.title"),
      meta: t("updates.items.ops.meta"),
    },
  ] as const

  return (
    <main className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <Badge variant="primary-light" radius="full">
              {t("live")}
            </Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        {summaryCards.map((card, index) => (
          <Card
            key={card.label}
            className={cn(
              "border-border/70 bg-gradient-to-br from-background to-muted/[0.25] shadow-sm xl:col-span-4",
              index === 0 &&
                "border-primary/20 from-primary/[0.05] to-background"
            )}
          >
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardAction>
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border text-primary",
                    index === 0
                      ? "border-primary/20 bg-primary/[0.12]"
                      : "border-primary/12 bg-primary/[0.08]"
                  )}
                >
                  <card.icon className="size-4" />
                </div>
              </CardAction>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                {card.hint}
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3.5" />
                <span>{card.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="border-border/70 bg-gradient-to-b from-background to-muted/[0.2] shadow-sm xl:col-span-8">
          <CardHeader className="border-b border-border/70">
            <CardTitle>{t("overview.title")}</CardTitle>
            <CardDescription>{t("overview.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {workItems.map((item, index) => (
              <div
                key={item.title}
                className={cn(
                  "rounded-xl border border-border/70 bg-muted/20 p-4 transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/12 hover:bg-primary/[0.03]",
                  index === 0 && "border-primary/20 bg-primary/[0.04]"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {item.title}
                      </p>
                      <Badge
                        variant={item.badgeVariant}
                        size="sm"
                        radius="full"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="min-w-20 text-left sm:text-right">
                    <p className="text-sm font-medium text-foreground">
                      {item.progress}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("overview.progressLabel")}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", item.progressClass)}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-4">
          <Card className="border-border/70 bg-gradient-to-b from-background to-muted/[0.22] shadow-sm">
            <CardHeader className="border-b border-border/70">
              <CardTitle>{t("focus.title")}</CardTitle>
              <CardDescription>{t("focus.description")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {focusItems.map((item, index) => (
                <div key={item.title}>
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/12 bg-primary/[0.08] text-primary">
                      <item.icon className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {index < focusItems.length - 1 ? (
                    <Separator className="my-4" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-gradient-to-b from-background to-muted/[0.22] shadow-sm">
            <CardHeader className="border-b border-border/70">
              <CardTitle>{t("updates.title")}</CardTitle>
              <CardDescription>{t("updates.description")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {updates.map((item, index) => (
                <div key={item.title}>
                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/12 bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm leading-6 font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.meta}
                      </p>
                    </div>
                  </div>
                  {index < updates.length - 1 ? (
                    <Separator className="my-4" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
