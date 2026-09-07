import { MetadataRoute } from 'next';
import { getBrandConfig } from '@config/server-config';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const brand = await getBrandConfig();
    const siteUrl = brand.siteUrl;

    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/_next/static/', '/_next/image/'],
            disallow: ['/admin/', '/api/', '/login', '/blogs/*/edit', '/htr'],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
