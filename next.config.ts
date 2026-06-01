import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    turbopack: {},
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "**",
            },
                        {
                protocol: "https",
                hostname: "pan-musubi.jp",
                pathname: "**",
            },
            // Si vas a usar Cloudinary después, añádelo aquí también:
            // {
            //   protocol: 'https',
            //   hostname: 'res.cloudinary.com',
            //   pathname: '**',
            // },
        ],
    },
};

export default nextConfig;
