import { MetadataRoute } from 'next';
import { getBrandConfig } from '@config/server-config';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const brand = await getBrandConfig();
    const siteUrl = brand.siteUrl;

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/login', '/_next/'],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
