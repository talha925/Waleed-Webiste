export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug?: string;
  image?: {
    url: string;
    alt: string;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
} 