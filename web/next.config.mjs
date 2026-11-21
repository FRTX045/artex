import { fileURLToPath } from "node:url";

// Static export: `NEXT_EXPORT=1 next build` produces a plain static directory at web/out,
// which can be copied straight into an nginx web root. next dev does not set this variable,
// so the /api reverse proxy and hot reload stay enabled.
const isExport = process.env.NEXT_EXPORT === "1";
// Vercel demo: the whole site runs on mocks with no backend, so no /api proxy is needed.
const isMock = process.env.NEXT_PUBLIC_MOCK === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep a parent-directory lockfile from affecting root inference and asset paths.
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  reactCompiler: true,
  // Allow dev assets (HMR) to be reached from LAN IPs; add or remove entries as needed.
  // In dev, any IPv4 origin may access /_next/* and HMR, so changing LAN IPs don't break it.
  // Note: Next forbids a bare "*" for security, so a segmented wildcard is used; "*.*.*.*" matches any IPv4.
  allowedDevOrigins: ["*.*.*.*"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  ...(isExport
    ? {
        // Pure static export: no Node runtime; images are not optimized; each route emits <route>/index.html.
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : isMock
      ? {
          // Vercel mock demo: no backend, so no /api proxy is needed.
          images: { unoptimized: true },
        }
      : {
          // Development: reverse-proxy /api/* to the Go backend (default :8787; override with AUTOPENTEST_API).
          async rewrites() {
            const backend = process.env.AUTOPENTEST_API ?? "http://localhost:8787";
            return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
          },
        }),
};

export default nextConfig;
