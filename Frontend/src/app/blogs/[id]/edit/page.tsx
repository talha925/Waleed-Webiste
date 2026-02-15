"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import HttpClient from "@/services/HttpClient";
import BlogForm from "@/components/blog/BlogForm";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const httpClient = new HttpClient();

  // Fetch blog data
  useEffect(() => {
    if (!blogId) return;
    setLoading(true);
    httpClient.get(`/api/blogs/${blogId}`)
      .then((data: any) => {
        // If API returns { blog: {...} }
        const b = data.blog || data;
        setBlog(b);
        setError(null);
      })
      .catch(() => {
        setError("Failed to fetch blog data.");
      })
      .finally(() => setLoading(false));
  }, [blogId]);

  // Map API blog to BlogForm initialValues
  const getInitialValues = (b: any) => {
    if (!b) return undefined;
    return {
      _id: b._id,
      title: b.title,
      shortDescription: b.shortDescription,
      longDescription: b.longDescription,
      categoryId: b.category?.id || "",
      storeId: b.store?.id || "",
      storeUrl: b.store?.url || "",
      authorName: b.author?.name || "",
      authorEmail: b.author?.email || "",
      authorAvatar: b.author?.avatar || "",
      status: b.status,
      isFeatured: b.isFeaturedForHome || false,
      frontBanner: b.FrontBanner || false,
      imageUrl: b.image?.url || "",
      imageAlt: b.image?.alt || "",
      tags: Array.isArray(b.tags) ? b.tags.join(", ") : (b.tags || ""),
      metaTitle: b.meta?.title || "",
      metaDescription: b.meta?.description || "",
      metaKeywords: b.meta?.keywords || "",
      metaCanonicalUrl: b.meta?.canonicalUrl || "",
      metaRobots: b.meta?.robots || "index,follow",
      faqs: b.faqs || [],
    };
  };

  // Handle form submit
  const handleSubmit = useCallback(
    async (
      formData: any,
      _resetForm: () => void,
      setLoading: (b: boolean) => void,
      setMessage: (msg: string) => void,
      setErrors: (e: any) => void
    ) => {
      setFormLoading(true);
      setMessage("");
      setErrors({});
      try {
        await httpClient.put(`/api/blogs/${blogId}`, formData);
        setMessage("Blog updated successfully!");
        setTimeout(() => router.push("/blogs"), 1200);
      } catch (err: any) {
        setMessage("Failed to update blog. Please try again.");
        setErrors(err?.response?.data?.errors || {});
      } finally {
        setFormLoading(false);
        setLoading(false);
      }
    },
    [blogId, router]
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Edit Blog</h1>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/blogs")}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Back to Blogs
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-lg text-gray-600">Loading blog data...</span>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-lg text-red-600">{error}</span>
        </div>
      ) : blog ? (
        <BlogForm
          initialValues={getInitialValues(blog)}
          onSubmit={handleSubmit}
          submitLabel="Update Blog"
          loadingOverride={formLoading}
        />
      ) : null}
    </div>
  );
}