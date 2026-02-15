import { MetadataRoute } from 'next';
import { getBrandConfig } from '@config/index';

export default function robots(): MetadataRoute.Robots {
    const brand = getBrandConfig();
    const siteUrl = brand?.siteUrl || 'https://www.pennyscroll.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/login', '/_next/'],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
