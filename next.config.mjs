/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    turbopack: {},
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Mark node:sqlite as external so it's not bundled at build time
            config.externals.push({
                'node:sqlite': 'commonjs node:sqlite',
            });
        }
        return config;
    },
};

export default nextConfig;