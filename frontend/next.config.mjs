import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["stackloom.ooiai.com", "stackloomdev.ooiai.com"],
  output: "standalone",
}

export default withNextIntl(nextConfig)
