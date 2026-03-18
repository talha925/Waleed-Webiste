'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HttpClient from '@/services/HttpClient';
import Image from 'next/image';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import config from '@/lib/config';
import {
  FormField,
  CategorySelector,
  StoreSelector,
  FAQSection,
  SEOMetadataSection
} from './index';
import OptimizedRichTextEditor from '@/components/ui/OptimizedRichTextEditor';
import { Category, Store, BlogValidationErrors } from '@/lib/types';
import {
  isValidUrl,
  isValidEmail,
  stripHtml,
  sanitizeHtml,
  cleanAndFormatUrl
} from '@/lib/utils/validation';
import { processTags } from '@/lib/utils/formatting';
import { BLOG_STATUS_OPTIONS } from '@/lib/constants/options';

interface BlogFormProps {
  initialValues?: Partial<{
    _id: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    categoryId: string;
    storeId: string;
    storeUrl: string;
    authorName: string;
    authorEmail: string;
    authorAvatar: string;
    status: string;
    isFeatured: boolean;
    imageUrl: string;
    imageAlt: string;
    tags: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    metaCanonicalUrl: string;
    metaRobots: string;
    faqs: Array<{ question: string; answer: string }>;
    frontBanner: boolean;
  }>;
  onSubmit?: (data: any, resetForm: () => void, setLoading: (b: boolean) => void, setMessage: (msg: string) => void, setErrors: (e: any) => void) => Promise<void>;
  submitLabel?: string;
  loadingOverride?: boolean;
}

const BlogForm = ({ initialValues, onSubmit, submitLabel, loadingOverride }: BlogFormProps = {}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, token } = useUnifiedAuth();
  const httpClient = new HttpClient();

  // Required Fields
  const [title, setTitle] = useState(initialValues?.title || '');
  const [shortDescription, setShortDescription] = useState(initialValues?.shortDescription || '');
  const [longDescription, setLongDescription] = useState(initialValues?.longDescription || '');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId || '');
  const [storeId, setStoreId] = useState(initialValues?.storeId || '');
  const [storeUrl, setStoreUrl] = useState(initialValues?.storeUrl || '');
  const [authorName, setAuthorName] = useState(initialValues?.authorName || '');
  const [status, setStatus] = useState(initialValues?.status || 'draft');

  // Optional Fields
  const [authorEmail, setAuthorEmail] = useState(initialValues?.authorEmail || '');
  const [authorAvatar, setAuthorAvatar] = useState(initialValues?.authorAvatar || '');
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl || '');
  const [imageAlt, setImageAlt] = useState(initialValues?.imageAlt || '');
  const [isFeatured, setIsFeatured] = useState(initialValues?.isFeatured || false);
  const [frontBanner, setFrontBanner] = useState(initialValues?.frontBanner || false);
  const [tags, setTags] = useState(initialValues?.tags || '');

  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploadMessage, setImageUploadMessage] = useState('');

  // SEO Metadata Fields
  const [metaTitle, setMetaTitle] = useState(initialValues?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialValues?.metaDescription || '');
  const [metaKeywords, setMetaKeywords] = useState(initialValues?.metaKeywords || '');
  const [metaCanonicalUrl, setMetaCanonicalUrl] = useState(initialValues?.metaCanonicalUrl || '');
  const [metaRobots, setMetaRobots] = useState(initialValues?.metaRobots || 'index,follow');

  // FAQs Section (only declare once, with initialValues support)
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(initialValues?.faqs || []);

  // Form State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(true);

  // Validation States
  const [errors, setErrors] = useState<BlogValidationErrors>({});

  // Image Upload Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageUrl(''); // Clear existing URL so the new file takes priority
      setImageUploadMessage('');
    }
  };

  // Fetch Blog Categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await httpClient.get('/api/blog-categories');
        // Handle the nested structure: { data: { categories: [...] } }
        const categoriesData = response.data?.categories || response.categories || (Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch Stores from API
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setStoresLoading(true);
        const data = await httpClient.get('/api/proxy-stores');
        const storesData = data.data || data || [];
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setStoresLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleStoreChange = (selectedStoreId: string, selectedStoreUrl: string) => {
    setStoreId(selectedStoreId);
    setStoreUrl(selectedStoreUrl);
  };

  const handleMetaChange = (field: string, value: string) => {
    switch (field) {
      case 'metaTitle':
        setMetaTitle(value);
        break;
      case 'metaDescription':
        setMetaDescription(value);
        break;
      case 'metaKeywords':
        setMetaKeywords(value);
        break;
      case 'metaCanonicalUrl':
        setMetaCanonicalUrl(value);
        break;
      case 'metaRobots':
        setMetaRobots(value);
        break;
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors: BlogValidationErrors = {};

    // Required field validations
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }

    if (!shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    } else if (shortDescription.trim().length < 10) {
      newErrors.shortDescription = 'Short description must be at least 10 characters long';
    } else if (shortDescription.trim().length > 500) {
      newErrors.shortDescription = 'Short description must not exceed 500 characters';
    }

    const plainLongDescription = stripHtml(longDescription);

    if (!plainLongDescription.trim()) {
      newErrors.longDescription = 'Long description is required';
    } else if (plainLongDescription.trim().length < 50) {
      newErrors.longDescription = 'Long description must be at least 50 characters long';
    }

    /* 
    if (!categoryId) {
      newErrors.category = 'Category is required';
    }

    if (!storeId) {
      newErrors.store = 'Store is required';
    } else if (!storeUrl) {
      newErrors.store = 'Selected store must have a valid URL';
    }
    */

    if (!authorName.trim()) {
      newErrors.authorName = 'Author name is required';
    }

    // Optional field validations
    if (authorEmail && !isValidEmail(authorEmail)) {
      newErrors.authorEmail = 'Please enter a valid email address';
    }

    if (authorAvatar && !isValidUrl(authorAvatar)) {
      newErrors.authorAvatar = 'Please enter a valid URL';
    }

    if (imageUrl && !isValidUrl(imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }

    // SEO metadata validations
    if (metaTitle && metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title should not exceed 60 characters';
    }

    if (metaDescription && metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description should not exceed 160 characters';
    }

    if (metaCanonicalUrl && !isValidUrl(metaCanonicalUrl)) {
      newErrors.metaCanonicalUrl = 'Please enter a valid canonical URL';
    }

    // FAQ validations
    faqs.forEach((faq, index) => {
      if (!faq.question.trim()) {
        newErrors[`faqQuestion${index}`] = 'FAQ question is required';
      }
      if (!faq.answer.trim()) {
        newErrors[`faqAnswer${index}`] = 'FAQ answer is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage('Please fix the errors above before submitting.');
      return;
    }

    setLoading(true);
    setMessage('');

    // Find the selected category and store objects (Optional now)
    const selectedCategory = categories.find(cat => cat._id === categoryId);
    const selectedStore = stores.find(store => store._id === storeId);

    // Clean the URL before validation (if store is selected)
    const cleanUrl = storeUrl ? cleanAndFormatUrl(storeUrl) : '';

    if (cleanUrl) {
      try {
        new URL(cleanUrl);
      } catch (error) {
        setMessage('Invalid store URL format. Please check the URL and try again.');
        setLoading(false);
        return;
      }
    }

    // Handle image upload if there's a selected file
    let finalImageUrl = imageUrl;

    if (imageFile) {
      console.log('New image file detected, starting upload...', imageFile.name);
      try {
        setMessage('Uploading image...');
        const formData = new FormData();
        formData.append('folder', 'blogs');
        formData.append('image', imageFile);

        const uploadResponse = await fetch(`${config.api.baseUrl}/api/upload`, {
          method: 'POST',
          body: formData,
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Image upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const uploadData = await uploadResponse.json();
        const newImageUrl = uploadData.data?.imageUrl || uploadData.imageUrl;

        if (!newImageUrl) {
          throw new Error('Image URL not found in upload response');
        }

        console.log('Image upload successful. New URL:', newImageUrl);
        finalImageUrl = newImageUrl;
        setImageUrl(newImageUrl);
        setImageFile(null);
        setMessage('Image uploaded successfully! Synchronizing data...');
      } catch (uploadError: any) {
        console.error('Error uploading image:', uploadError);
        setMessage(`Failed to upload image: ${uploadError.message}`);
        setLoading(false);
        return;
      }
    } else {
      console.log('No new image file selected. Using existing URL or manual URL:', finalImageUrl);
    }

    // Process tags
    const processedTags = processTags(tags);

    // Sanitize the HTML content from TinyMCE
    const sanitizedLongDescription = sanitizeHtml(longDescription);

    // Build the blog data object
    const blogData = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      longDescription: sanitizedLongDescription,
      author: {
        name: authorName.trim(),
        email: authorEmail.trim() || undefined,
        avatar: authorAvatar.trim() || undefined,
      },
      ...(selectedCategory && {
        category: {
          id: selectedCategory._id,
          name: selectedCategory.name,
          slug: selectedCategory.name.toLowerCase().replace(/\s+/g, '-'),
        },
      }),
      ...(selectedStore && {
        store: {
          id: selectedStore._id,
          name: selectedStore.name,
          url: cleanUrl || selectedStore.trackingUrl || '',
        },
      }),
      status,
      isFeaturedForHome: isFeatured,
      FrontBanner: frontBanner,
      // Only include image if we have a valid image URL
      ...(finalImageUrl && finalImageUrl.trim() && {
        image: {
          url: finalImageUrl.trim(),
          alt: imageAlt.trim() || title.trim()
        }
      }),
      tags: processedTags.length > 0 ? processedTags : undefined,
      // SEO Metadata
      meta: {
        title: metaTitle.trim() || undefined,
        description: metaDescription.trim() || undefined,
        keywords: typeof metaKeywords === 'string' ? metaKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
        canonicalUrl: metaCanonicalUrl.trim() || undefined,
        robots: metaRobots.trim() || 'index,follow',
      },
      // FAQs
      faqs: faqs.length > 0 ? faqs : undefined,
    };
    console.log('Final Blog Data to be submitted:', JSON.stringify(blogData, null, 2));

    if (onSubmit) {
      console.log('Calling onSubmit handler...');
      await onSubmit(blogData, resetForm, setLoading, setMessage, setErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await httpClient.post('/api/create-blog', blogData);
      console.log('Blog creation response:', response);
      setMessage('Blog created successfully!');

      // Unconditionally clear banner cache so new edits or unticks are immediately visible
      localStorage.removeItem('heroBannerData_v11');
      console.log('Banner cache cleared (v11) due to blog creation');

      // Reset form after successful save
      resetForm();
      // Redirect to admin blogs page after successful creation
      setTimeout(() => {
        router.push('/admin/blogs');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating blog:', error);

      // Extract more detailed error information
      let errorMessage = 'Error creating blog. Please try again.';

      if (error?.response) {
        // API returned an error response
        errorMessage = error.response.error || error.response.message || errorMessage;
      } else if (error?.message) {
        // Network or other error
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      console.error('Detailed error info:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        isNetworkError: error?.isNetworkError,
        isTimeoutError: error?.isTimeoutError
      });

      setMessage(errorMessage);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setShortDescription('');
    setLongDescription('');
    setAuthorName('');
    setAuthorEmail('');
    setAuthorAvatar('');
    setCategoryId('');
    setStoreId('');
    setStoreUrl('');
    setStatus('draft');
    setIsFeatured(false);
    setFrontBanner(false);
    setImageUrl('');
    setImageAlt('');
    setTags('');
    setImageFile(null);
    // Reset SEO metadata
    setMetaTitle('');
    setMetaDescription('');
    setMetaKeywords('');
    setMetaCanonicalUrl('');
    setMetaRobots('index,follow');
    // Reset FAQs
    setFaqs([]);
    setErrors({});
    // Clear localStorage draft
    localStorage.removeItem('blogDraft');
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blogDraft');
      if (saved) setLongDescription(saved);
    } catch (error) {
      console.error('Error loading draft from localStorage:', error);
    }
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Create a New Blog Post
      </h1>

      {isLoading || !isAuthenticated ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-xl">Loading...</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Required Fields</h2>

            <FormField
              id="title"
              label="Title"
              type="text"
              value={title}
              onChange={setTitle}
              placeholder="Enter blog title"
              required
              error={errors.title}
            />

            <FormField
              id="shortDescription"
              label="Short Description (Max 500 characters)"
              type="text"
              value={shortDescription}
              onChange={setShortDescription}
              placeholder="Brief description of the blog post"
              required
              maxLength={500}
              error={errors.shortDescription}
            />

            <OptimizedRichTextEditor
              id="longDescription"
              value={longDescription}
              onChange={(content) => setLongDescription(content)}
              label="Long Description"
              error={errors.longDescription}
              placeholder="Write your detailed blog content here..."
              required
              mode="advanced"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <CategorySelector
                categories={categories}
                selectedCategoryId={categoryId}
                onCategoryChange={setCategoryId}
                loading={categoriesLoading}
                error={errors.category}
              />

              <StoreSelector
                stores={stores}
                selectedStoreId={storeId}
                onStoreChange={handleStoreChange}
                loading={storesLoading}
                error={errors.store}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <FormField
                id="authorName"
                label="Author Name"
                type="text"
                value={authorName}
                onChange={setAuthorName}
                placeholder="Author name"
                required
                error={errors.authorName}
              />

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  {BLOG_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Optional Fields</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <FormField
                id="authorEmail"
                label="Author Email"
                type="email"
                value={authorEmail}
                onChange={setAuthorEmail}
                placeholder="author@example.com"
                error={errors.authorEmail}
              />

              <FormField
                id="authorAvatar"
                label="Author Avatar URL"
                type="url"
                value={authorAvatar}
                onChange={setAuthorAvatar}
                placeholder="https://example.com/avatar.jpg"
                error={errors.authorAvatar}
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 cursor-pointer">Upload Image (Optional)</label>
              <div className="text-xs text-gray-500 mb-2">
                Select an image file to upload. The image will be uploaded automatically when you submit the blog post.
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {imageFile && (
                <div className="text-sm text-green-600 mt-1">
                  ✓ Selected: {imageFile.name} (will be uploaded when you submit the blog)
                </div>
              )}

              {imageUrl && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Image Preview:</div>
                  {/* Ensure image URL is encoded for Next.js Image component */}
                  <Image
                    src={imageUrl}
                    alt={imageAlt || 'Uploaded preview'}
                    width={500}
                    height={300}
                    className="rounded-lg w-full max-w-md h-auto object-cover border border-gray-300"
                    unoptimized={true} // For testing purposes, remove in production if not needed
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <FormField
                id="imageUrl"
                label="Image URL (Alternative to upload above)"
                type="url"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="https://example.com/image.jpg"
                error={errors.imageUrl}
              />

              <FormField
                id="imageAlt"
                label="Image Alt Text"
                type="text"
                value={imageAlt}
                onChange={setImageAlt}
                placeholder="Description of the image"
              />
            </div>

            <FormField
              id="tags"
              label="Tags"
              type="text"
              value={tags}
              onChange={setTags}
              placeholder="Enter tags separated by commas (e.g., technology, web development, tips)"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                <input
                  id="isFeatured"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isFeatured" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Featured for Home
                </label>
              </div>

              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                <input
                  id="frontBanner"
                  type="checkbox"
                  checked={frontBanner}
                  onChange={(e) => setFrontBanner(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="frontBanner" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Front Banner
                </label>
              </div>
            </div>
          </div>

          {/* SEO Metadata Section */}
          <SEOMetadataSection
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            metaKeywords={metaKeywords}
            metaCanonicalUrl={metaCanonicalUrl}
            metaRobots={metaRobots}
            onMetaChange={handleMetaChange}
            errors={errors}
          />

          {/* FAQs Section */}
          <FAQSection
            faqs={faqs}
            onFaqsChange={setFaqs}
            errors={errors}
          />

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading
                ? (submitLabel?.includes('Update') ? 'Updating...' : 'Creating...')
                : (submitLabel || 'Create Blog Post')}
            </button>
          </div>

          {message && (
            <div className="mt-6 text-center text-lg text-gray-700">
              {message}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default BlogForm;