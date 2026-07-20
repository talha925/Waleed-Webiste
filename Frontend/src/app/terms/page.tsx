import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `Terms & Conditions - ${brand.siteName}`,
    description: `Terms and Conditions for ${brand.siteName}. Please read these terms carefully before using our website.`,
    keywords: `terms, conditions, ${brand.siteName}, legal, website terms, usage policy`,
  };
}

export default async function TermsPage() {
  const brand = await getBrandConfig();

  return (
    <div className="min-h-screen bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full opacity-30"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full opacity-30"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-full opacity-30"></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full opacity-20"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className={`text-4xl md:text-5xl font-black text-slate-900 mb-4`}>
            Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">Conditions</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Welcome to {brand.siteName}. By using our website, you agree to the following terms and conditions.
          </p>
        </div>

        {/* Terms Content */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">

            {/* Terms Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h2 className="text-3xl font-black text-center relative z-10">Legal Terms & Conditions</h2>
              <p className="text-center mt-2 text-white/80 text-lg font-medium relative z-10">Effective and binding agreement for {brand.siteName}</p>
            </div>

            <div className="p-8 md:p-10 space-y-8">
              {/* Use of Our Website */}
              <section className="border-l-4 border-blue-500 pl-6 bg-blue-50/50 rounded-r-xl p-6 hover:bg-blue-50/80 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm font-bold text-white">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Use of Our Website
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      By accessing and using {brand.siteName}, you accept and agree to be bound by the terms and provision of this agreement.
                      You may use our website for lawful purposes only and in accordance with these terms.
                    </p>
                  </div>
                </div>
              </section>

              {/* Content Ownership */}
              <section className="border-l-4 border-emerald-500 pl-6 bg-emerald-50/50 rounded-r-xl p-6 hover:bg-emerald-50/80 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm font-bold text-white">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Content Ownership
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      All content on {brand.siteName}, including text, images, and graphics, is owned by us or our content suppliers.
                      You may not reproduce, distribute, or create derivative works without our written permission.
                    </p>
                  </div>
                </div>
              </section>

              {/* Accuracy of Information */}
              <section className="border-l-4 border-amber-500 pl-6 bg-amber-50/50 rounded-r-xl p-6 hover:bg-amber-50/80 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm font-bold text-white">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Accuracy of Information
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      While we strive to provide accurate and up-to-date information, we make no warranties about the completeness,
                      reliability, or accuracy of this information. Any action you take based on the information is at your own risk.
                    </p>
                  </div>
                </div>
              </section>

              {/* External Links */}
              <section className="border-l-4 border-purple-500 pl-6 bg-purple-50/50 rounded-r-xl p-6 hover:bg-purple-50/80 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm font-bold text-white">4</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      External Links
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Our website may contain links to external sites. We are not responsible for the content or privacy practices
                      of these external websites. Visiting these links is at your own discretion and risk.
                    </p>
                  </div>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section className="border-l-4 border-rose-500 pl-6 bg-rose-50/50 rounded-r-xl p-6 hover:bg-rose-50/80 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm font-bold text-white">5</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Limitation of Liability
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {brand.siteName} shall not be liable for any indirect, incidental, special, or consequential damages resulting
                      from your use of our website or services, even if we have been advised of the possibility of such damages.
                    </p>
                  </div>
                </div>
              </section>

              {/* Changes to Terms */}
              <section className="border-l-4 border-indigo-500 pl-6 bg-indigo-50/50 rounded-r-xl p-6 hover:bg-indigo-50/80 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm font-bold text-white">6</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Changes to Terms
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.
                      Your continued use of the website constitutes acceptance of the modified terms.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact Us */}
              <section className="border-l-4 border-slate-500 pl-6 bg-slate-50/50 rounded-r-xl p-6 hover:bg-slate-50/80 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm font-bold text-white">7</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Contact Us
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      If you have any questions about these Terms and Conditions, please contact us at{' '}
                      <a href={`mailto:${brand.contactEmail}`} className="text-blue-600 hover:text-blue-800 underline font-medium">
                        {brand.contactEmail}
                      </a>
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center mt-10">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 font-medium">
                Last Updated: {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">Questions About Our Terms?</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              If you have any questions or concerns about these terms and conditions,
              our team is here to help you understand everything clearly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center bg-gradient-to-r from-brand-primary to-brand-accent text-white font-black py-4 px-8 rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center bg-white text-gray-700 font-semibold py-4 px-8 rounded-xl hover:bg-gray-50 transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}