import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import BlogList from '@/components/blog/BlogList';
import { getBrandConfig } from '@config/server-config';
import { fetchBlogCategoriesServer, fetchBlogsByCategoryServer } from '@/lib/serverData';

export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT = 5000;

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

// Function to get category by slug

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  if (params.slug === '[slug]' || !params.slug) {
    return {
      title: 'Blog Category',
    };
  }
  const brand = getBrandConfig();
  const { data: categories } = await fetchBlogCategoriesServer();
  const category = categories.find((cat: any) => cat.slug === params.slug);

  if (!category) {
    return {
      title: `Category Not Found | ${brand.siteName}`,
      description: 'The requested blog category could not be found.',
    };
  }

  return {
    title: `${category.name} | Blog Categories | ${brand.siteName}`,
    description: `Explore all blog posts in the ${category.name} category. Discover insights, tips, and stories related to ${category.name}.`,
    keywords: `${category.name}, blog, articles, ${category.name} posts, ${brand.siteName}`,
    openGraph: {
      title: `${category.name} | Blog Categories | ${brand.siteName}`,
      description: `Explore all blog posts in the ${category.name} category.`,
      type: 'website',
      url: `${brand.siteUrl}/blog/category/${params.slug}`,
      siteName: brand.siteName,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | Blog Categories | ${brand.siteName}`,
      description: `Explore all blog posts in the ${category.name} category.`,
    },
    alternates: {
      canonical: `${brand.siteUrl}/blog/category/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category.name} Blog Posts`,
        description: `Explore all blog posts in the ${category.name} category. Discover insights, tips, and stories related to ${category.name}.`,
        url: `${brand.siteUrl}/blog/category/${params.slug}`,
        mainEntity: {
          '@type': 'ItemList',
          name: `${category.name} Articles`,
          description: `Collection of blog posts in the ${category.name} category`,
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: brand.siteUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: `${brand.siteUrl}/blog`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: category.name,
              item: `${brand.siteUrl}/blog/category/${params.slug}`,
            },
          ],
        },
        publisher: {
          '@type': 'Organization',
          name: brand.siteName,
          url: brand.siteUrl,
        },
      }),
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  if (params.slug === '[slug]' || !params.slug) {
    return null;
  }
  const [ { data: categories }, { data: blogs } ] = await Promise.all([
    fetchBlogCategoriesServer(),
    fetchBlogsByCategoryServer(params.slug)
  ]);

  const category = categories.find((cat: any) => cat.slug === params.slug);

  if (!category) {
    redirect('/blog');
  }

  // API endpoint for client-side pagination
  const apiEndpoint = `/api/blogs?category=${encodeURIComponent(category.slug)}`;

  return (
    <BlogList
      apiEndpoint={apiEndpoint}
      title={`${category.name}`}
      description={`Insights and stories about ${category.name}`}
      showCreateButton={false}
      initialPosts={blogs}
    />
  );
}