/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@maris/shared", "@maris/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

module.exports = nextConfig;
