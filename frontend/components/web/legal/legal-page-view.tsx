import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import type { LegalDocument } from "./helpers"

interface LegalPageViewProps {
  document: LegalDocument
}

export function LegalPageView({ document }: LegalPageViewProps) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-10 px-6 py-10 sm:px-8 lg:py-14">
      <header className="space-y-6 rounded-3xl border border-border/70 bg-background p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {document.eyebrow}
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {document.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {document.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            {document.homeLabel}
          </Link>
          <Link href="/signin" className={buttonVariants({ variant: "outline" })}>
            {document.signinLabel}
          </Link>
          <Link href={document.companionHref} className={buttonVariants()}>
            {document.companionLabel}
          </Link>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
          <span className="font-medium text-foreground">
            {document.effectiveDateLabel}
          </span>
          <span className="text-muted-foreground">{document.effectiveDate}</span>
          <p className="sm:col-span-2 text-muted-foreground">{document.notice}</p>
        </div>
      </header>

      <article className="rounded-3xl border border-border/70 bg-background p-6 shadow-sm">
        <div className="space-y-8">
          {document.sections.map((section, index) => (
            <section
              key={section.id}
              className={index === 0 ? undefined : "border-t border-border/70 pt-8"}
            >
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {section.title}
                </h2>
                <div className="space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.items.length ? (
                  <ul className="space-y-2 pl-5 text-sm leading-7 text-muted-foreground list-disc sm:text-base">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}
