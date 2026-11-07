import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // og tags in <head> for every client, not only the bots Next knows about
  htmlLimitedBots: /.*/,
};

export default nextConfig;
