import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `Privacy Policy - ${brand.siteName}`,
    description: `Privacy Policy for ${brand.siteName}. Learn how we collect, handle, and safeguard your data with complete transparency.`,
    keywords: `privacy policy, data protection, cookies, user rights, ${brand.siteName}`,
    alternates: {
      canonical: `${brand.siteUrl}/privacy`,
    },
    openGraph: {
      title: `Privacy Policy - ${brand.siteName}`,
      description: `Privacy Policy for ${brand.siteName}. Learn how we collect, handle, and safeguard your data.`,
      url: `${brand.siteUrl}/privacy`,
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

export default async function PrivacyPage() {
  const brand = await getBrandConfig();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sections = [
    { id: 'overview', title: '1. Overview & Scope' },
    { id: 'collection', title: '2. Information We Collect' },
    { id: 'usage', title: '3. How We Use Information' },
    { id: 'cookies', title: '4. Cookies & Analytics' },
    { id: 'security', title: '5. Data Security & Storage' },
    { id: 'third-party', title: '6. Third-Party Services' },
    { id: 'children', title: "7. Children's Privacy" },
    { id: 'rights', title: '8. Your Rights & Choices' },
    { id: 'contact', title: '9. Contact & Inquiries' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <section className="border-b border-border/60 bg-gradient-to-b from-background via-background to-background-secondary/30 pt-16 pb-16 md:pt-20 md:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Legal & Compliance
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Privacy Policy
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            This policy outlines how <span className="font-semibold text-foreground">{brand.siteName}</span> collects, processes, and protects your information when you access our guides, articles, and services.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-card border border-border/80 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Last Updated: {currentDate}
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
                Table of Contents
              </div>
              <nav className="space-y-1.5">
                {sections.map((sec) => (
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
              <h3 className="text-sm font-bold text-foreground mb-2">Privacy Questions?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Need to exercise data deletion rights or request information? Reach our compliance desk directly.
              </p>
              <a
                href={`mailto:${brand.contactEmail}`}
                className="inline-flex items-center text-xs font-bold text-primary hover:underline"
              >
                {brand.contactEmail} →
              </a>
            </div>
          </aside>

          {/* Legal Content Cards */}
          <main className="lg:col-span-8 space-y-8">
            {/* 1. Overview */}
            <section id="overview" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                1. Overview &amp; Scope
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  At <span className="font-medium text-foreground">{brand.siteName}</span>{' '}(&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), protecting the personal privacy of our visitors is an integral part of our commitment to transparent journalism and honest consumer guidance.
                </p>
                <p>
                  This Privacy Policy applies to all interactions with our website, content, newsletters, and associated digital features accessible via <span className="text-foreground font-mono text-xs px-2 py-1 rounded bg-background border border-border">{brand.siteUrl}</span>.
                </p>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-foreground/90 font-medium">
                  Summary: We respect your boundaries. We do not sell your personal information or compile invasive user profiles.
                </div>
              </div>
            </section>

            {/* 2. Information We Collect */}
            <section id="collection" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                2. Information We Collect
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>We may collect information in the following limited ways:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>
                      <strong className="text-foreground font-semibold">Direct Information:</strong> Contact details (such as name and email address) submitted voluntarily when you message us, subscribe to updates, or comment.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>
                      <strong className="text-foreground font-semibold">Technical &amp; Log Data:</strong> Non-personally identifiable diagnostic data including browser type, operating system, referrer URL, and interaction timestamps.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                    <span>
                      <strong className="text-foreground font-semibold">Aggregated Analytics:</strong> High-level engagement metrics (such as page view counts and scroll depth) to help us optimize reading performance and site layout.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. How We Use Information */}
            <section id="usage" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                3. How We Use Information
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>Any data processed by our systems is strictly used to:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-4 rounded-2xl bg-background-secondary border border-border/60 text-xs sm:text-sm">
                    <div className="font-semibold text-foreground mb-1">Service Maintenance</div>
                    Ensure fast page rendering, server health, and security defense.
                  </div>
                  <div className="p-4 rounded-2xl bg-background-secondary border border-border/60 text-xs sm:text-sm">
                    <div className="font-semibold text-foreground mb-1">Direct Inquiries</div>
                    Respond promptly to questions, partnership offers, or feedback.
                  </div>
                  <div className="p-4 rounded-2xl bg-background-secondary border border-border/60 text-xs sm:text-sm">
                    <div className="font-semibold text-foreground mb-1">Content Optimization</div>
                    Identify popular guides to produce deeper research on top topics.
                  </div>
                  <div className="p-4 rounded-2xl bg-background-secondary border border-border/60 text-xs sm:text-sm">
                    <div className="font-semibold text-foreground mb-1">Legal Obligations</div>
                    Prevent fraudulent activities and maintain platform integrity.
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Cookies & Analytics */}
            <section id="cookies" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                4. Cookies &amp; Analytics
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  Cookies are small text identifiers placed on your device to remember preferences (such as theme choice) and collect anonymous session analytics.
                </p>
                <p>
                  We utilize standard web analytics tools (e.g., Google Analytics) to understand reader behavior in aggregate without identifying individual users.
                </p>
                <div className="p-4 rounded-2xl bg-background-secondary border border-border/80 text-xs">
                  <strong className="text-foreground">Controlling Cookies:</strong> You can modify your browser settings to reject cookies or notify you when cookies are sent. Please note that disabling cookies may affect minor preference persistence.
                </div>
              </div>
            </section>

            {/* 5. Data Security */}
            <section id="security" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                5. Data Security &amp; Storage
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  We implement industry-standard administrative, technical, and physical safeguards (including HTTPS TLS 1.3 encryption for all transit) to protect your data against unauthorized access, loss, or alteration.
                </p>
                <p>
                  While no Internet transmission method is 100% impenetrable, we continually audit our architecture to adhere to modern cybersecurity standards.
                </p>
              </div>
            </section>

            {/* 6. Third-Party Services */}
            <section id="third-party" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                6. Third-Party Services &amp; Links
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  Our content frequently references external research, partner retailers, or technical documentation. Clicking these links will direct you to third-party domains.
                </p>
                <p>
                  We do not control and are not responsible for the privacy practices or terms of external websites. We encourage you to review their individual privacy policies.
                </p>
              </div>
            </section>

            {/* 7. Children's Privacy */}
            <section id="children" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                7. Children&apos;s Privacy
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  Our publication is intended for a general audience and is not directed at children under the age of 13. We do not knowingly collect personal data from minors. If you believe a minor has shared data with us, please notify us immediately so we can expunge it.
                </p>
              </div>
            </section>

            {/* 8. Your Rights */}
            <section id="rights" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                8. Your Rights &amp; Choices
              </h2>
              <div className="text-muted-foreground text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  Depending on your jurisdiction (such as GDPR in the EU or CCPA in California), you may have legal rights regarding your personal information, including:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span>Right to access and review data we hold about you.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span>Right to request correction or deletion of your information.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span>Right to opt out of marketing communications or non-essential cookies.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 9. Contact */}
            <section id="contact" className="bg-card rounded-3xl p-8 sm:p-10 border border-border/80 shadow-sm scroll-mt-28">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
                9. Contact &amp; Inquiries
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                If you have questions, comments, or requests regarding this Privacy Policy or our data handling practices, please write to us:
              </p>
              <div className="p-6 rounded-2xl bg-background-secondary border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                    Compliance &amp; Privacy Officer
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
                  Send Inquiry
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}