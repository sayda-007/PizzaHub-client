const DEFAULT_BACKEND_ORIGIN = "https://pizzahub-server-xi.vercel.app";

/**
 * Resolve an origin only. The backend owns `/api/auth/*`, so the rewrite below
 * must add that path once. A configured value may be a bare origin or may
 * accidentally include `/api/menu`; neither should produce `/api/api/...`.
 * This value stays server-side; no NEXT_PUBLIC_ credential is needed.
 */
function backendOrigin() {
  const configured = process.env.PIZZAHUB_BACKEND_URL?.trim();
  const candidate = configured || DEFAULT_BACKEND_ORIGIN;
  const withScheme = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  try {
    return new URL(withScheme).origin;
  } catch {
    return DEFAULT_BACKEND_ORIGIN;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // All browser-facing APIs stay first-party. This keeps Better Auth cookies
    // same-site and lets JWT-protected pages use relative URLs without ever
    // exposing the backend origin to the browser.
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin()}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
