import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';
import { themeClasses } from '@/lib/theme/utils';

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();
  return {
    title: `Contact Us - ${brand.siteName}`,
    description: `Get in touch with ${brand.siteName}. We would love to hear from you for suggestions, collaborations, or general inquiries.`,
    keywords: `contact, ${brand.siteName}, email, support, inquiries, collaboration`,
  };
}

export default function ContactPage() {
  const brand = getBrandConfig();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className={`text-5xl md:text-6xl font-bold ${themeClasses.text.primary} mb-6`}>
            Contact Us
          </h1>
          <p className={`text-xl ${themeClasses.text.secondary} max-w-3xl mx-auto leading-relaxed`}>
            We would love to hear from you! Whether you have questions, suggestions, or collaboration ideas,
            feel free to reach out to us.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
                <h2 className={`text-3xl font-bold ${themeClasses.text.primary} mb-6`}>
                  Get in Touch
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Email</h3>
                      <a
                        href={`mailto:${brand.contactEmail}`}
                        className="text-primary hover:opacity-80 transition-opacity duration-300 font-medium underline"
                      >
                        {brand.contactEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Response Time</h3>
                      <p className={themeClasses.text.secondary}>We typically respond within 24-48 hours</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Location</h3>
                      <p className={themeClasses.text.secondary}>Online - Serving Globally</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Contact Us */}
              <div className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
                <h3 className={`text-2xl font-bold ${themeClasses.text.primary} mb-4`}>
                  Why Contact Us?
                </h3>
                <ul className={`space-y-3 ${themeClasses.text.secondary}`}>
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>Product recommendations and reviews</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-accent rounded-full"></span>
                    <span>Collaboration opportunities</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>Guest posting inquiries</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-accent rounded-full"></span>
                    <span>General questions and feedback</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
              <h2 className={`text-3xl font-bold ${themeClasses.text.primary} mb-6`}>
                Send us a Message
              </h2>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className={themeClasses.inputs.default}
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className={themeClasses.inputs.default}
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={themeClasses.inputs.default}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className={themeClasses.inputs.default}
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="guest-post">Guest Post</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className={themeClasses.inputs.default + " resize-none"}
                    placeholder="Tell us more about your inquiry..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className={themeClasses.buttons.orange + " w-full font-bold uppercase tracking-wider py-4"}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-brand-primary to-brand-accent rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-4 tracking-tight">Thank You for Visiting {brand.siteName}!</h3>
              <p className="text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
                We appreciate your interest in connecting with us. Your messages help us improve and serve you better.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}