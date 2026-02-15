export const BLOG_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' }
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' }
] as const;

export const META_ROBOTS_OPTIONS = [
  { value: 'index,follow', label: 'Index, Follow' },
  { value: 'noindex,follow', label: 'No Index, Follow' },
  { value: 'index,nofollow', label: 'Index, No Follow' },
  { value: 'noindex,nofollow', label: 'No Index, No Follow' }
] as const;

export const FORM_VALIDATION_RULES = {
  title: {
    minLength: 3,
    maxLength: 200
  },
  shortDescription: {
    minLength: 10,
    maxLength: 500
  },
  longDescription: {
    minLength: 50
  },
  metaTitle: {
    maxLength: 60
  },
  metaDescription: {
    maxLength: 160
  }
} as const; 