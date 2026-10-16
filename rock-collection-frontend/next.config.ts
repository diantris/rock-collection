// next.config.ts - Next.js configuration
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // material-color-utilities 0.4.0 has an extension-less ESM import that Node can't resolve during
  // server rendering; bundling it through Next avoids loading it as an external Node module.
  transpilePackages: ['@material/material-color-utilities'],
};

export default nextConfig;
