// next.config.ts - Next.js configuration
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Plain files (out/): the app is one page that loads everything from the API in the browser, so no Node server is
  // needed to run it. Caddy serves them (Dockerfile, Caddyfile), which saves ~100 MB on the 1 GB VM.
  output: 'export',
  // material-color-utilities 0.4.0 has an extension-less ESM import that Node can't resolve during
  // server rendering; bundling it through Next avoids loading it as an external Node module.
  transpilePackages: ['@material/material-color-utilities'],
};

export default nextConfig;
