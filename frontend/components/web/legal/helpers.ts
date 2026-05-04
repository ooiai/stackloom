import { getMessageValue, type MessageTree } from "@/lib/i18n"

export interface LegalSection {
  id: string
  title: string
  paragraphs: string[]
  items: string[]
}

export interface LegalDocument {
  eyebrow: string
  title: string
  description: string
  effectiveDateLabel: string
  effectiveDate: string
  notice: string
  homeLabel: string
  signinLabel: string
  companionLabel: string
  companionHref: string
  sections: LegalSection[]
}

interface LegalSectionDefinition {
  id: string
  paragraphCount: number
  itemCount?: number
}

const TERMS_SECTION_DEFINITIONS: LegalSectionDefinition[] = [
  { id: "acceptance", paragraphCount: 2 },
  { id: "eligibility", paragraphCount: 2 },
  { id: "acceptableUse", paragraphCount: 1, itemCount: 3 },
  { id: "customerData", paragraphCount: 2 },
  { id: "serviceChanges", paragraphCount: 2 },
  { id: "fees", paragraphCount: 1 },
  { id: "ip", paragraphCount: 2 },
  { id: "disclaimer", paragraphCount: 2 },
  { id: "contact", paragraphCount: 1 },
]

const PRIVACY_SECTION_DEFINITIONS: LegalSectionDefinition[] = [
  { id: "overview", paragraphCount: 2 },
  { id: "collection", paragraphCount: 1, itemCount: 4 },
  { id: "usage", paragraphCount: 1, itemCount: 4 },
  { id: "sharing", paragraphCount: 2 },
  { id: "retention", paragraphCount: 2 },
  { id: "security", paragraphCount: 2 },
  { id: "rights", paragraphCount: 1, itemCount: 4 },
  { id: "children", paragraphCount: 1 },
  { id: "updatesContact", paragraphCount: 2 },
]

function getEntries(
  messages: MessageTree,
  basePath: string,
  prefix: string,
  count: number
) {
  return Array.from({ length: count }, (_, index) =>
    getMessageValue(messages, `${basePath}.${prefix}${index + 1}`)
  ).filter(Boolean)
}

function buildSections(
  messages: MessageTree,
  basePath: string,
  definitions: LegalSectionDefinition[]
): LegalSection[] {
  return definitions.map((definition) => ({
    id: definition.id,
    title: getMessageValue(messages, `${basePath}.${definition.id}.title`),
    paragraphs: getEntries(
      messages,
      `${basePath}.${definition.id}.paragraphs`,
      "p",
      definition.paragraphCount
    ),
    items: definition.itemCount
      ? getEntries(
          messages,
          `${basePath}.${definition.id}.items`,
          "i",
          definition.itemCount
        )
      : [],
  }))
}

export function buildTermsDocument(messages: MessageTree): LegalDocument {
  return {
    eyebrow: getMessageValue(messages, "legal.shared.eyebrow"),
    title: getMessageValue(messages, "legal.terms.title"),
    description: getMessageValue(messages, "legal.terms.description"),
    effectiveDateLabel: getMessageValue(messages, "legal.shared.effectiveDate"),
    effectiveDate: getMessageValue(messages, "legal.terms.effectiveDate"),
    notice: getMessageValue(messages, "legal.shared.notice"),
    homeLabel: getMessageValue(messages, "legal.shared.backHome"),
    signinLabel: getMessageValue(messages, "legal.shared.backSignin"),
    companionLabel: getMessageValue(messages, "legal.shared.viewPrivacy"),
    companionHref: "/privacy",
    sections: buildSections(
      messages,
      "legal.terms.sections",
      TERMS_SECTION_DEFINITIONS
    ),
  }
}

export function buildPrivacyDocument(messages: MessageTree): LegalDocument {
  return {
    eyebrow: getMessageValue(messages, "legal.shared.eyebrow"),
    title: getMessageValue(messages, "legal.privacy.title"),
    description: getMessageValue(messages, "legal.privacy.description"),
    effectiveDateLabel: getMessageValue(messages, "legal.shared.effectiveDate"),
    effectiveDate: getMessageValue(messages, "legal.privacy.effectiveDate"),
    notice: getMessageValue(messages, "legal.shared.notice"),
    homeLabel: getMessageValue(messages, "legal.shared.backHome"),
    signinLabel: getMessageValue(messages, "legal.shared.backSignin"),
    companionLabel: getMessageValue(messages, "legal.shared.viewTerms"),
    companionHref: "/terms",
    sections: buildSections(
      messages,
      "legal.privacy.sections",
      PRIVACY_SECTION_DEFINITIONS
    ),
  }
}
