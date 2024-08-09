/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "static.vecteezy.com",
        protocol: "https",
        port: "",
      },
      {
        hostname: "a0.muscache.com",
        protocol: "https",
        port: "",
      },
      {
        hostname: "glvmmupiqwlmhicmggqp.supabase.co",
        protocol: "https",
        port: "",
      },
    ],
  },
};

export default nextConfig;
