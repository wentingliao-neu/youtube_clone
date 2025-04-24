import type { NextConfig } from "next";

// const cspHeader = `
//   default-src 'self';
//   script-src 'self' 'unsafe-inline' 'unsafe-eval' https://close-man-52.clerk.accounts.dev https://challenges.cloudflare.com;
//   connect-src 'self' https://close-man-52.clerk.accounts.dev;
//   img-src 'self' https://img.clerk.com;
//   worker-src 'self' blob:;
//   style-src 'self' 'unsafe-inline';
//   frame-src 'self' https://challenges.cloudflare.com;
//   form-action 'self';
// `;

const nextConfig: NextConfig = {
   images: {
      remotePatterns: [
         { protocol: "https", hostname: "image.mux.com" },
         { protocol: "https", hostname: "utfs.io" },
         { protocol: "https", hostname: "meol23w654.ufs.sh" },
      ],
   },

   // experimental: {
   //    typedRoutes: true,
   // },
   /* config options here */
   // async headers() {
   //    return [
   //       {
   //          source: "/(.*)",
   //          headers: [
   //             {
   //                key: "Content-Security-Policy",
   //                value: cspHeader.replace(/\n/g, ""),
   //             },
   //          ],
   //       },
   //    ];
   // },
};

export default nextConfig;
