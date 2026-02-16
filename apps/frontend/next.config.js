import process from "node:process";

const nextDistDir = process.env.NEXT_DIST_DIR;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@student-helper/ui",
    "@student-helper/contracts",
    "@student-helper/config",
  ],
  ...(nextDistDir ? { distDir: nextDistDir } : {}),
};

export default nextConfig;
