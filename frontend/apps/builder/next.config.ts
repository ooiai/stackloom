/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  allowedDevOrigins: ["builderdev.ooiai.com", "builder.ooiai.com"],
};

export default nextConfig;
