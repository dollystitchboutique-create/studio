import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dollystitch Hub',
    short_name: 'Dollystitch',
    description: 'Artisanal Jewelry Management',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFE7E9',
    theme_color: '#FC809F',
    icons: [
      {
        src: 'https://picsum.photos/seed/dolly/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/dolly/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
