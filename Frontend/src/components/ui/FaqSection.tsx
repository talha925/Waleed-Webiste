'use client';

import React, { useState } from 'react';
import FormField from './FormField';

interface FAQ {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  faqs: FAQ[];
  onChange: (faqs: FAQ[]) => void;
  errors: {[key: string]: string};
}

const FaqSection = ({ faqs, onChange, errors }: FaqSectionProps) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const handleAddFaq = () => {
    if (newQuestion.trim() || newAnswer.trim()) {
      const updatedFaqs = [...faqs, { question: newQuestion, answer: newAnswer }];
      onChange(updatedFaqs);
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const handleRemoveFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    onChange(updatedFaqs);
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index][field] = value;
    onChange(updatedFaqs);
  };

  return (
    <div className="space-y-4">
      {/* Existing FAQs */}
      {faqs.map((faq, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-800">FAQ {index + 1}</h4>
            <button
              type="button"
              onClick={() => handleRemoveFaq(index)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
          
          <FormField
            id={`faqQuestion${index}`}
            label="Question"
            value={faq.question}
            onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
            error={errors[`faqQuestion${index}`]}
            className="mb-2"
          />
          
          <FormField
            id={`faqAnswer${index}`}
            label="Answer"
            as="textarea"
            value={faq.answer}
            onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
            error={errors[`faqAnswer${index}`]}
          />
        </div>
      ))}

      {/* Add new FAQ */}
      <div className="p-4 border border-gray-200 rounded-lg border-dashed">
        <h4 className="font-medium text-gray-800 mb-3">Add New FAQ</h4>
        
        <FormField
          id="newFaqQuestion"
          label="Question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Enter FAQ question"
          className="mb-2"
        />
        
        <FormField
          id="newFaqAnswer"
          label="Answer"
          as="textarea"
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          placeholder="Enter FAQ answer"
        />
        
        <button
          type="button"
          onClick={handleAddFaq}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add FAQ
        </button>
      </div>
    </div>
  );
};

export default FaqSection; 