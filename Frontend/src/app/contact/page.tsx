import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';
import CopyEmailButton from '@/components/contact/CopyEmailButton';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `Contact Us - ${brand.siteName}`,
    description: `Get in touch with ${brand.siteName}. Reach out directly for editorial suggestions, brand partnerships, or general inquiries.`,
    keywords: `contact, ${brand.siteName}, editorial contact, support, email, partnerships`,
    alternates: {
      canonical: `${brand.siteUrl}/contact`,
    },
    openGraph: {
      title: `Contact Us - ${brand.siteName}`,
      description: `Get in touch with the ${brand.siteName} team directly.`,
      url: `${brand.siteUrl}/contact`,
      siteName: brand.siteName,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function ContactPage() {
  const brand = await getBrandConfig();

  const channels = [
    {
      title: 'Editorial Inquiries & Tips',
      subject: 'Editorial Inquiry / Story Tip',
      desc: 'Got a news lead, product leak, benchmark data, or story suggestion? Share your insights with our editorial team.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      title: 'Brand & Commercial Partnerships',
      subject: 'Partnership & Collaboration Inquiry',
      desc: 'Interested in sponsored guides, product reviews, syndication, or custom advertising opportunities?',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Corrections & Editorial Feedback',
      subject: 'Article Correction / Feedback',
      desc: 'Spotted a typo, broken spec, or outdated benchmark in one of our guides? We value reader diligence and prompt updates.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Press & Media Outreach',
      subject: 'Press & Media Inquiry',
      desc: 'Media citations, analyst commentary, press releases, or interview requests for our senior writers.',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
  ];

  const faqs = [
    {
      q: 'How quickly do you reply to emails?',
      a: 'We monitor incoming messages daily. Our team typically responds within 24 to 48 business hours.',
    },
    {
      q: 'Do you accept product review units?',
      a: 'Yes, we accept hardware and lifestyle products for independent editorial evaluation. Please note that sending a unit does not guarantee a positive verdict; our loyalty remains 100% with our readers.',
    },
    {
      q: 'Can I pitch guest articles or guides?',
      a: 'We welcome pitches from industry specialists and experienced reviewers. Please include your background, writing samples, and a brief outline of your proposed topic in your email.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <section className="border-b border-border/60 bg-gradient-to-b from-background via-background to-background-secondary/30 pt-16 pb-16 md:pt-20 md:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Direct Contact Hub
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Contact Us
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have questions, story tips, or partnership proposals? Connect directly with the <span className="font-semibold text-foreground">{brand.siteName}</span> editorial and support desk.
          </p>
        </div>
      </section>

      {/* ─── Main Content Container ──────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 sm:space-y-20">
        {/* Featured Direct Email Card */}
        <section className="bg-card rounded-3xl p-8 sm:p-12 border border-border/80 shadow-md text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Official Editorial &amp; Support Inbox
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed">
            Send us an email directly from your mail client. Every message is reviewed by our editorial team.
          </p>

          {/* Email Address Display */}
          <div className="inline-block p-4 sm:p-5 rounded-2xl bg-background-secondary/80 border border-border/80 mb-8 max-w-full">
            <a
              href={`mailto:${brand.contactEmail}`}
              className="text-xl sm:text-2xl md:text-3xl font-extrabold text-primary hover:underline break-all tracking-tight"
            >
              {brand.contactEmail}
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`mailto:${brand.contactEmail}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Email Us Directly</span>
            </a>
            <CopyEmailButton email={brand.contactEmail} />
          </div>

          {/* Trust badges footer */}
          <div className="mt-10 pt-8 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground block font-semibold mb-0.5">Response Time</strong>
              Within 24 to 48 business hours
            </div>
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground block font-semibold mb-0.5">Coverage</strong>
              Online Publication, Worldwide
            </div>
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground block font-semibold mb-0.5">Direct Review</strong>
              No automated chatbots
            </div>
          </div>
        </section>

        {/* Specialized Inquiries Grid */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Departments
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
              How We Can Help
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose the category that best matches your inquiry to ensure it reaches the right editor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {channels.map((ch, i) => (
              <div
                key={i}
                className="bg-card rounded-3xl p-7 border border-border/80 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    {ch.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{ch.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                    {ch.desc}
                  </p>
                </div>

                <a
                  href={`mailto:${brand.contactEmail}?subject=${encodeURIComponent(ch.subject)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
                >
                  <span>Write to this desk</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="bg-background-secondary/50 rounded-3xl p-8 sm:p-12 border border-border/80">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Common Questions
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border/60 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-2">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}