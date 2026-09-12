import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `Terms & Conditions - ${brand.siteName}`,
    description: `Terms and Conditions for ${brand.siteName}. Understand our usage policies, content copyrights, and legal disclaimers.`,
    keywords: `terms of service, terms and conditions, legal agreement, ${brand.siteName}`,
    alternates: {
      canonical: `${brand.siteUrl}/terms`,
    },
    openGraph: {
      title: `Terms & Conditions - ${brand.siteName}`,
      description: `Terms and Conditions for ${brand.siteName}.`,
      url: `${brand.siteUrl}/terms`,
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

export default async function TermsPage() {
  const brand = await getBrandConfig();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const termsNav = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'intellectual-property', title: '2. Intellectual Property' },
    { id: 'user-conduct', title: '3. User Conduct & Use' },
    { id: 'disclaimers', title: '4. Accuracy & Disclaimers' },
    { id: 'external-links', title: '5. External Links & Affiliates' },
    { id: 'liability', title: '6. Limitation of Liability' },
    { id: 'modifications', title: '7. Revisions to Terms' },
    { id: 'governing-law', title: '8. Governing Law' },
    { id: 'contact', title: '9. Legal Contact' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <section className="border-b border-border/60 bg-gradient-to-b from-background via-background to-background-secondary/30 pt-16 pb-16 md:pt-20 md:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Terms of Service
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Terms &amp; Conditions
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            Please read these terms carefully before exploring <span className="font-semibold text-foreground">{brand.siteName}</span>. By accessing our site, you agree to comply with and be bound by the following guidelines.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-card border border-border/80 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Effective Date: {currentDate}
          </div>
        </div>
      </section>

      {/* ─── Content Body ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sticky Table of Contents (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 space-y-6">
            <div className="bg-card rounded-3xl p-6 border border-border/80 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                Sections
              </div>
              <nav className="space-y-1.5">
                {termsNav.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background-secondary transition-all duration-150"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="bg-background-secondary/60 rounded-3xl p-6 border border-border/80">
              <h3 className="text-sm font-bold text-foreground mb-2">Need Legal Clarification?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Have questions regarding content permissions, syndication, or licensing?
              </p>
              <a
                href={`mailto:${brand.contactEmail}`}
                className="inline-flex items-center text-xs font-bold text-primary hover:underline"
              >
                {brand.contactEmail} →
              </a>
            </div>
          </aside>

          {/* Legal Agreement Cards */}
          <main className="lg:col-span-8 space-y-8">
            {/* 1. Acceptance */}
            <section id="acceptance" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                1. Acceptance of Terms
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  By accessing, browsing, or utilizing <span className="font-semibold text-foreground">{brand.siteName}</span>{' '}(available at {brand.siteUrl}), you enter into a legally binding agreement to adhere to these Terms &amp; Conditions and our Privacy Policy.
                </p>
                <p>
                  If you disagree with any portion of these terms, you must immediately discontinue use of the website and services.
                </p>
              </div>
            </section>

            {/* 2. Intellectual Property */}
            <section id="intellectual-property" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                2. Intellectual Property Rights
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  All content published on <span className="font-semibold text-foreground">{brand.siteName}</span>, including but not limited to written articles, reviews, graphics, logos, layouts, and code, is the intellectual property of {brand.siteName} and is protected under international copyright and trademark laws.
                </p>
                <div className="p-4 rounded-2xl bg-background-secondary border border-border/80 text-xs leading-relaxed">
                  <strong className="text-foreground">Permitted Use:</strong> You may quote brief excerpts or share links for non-commercial educational or editorial purposes, provided clear attribution and a direct backlink to the original source on {brand.siteName} is maintained. Commercial reproduction or automated scraping without written authorization is strictly prohibited.
                </div>
              </div>
            </section>

            {/* 3. User Conduct */}
            <section id="user-conduct" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                3. User Obligations &amp; Conduct
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>While interacting with our platform, you agree NOT to:</p>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Engage in automated scraping, data extraction, or denial-of-service attempts.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Submit malicious payloads, spam comments, or defamatory statements.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>Impersonate {brand.siteName} staff, authors, or other community members.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 4. Accuracy & Disclaimers */}
            <section id="disclaimers" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                4. Disclaimers &amp; Information Accuracy
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  The articles, guides, and specifications published on <span className="font-semibold text-foreground">{brand.siteName}</span> are provided for general informational and entertainment purposes only.
                </p>
                <p>
                  While our editorial team endeavors to ensure absolute precision, technical specifications, prices, and availability are subject to manufacturer changes. We make no express or implied warranties regarding the completeness or current accuracy of any third-party product data.
                </p>
              </div>
            </section>

            {/* 5. External Links */}
            <section id="external-links" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                5. External Links &amp; Affiliate Disclosure
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  Our publication may contain links to external retailer or manufacturer websites. We do not endorse or assume responsibility for the products, terms, or security of external websites.
                </p>
                <p>
                  Some external links may be affiliate links, meaning {brand.siteName} may earn a small referral commission at zero additional cost to you. This compensation never influences our editorial verdicts or review ratings.
                </p>
              </div>
            </section>

            {/* 6. Limitation of Liability */}
            <section id="liability" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                6. Limitation of Liability
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  To the maximum extent permitted by applicable law, <span className="font-semibold text-foreground">{brand.siteName}</span> and its contributors shall not be liable for any direct, indirect, consequential, or incidental damages resulting from your use of or reliance on any information provided on this platform.
                </p>
              </div>
            </section>

            {/* 7. Revisions */}
            <section id="modifications" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                7. Revisions to Terms
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  We reserve the right to revise or update these Terms &amp; Conditions periodically to reflect technical, operational, or legal developments. Continued use of our portal following posted updates constitutes acceptance of the modified terms.
                </p>
              </div>
            </section>

            {/* 8. Governing Law */}
            <section id="governing-law" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                8. Governing Law
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  These Terms shall be governed by and construed in accordance with applicable legal statutes, without giving effect to any principles of conflicts of law.
                </p>
              </div>
            </section>

            {/* 9. Contact */}
            <section id="contact" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                9. Legal Inquiries &amp; Notice
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                If you have questions regarding these Terms, licensing agreements, or syndication, please contact our legal desk:
              </p>
              <div className="p-6 rounded-2xl bg-background-secondary border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                    Editorial &amp; Legal Desk
                  </div>
                  <a
                    href={`mailto:${brand.contactEmail}`}
                    className="text-base font-bold text-primary hover:underline"
                  >
                    {brand.contactEmail}
                  </a>
                </div>
                <a
                  href={`mailto:${brand.contactEmail}`}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all duration-150"
                >
                  Contact Legal
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}