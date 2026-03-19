import { MetadataRoute } from 'next';
import { getBrandConfig } from '@config/server-config';

export default function robots(): MetadataRoute.Robots {
    const brand = getBrandConfig();
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
