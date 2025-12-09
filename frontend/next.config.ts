import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@stackloom/ui", "@stackloom/builder-ui"],
  allowedDevOrigins: ["builderdev.ooiai.com", "builder.ooiai.com"],
};

export default nextConfig;
