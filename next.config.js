/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from placeholder services and common CDNs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' }, // Supabase Storage
    ],
  },
}

module.exports = nextConfig
