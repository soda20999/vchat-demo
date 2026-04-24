import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // 关键配置：生成极简运行环境
};

export default nextConfig;
