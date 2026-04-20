export const LOCALE_COOKIE_NAME = "locale"

export const NODE_ENV = process.env.NODE_ENV

export const IS_DEV = NODE_ENV === "development"

export const IS_PROD = NODE_ENV === "production"

export const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || ""
