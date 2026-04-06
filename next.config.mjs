/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.metmuseum.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.wikipedia.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
