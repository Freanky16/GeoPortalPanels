import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 usa Turbopack por defecto.
  // Maplibre GL JS funciona bien con Turbopack sin configuración adicional.
  turbopack: {},
};

export default nextConfig;
