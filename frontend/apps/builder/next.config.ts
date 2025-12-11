/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@stackloom/ui",
    "@stackloom/builder-ui",
    "@stackloom/canvas-ui",
    "@stackloom/presentation-ui",
  ],
  allowedDevOrigins: ["builderdev.ooiai.com", "builder.ooiai.com"],
};

export default nextConfig;
