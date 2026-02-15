'use client';

import React from 'react';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  onFaqsChange: (faqs: FAQ[]) => void;
  errors: { [key: string]: string };
}

const FAQSection: React.FC<FAQSectionProps> = ({
  faqs,
  onFaqsChange,
  errors
}) => {
  const addFAQ = () => {
    onFaqsChange([...faqs, { question: '', answer: '' }]);
  };

  const removeFAQ = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    onFaqsChange(updatedFaqs);
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index][field] = value;
    onFaqsChange(updatedFaqs);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">FAQs</h2>
      
      {/* FAQs List */}
      <div className="mb-4">
        {faqs.map((faq, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-800">FAQ {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeFAQ(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="mb-2">
              <label htmlFor={`faqQuestion${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <input
                id={`faqQuestion${index}`}
                type="text"
                value={faq.question}
                onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 ${
                  errors[`faqQuestion${index}`] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors[`faqQuestion${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`faqQuestion${index}`]}</p>}
            </div>
            <div className="mb-2">
              <label htmlFor={`faqAnswer${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Answer
              </label>
              <textarea
                id={`faqAnswer${index}`}
                rows={3}
                value={faq.answer}
                onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 ${
                  errors[`faqAnswer${index}`] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors[`faqAnswer${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`faqAnswer${index}`]}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Add New FAQ */}
      <div className="flex items-center mt-4">
        <button
          type="button"
          onClick={addFAQ}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New FAQ
        </button>
      </div>
    </div>
  );
};

export default FAQSection;