import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project (set these in your Sentry dashboard)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in CI/CD, not local dev
  silent: !process.env.CI,

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Hides Sentry's source-map upload progress from build output
  hideSourceMaps: true,

  // Tunnel Sentry requests through Next.js to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Automatically instrument Server Components and Route Handlers
  autoInstrumentServerFunctions: true,
});
