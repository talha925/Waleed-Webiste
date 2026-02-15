'use client';

import { useEffect, useState } from 'react';
import SidebarCard from './SidebarCard';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings?: TOCItem[];
  contentSelector?: string;
}

export default function TableOfContents({ headings: propHeadings, contentSelector = '.blog-content' }: TableOfContentsProps) {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (propHeadings && propHeadings.length > 0) {
      setToc(propHeadings);
      return;
    }

    const generateTOC = () => {
      const contentElement = document.querySelector(contentSelector);
      if (!contentElement) return;

      const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const tocItems: TOCItem[] = [];

      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent || '';
        let id = heading.id;

        // Generate ID if not present
        if (!id) {
          id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
          heading.id = id;
        }

        // Add scroll margin for better positioning
        heading.classList.add('scroll-mt-20');

        if (text.trim()) {
          tocItems.push({ id, text, level });
        }
      });

      setToc(tocItems);
    };

    // Generate TOC after a short delay to ensure content is rendered
    const timer = setTimeout(generateTOC, 100);
    return () => clearTimeout(timer);
  }, [propHeadings, contentSelector]);

  useEffect(() => {
    const handleScroll = () => {
      const headings = toc.map(item => document.getElementById(item.id)).filter(Boolean);

      let currentActiveId = '';
      for (const heading of headings) {
        if (heading) {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 100) {
            currentActiveId = heading.id;
          } else {
            break;
          }
        }
      }

      setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (toc.length === 0) {
    return (
      <SidebarCard title="Table of Contents" icon="📋">
        <div className="text-center py-4">
          <span className="text-sm text-gray-500">No headings found</span>
        </div>
      </SidebarCard>
    );
  }

  return (
    <SidebarCard title="Table of Contents" icon="📋">
      <nav className="space-y-1 max-h-80 overflow-y-auto">
        {toc.map((item, index) => {
          const isActive = activeId === item.id;
          const paddingLeft = `${(item.level - 1) * 12 + 8}px`;

          return (
            <button
              key={index}
              onClick={() => scrollToHeading(item.id)}
              className={`w-full text-left p-2 rounded-lg transition-all duration-300 hover:bg-blue-50 group ${isActive ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                }`}
              style={{ paddingLeft }}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full transition-colors ${item.level === 1 ? 'bg-blue-600' :
                  item.level === 2 ? 'bg-blue-500' :
                    item.level === 3 ? 'bg-blue-400' :
                      'bg-blue-300'
                  } ${isActive ? 'scale-125' : ''}`}></div>
                <span className={`text-sm transition-colors line-clamp-2 ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-700 group-hover:text-blue-600'
                  } ${item.level === 1 ? 'font-semibold' :
                    item.level === 2 ? 'font-medium' :
                      'font-normal'
                  }`}>
                  {item.text}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </SidebarCard>
  );
}