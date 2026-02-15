'use client';

import React from 'react';
import FormField from './FormField';
import { META_ROBOTS_OPTIONS } from '@/lib/constants/options';

interface SEOMetadataSectionProps {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  metaCanonicalUrl: string;
  metaRobots: string;
  onMetaChange: (field: string, value: string) => void;
  errors: { [key: string]: string };
}

const SEOMetadataSection: React.FC<SEOMetadataSectionProps> = ({
  metaTitle,
  metaDescription,
  metaKeywords,
  metaCanonicalUrl,
  metaRobots,
  onMetaChange,
  errors
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">SEO Metadata</h2>
      
      <FormField
        id="metaTitle"
        label="Meta Title"
        type="text"
        value={metaTitle}
        onChange={(value) => onMetaChange('metaTitle', value)}
        placeholder="Enter meta title"
        maxLength={60}
        error={errors.metaTitle}
      />

      <FormField
        id="metaDescription"
        label="Meta Description"
        type="textarea"
        value={metaDescription}
        onChange={(value) => onMetaChange('metaDescription', value)}
        placeholder="Enter meta description"
        maxLength={160}
        error={errors.metaDescription}
      />

      <FormField
        id="metaKeywords"
        label="Meta Keywords"
        type="text"
        value={metaKeywords}
        onChange={(value) => onMetaChange('metaKeywords', value)}
        placeholder="Enter meta keywords separated by commas"
        error={errors.metaKeywords}
      />

      <FormField
        id="metaCanonicalUrl"
        label="Meta Canonical URL"
        type="url"
        value={metaCanonicalUrl}
        onChange={(value) => onMetaChange('metaCanonicalUrl', value)}
        placeholder="Enter meta canonical URL"
        error={errors.metaCanonicalUrl}
      />

      <div className="mb-4">
        <label htmlFor="metaRobots" className="block text-sm font-medium text-gray-700 mb-2">
          Meta Robots
        </label>
        <select
          id="metaRobots"
          value={metaRobots}
          onChange={(e) => onMetaChange('metaRobots', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
        >
          {META_ROBOTS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SEOMetadataSection;