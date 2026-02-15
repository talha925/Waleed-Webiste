export interface Blog {
  _id?: string;
  title: string;
  slug: string; // Required for consistent routing
  shortDescription: string;
  longDescription: string;
  author: {
    name: string;
    email?: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  store: {
    id: string;
    name: string;
    url: string;
  };
  status: 'draft' | 'published';
  isFeaturedForHome?: boolean;
  frontBanner?: boolean;
  FrontBanner?: boolean; // API response uses PascalCase
  image?: {
    url: string;
    alt: string;
  };
  tags?: string[];
  meta?: {
    title?: string;
    description?: string;
    keywords?: string;
    canonicalUrl?: string;
    robots?: string;
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogFormData {
  title: string;
  shortDescription: string;
  longDescription: string;
  categoryId: string;
  storeId: string;
  storeUrl: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  status: 'draft' | 'published';
  imageUrl: string;
  imageAlt: string;
  isFeatured: boolean;
  frontBanner: boolean;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  metaCanonicalUrl: string;
  metaRobots: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface BlogValidationErrors {
  [key: string]: string;
}