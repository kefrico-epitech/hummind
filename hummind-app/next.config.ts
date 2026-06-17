import type { NextConfig } from "next";

const isWindows = process.platform === "win32";
const configuredDevOrigins =
  process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
const allowedDevOrigins = Array.from(
  new Set([
    "192.168.1.74",
    "192.168.1.67",
    "192.168.8.102",
    "192.168.8.100",
    "172.19.112.1",
    ...configuredDevOrigins,
  ]),
);

const nextConfig: NextConfig = {
  // Desactive les source maps cote serveur
  productionBrowserSourceMaps: false,

  // Ajoute les IP locales autorisees pour le dev server
  allowedDevOrigins,

  experimental: {
    turbopackFileSystemCacheForDev: false,
  },

  env: {
    BROWSERSLIST_IGNORE_OLD_DATA: "true",
    BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA: "true",
  },

  // Evite l'erreur de symlink standalone sur Windows local.
  output: isWindows ? undefined : "standalone",
};

export default nextConfig;
