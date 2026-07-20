import BlogList from '@/components/blog/BlogList';
import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';
import { fetchBlogsByCategoryServer } from '@/lib/serverData';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
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

export default async function BlogPage() {
  const { data: initialPosts } = await fetchBlogsByCategoryServer(''); // No category = all blogs
  
  return (
    <BlogList
      apiEndpoint="/api/blogs"
      initialPosts={initialPosts}
      title="Blog Posts"
      description="View and manage all your blog posts"
      showCreateButton={false}
      emptyStateMessage="No Blog Posts Yet"
      emptyStateDescription="Start creating amazing content with our blog form!"
    />
  );
}