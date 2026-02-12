/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@student-helper/ui",
    "@student-helper/contracts",
    "@student-helper/config",
  ],
};

export default nextConfig;
