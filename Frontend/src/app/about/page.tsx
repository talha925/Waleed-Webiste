import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';
import { themeClasses } from '@/lib/theme/utils';

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();
  return {
    title: `About Us - ${brand.siteName}`,
    description: `Learn about ${brand.siteName}, your trusted source for savings, deals, and shopping guides. Discover our mission to help you make informed purchasing decisions.`,
    keywords: `about ${brand.siteName}, savings blog, deal finder, shopping guides, money saving tips`,
  };
}

export default function AboutPage() {
  const brand = getBrandConfig();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className={`flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mx-auto mb-8 shadow-xl`}>
            <svg className={`w-10 h-10 text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className={`text-5xl md:text-6xl font-bold ${themeClasses.text.primary} mb-6`}>
            About {brand.siteName}
          </h1>
          <p className={`text-xl ${themeClasses.text.secondary} max-w-3xl mx-auto leading-relaxed`}>
            Your trusted companion in the world of smart shopping, savings, and financial wisdom.
          </p>
          <div className="flex items-center justify-center space-x-8 mt-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <span className={`text-sm ${themeClasses.text.secondary} font-medium`}>Smart Shopping</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              <span className={`text-sm ${themeClasses.text.secondary} font-medium`}>Money Saving</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary/60 rounded-full animate-pulse"></div>
              <span className={`text-sm ${themeClasses.text.secondary} font-medium`}>Expert Guides</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Welcome Section */}
          <section className={`bg-card rounded-2xl p-8 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center mb-6">
              <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                <svg className={`w-6 h-6 text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                </svg>
              </div>
              <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>Welcome to {brand.siteName}</h2>
            </div>
            <p className={`text-lg ${themeClasses.text.secondary} leading-relaxed`}>
              Welcome to {brand.siteName}, your trusted destination for smart shopping insights, money-saving tips, and well-curated product recommendations. Our mission is to make your shopping experience easier, more informed, and more rewarding by sharing valuable content across multiple categories.
            </p>
          </section>

          {/* Our Purpose and Vision */}
          <section className={`bg-card rounded-2xl p-8 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center mb-6">
              <div className={`w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                <svg className={`w-6 h-6 text-accent`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className={`text-3xl font-bold ${themeClasses.text.primary}`}>
                Our Purpose and Vision
              </h2>
            </div>
            <p className={`text-lg ${themeClasses.text.secondary} leading-relaxed mb-4`}>
              At {brand.siteName}, we aim to empower readers with the knowledge they need to shop wisely. From exploring the latest trends to discovering practical tips that help you save both time and money, we are committed to being a reliable resource for modern consumers.
            </p>
            <p className={`text-lg ${themeClasses.text.secondary} leading-relaxed`}>
              Our vision is to create a platform where shopping becomes less stressful and more enjoyable. We strive to simplify your decision-making process by offering authentic, easy-to-understand, and research-backed content.
            </p>
          </section>

          {/* What We Offer */}
          <section className={`bg-card rounded-2xl p-8 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center mb-8">
              <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                <svg className={`w-6 h-6 text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className={`text-3xl font-bold ${themeClasses.text.primary}`}>
                What We Offer
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`bg-background-secondary p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Shopping Guides</h3>
                </div>
                <p className={themeClasses.text.secondary}>Detailed content to help you make better buying choices</p>
              </div>
              <div className={`bg-background-secondary p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-3`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Smart Tips</h3>
                </div>
                <p className={themeClasses.text.secondary}>Practical advice to stretch your budget without compromising quality</p>
              </div>
              <div className={`bg-background-secondary p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-8 h-8 bg-primary/80 rounded-lg flex items-center justify-center mr-3`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Product Insights</h3>
                </div>
                <p className={themeClasses.text.secondary}>Honest reviews and recommendations tailored to your needs</p>
              </div>
              <div className={`bg-background-secondary p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-8 h-8 bg-accent/80 rounded-lg flex items-center justify-center mr-3`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Fresh Content</h3>
                </div>
                <p className={themeClasses.text.secondary}>Regular updates to keep you informed about the latest trends</p>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className={`bg-card rounded-2xl p-8 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center mb-8">
              <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                <svg className={`w-6 h-6 text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className={`text-3xl font-bold ${themeClasses.text.primary}`}>
                Why Choose {brand.siteName}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className={`bg-background-secondary p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 bg-success/80 rounded-lg flex items-center justify-center mr-3 shadow-md`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Trusted Reviews</h3>
                </div>
                <p className={themeClasses.text.secondary}>Honest, unbiased reviews from real users who care about value</p>
              </div>
              <div className={`bg-background-secondary p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 bg-button-blue/80 rounded-lg flex items-center justify-center mr-3 shadow-md`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Quick Updates</h3>
                </div>
                <p className={themeClasses.text.secondary}>Stay ahead with the latest deals and product launches</p>
              </div>
              <div className={`bg-background-secondary p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 bg-warning/80 rounded-lg flex items-center justify-center mr-3 shadow-md`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Community Driven</h3>
                </div>
                <p className={themeClasses.text.secondary}>Join thousands of smart shoppers sharing tips and experiences</p>
              </div>
            </div>
          </section>

          {/* Join Our Community */}
          <section className={`bg-card rounded-2xl p-8 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center mb-8">
              <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                <svg className={`w-6 h-6 text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h2 className={`text-3xl font-bold ${themeClasses.text.primary}`}>
                Join Our Community
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className={`bg-background-secondary p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mr-3 shadow-md`}>
                    <svg className={`w-5 h-5 text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Share Your Experience</h3>
                </div>
                <p className={`${themeClasses.text.secondary} mb-4`}>Connect with fellow shoppers and share your discoveries</p>
              </div>
              <div className={`bg-background-secondary p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 border border-border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mr-3 shadow-md`}>
                    <svg className={`w-5 h-5 text-accent`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a2 2 0 012-2h4a2 2 0 012 2v7h6M4 19V9a2 2 0 012-2h12a2 2 0 012 2v10" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Get Exclusive Updates</h3>
                </div>
                <p className={`${themeClasses.text.secondary} mb-4`}>Be the first to know about new deals and product reviews</p>
              </div>
            </div>
          </section>

          {/* Get in Touch */}
          <section className={`bg-card rounded-2xl p-8 shadow-xl border border-border hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center mb-8">
              <div className={`w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                <svg className={`w-6 h-6 text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className={`text-3xl font-bold ${themeClasses.text.primary}`}>
                Get in Touch
              </h2>
            </div>
            <div className="text-center">
              <p className={`text-lg ${themeClasses.text.secondary} mb-8 leading-relaxed max-w-2xl mx-auto`}>
                Have questions, suggestions, or want to collaborate? We'd love to hear from you!
                Join our community of smart shoppers and start your journey to better shopping decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="/contact" className={themeClasses.buttons.orange + " flex items-center"}>
                  <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Us
                </a>
                <a href="/" className={themeClasses.buttons.outline + " px-8 py-2 rounded-full transform hover:scale-105 flex items-center"}>
                  <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Explore Guides
                </a>
              </div>
              <div className="mt-8 flex justify-center space-x-6">
                <div className="flex items-center text-slate-600">
                  <div className={`w-8 h-8 bg-button-blue/80 rounded-lg flex items-center justify-center mr-2`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Follow us</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a2 2 0 012-2h4a2 2 0 012 2v7h6M4 19V9a2 2 0 012-2h12a2 2 0 012 2v10" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Subscribe</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Join community</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}