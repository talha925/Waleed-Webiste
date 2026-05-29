import { Category } from './category';

export interface Store {
  _id: string;
  slug: string;
  categories?: Category[];
  name: string;
  trackingUrl?: string;
  image?: {
    url: string;
    alt: string;
  };
  heading?: string;
  short_description?: string;
  long_description?: string;
  language?: string;
  isTopStore?: boolean;
  isEditorsChoice?: boolean;
  coupons?: Coupon[];
  seo?: SEO;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  redirectUrl?: string;
}

export interface Coupon {
  _id: string;
  offerDetails: string;
  code: string;
  active: boolean;
  isValid: boolean;
  featuredForHome?: boolean;
  hits?: number;
  lastAccessed?: string | null;
  order?: number;
  isBestValue?: boolean;
  isExclusive?: boolean;
  expiryDate?: string;
  usedCount?: number;
}

export interface SEO {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  description?: string;
  [key: string]: any;
}



export interface StoresApiResponse {
  status: string;
  data: Store[];
  metadata?: {
    totalStores: number;
    timestamp: string;
  };
}

export interface StoreFormData {
  name: string;
  trackingUrl: string;
  imageUrl: string;
  imageAlt: string;
  heading: string;
  language: string;
  isTopStore: boolean;
  isEditorsChoice: boolean;
}