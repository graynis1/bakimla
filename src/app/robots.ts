import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/customer/', '/salon/', '/api/'],
    },
    sitemap: `${process.env.NEXTAUTH_URL || 'https://bakimla.com'}/sitemap.xml`,
  }
}
