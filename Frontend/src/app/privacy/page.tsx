import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `Privacy Policy - ${brand.siteName}`,
    description: `Privacy Policy for ${brand.siteName} - Learn how we collect, use, and protect your personal information.`,
    keywords: `privacy policy, data protection, personal information, cookies, ${brand.siteName}`,
  };
}

export default async function PrivacyPage() {
  const brand = await getBrandConfig();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-primary to-brand-accent rounded-3xl mb-8 shadow-xl rotate-3">
            <svg className="w-12 h-12 text-white -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6">
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">Policy</span>
          </h1>
          <p className="text-base text-slate-700 max-w-3xl mx-auto leading-relaxed">
            At {brand.siteName}, your privacy is very important to us. This Privacy Policy explains what information we collect when you visit our website, how we use it, and how we keep it safe.
          </p>
          <div className="mt-4 text-sm text-slate-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="space-y-8">

          {/* Information We Collect */}
          <section className="bg-white rounded-2xl p-8 shadow-lg border border-indigo-100/50">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Information We Collect
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                When you browse {brand.siteName}, we may collect certain information to improve your experience, such as:
              </p>
              <div className="bg-indigo-50 rounded-xl p-6 border-l-4 border-indigo-500">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                    <span>General details about your device, browser, and operating system</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>Pages you visit on our site and the time spent on them</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                    <span>Information you choose to provide voluntarily, such as when you contact us by email or leave a comment</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                  <p className="text-sm font-medium text-slate-800">
                    We do not collect sensitive personal data unless you provide it directly.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100/50">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              How We Use Your Information
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The information we collect is used for purposes such as:
              </p>
              <div className="grid md:grid-cols-1 gap-4 mt-6">
                <div className="bg-purple-50 rounded-xl p-6 border-l-4 border-purple-500">
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Enhancing the performance and usability of our website</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-pink-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Understanding how visitors use our site so we can improve our content</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Responding to messages, feedback, or inquiries from our readers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100/50">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Cookies
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                {brand.siteName} may use cookies to provide a better browsing experience. Cookies are small files stored on your device that help remember your preferences and improve website functionality.
              </p>
              <div className="bg-pink-50 rounded-xl p-6 border-l-4 border-pink-500">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-pink-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Cookie Control</h3>
                    <p className="text-sm">
                      You can disable cookies in your browser settings if you prefer, but some features may not work as intended.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="bg-white rounded-2xl p-8 shadow-lg border border-rose-100/50">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
              Data Security
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                We take reasonable measures to protect the information you share with us.
              </p>
              <div className="bg-rose-50 rounded-xl p-6 border-l-4 border-rose-500">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-rose-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Important Notice</h3>
                    <p className="text-sm">
                      Please note that no method of online data transmission is completely secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100/50">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Children's Privacy
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                {brand.siteName} does not knowingly collect personal information from children under the age of 13.
              </p>
              <div className="bg-purple-50 rounded-xl p-6 border-l-4 border-purple-500">
                <p className="text-sm">
                  If such information is ever provided to us, we will promptly delete it.
                </p>
              </div>
            </div>
          </section>

          {/* Changes to Policy */}
          <section className="bg-white rounded-2xl p-8 shadow-lg border border-indigo-100/50">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Changes to This Policy
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. Any revisions will be posted on this page with the date of the last update.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-gradient-to-br from-brand-primary to-brand-accent rounded-3xl p-10 md:p-16 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            <h2 className="text-4xl font-black mb-6 relative z-10">Have Questions?</h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto font-medium leading-relaxed relative z-10">
              If you have any questions, suggestions, or concerns about this Privacy Policy, please don't hesitate to reach out. We're here to help.
            </p>
            <div className="flex items-center justify-center relative z-10">
              <a
                href={`mailto:${brand.contactEmail}`}
                className="flex items-center space-x-3 bg-white text-brand-primary rounded-2xl px-10 py-5 hover:bg-slate-50 transition-all duration-300 transform hover:scale-105 shadow-xl group"
              >
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xl font-black">{brand.contactEmail}</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}