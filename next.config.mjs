/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    turbopack: {},
    // API routes are only available in dev/server mode, not in static export
    // For production desktop builds, configure your frontend without API routes
    // or build in dev mode
};

export default nextConfig;