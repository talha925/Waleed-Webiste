import BlogList from '@/components/blog/BlogList';
import { Metadata } from 'next';
import { getBrandConfig } from '@config/index';

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();
  return {
    title: `Our Blog | ${brand.siteName}`,
    description: `Stay updated with the latest trends, tips, and insights from ${brand.siteName}.`,
    openGraph: {
      title: `Our Blog | ${brand.siteName}`,
      description: `Stay updated with the latest trends, tips, and insights from ${brand.siteName}.`,
      url: `${brand.siteUrl}/blog`,
    },
    alternates: {
      canonical: `${brand.siteUrl}/blog`,
    },
  };
}

export default function BlogPage() {
  return (
    <BlogList
      apiEndpoint="/api/blogs"
      title="Blog Posts"
      description="View and manage all your blog posts"
      showCreateButton={false}
      emptyStateMessage="No Blog Posts Yet"
      emptyStateDescription="Start creating amazing content with our blog form!"
    />
  );
}