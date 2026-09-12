import { Metadata } from 'next';
import Link from 'next/link';
import { getBrandConfig } from '@config/server-config';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `About Us - ${brand.siteName}`,
    description: `Learn about ${brand.siteName}: our editorial mission, testing standards, and commitment to providing in-depth guides, trend analysis, and honest insights.`,
    keywords: `about ${brand.siteName}, editorial standards, product reviews, tech guides, lifestyle insights`,
    alternates: {
      canonical: `${brand.siteUrl}/about`,
    },
    openGraph: {
      title: `About Us - ${brand.siteName}`,
      description: `Learn about ${brand.siteName}: our editorial mission, testing standards, and commitment to providing in-depth insights.`,
      url: `${brand.siteUrl}/about`,
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

export default async function AboutPage() {
  const brand = await getBrandConfig();

  const trustMetrics = [
    {
      title: '100% Independent',
      desc: 'Free from editorial bias & commercial influence',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Deep-Dive Research',
      desc: 'Comprehensive specs, benchmarks & analysis',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      title: 'Actionable Advice',
      desc: 'Clear recommendations for confident decisions',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Reader-First Integrity',
      desc: 'Zero sponsored fluff, complete transparency',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
  ];

  const pillars = [
    {
      number: '01',
      title: 'Rigorous Testing & Analysis',
      description:
        'We break down products, features, and trends beyond surface marketing claims. Every guide is backed by hands-on scrutiny, technical specs, and practical context.',
    },
    {
      number: '02',
      title: 'Uncompromised Transparency',
      description:
        'We highlight both the strengths and the flaws of everything we cover. Our loyalty is strictly to our readers, ensuring you get honest, unfiltered clarity.',
    },
    {
      number: '03',
      title: 'Tailored for Modern Lifestyles',
      description:
        'From high-performance technology to wellness, travel, and smart consumer habits, our content is designed to elevate everyday living and simplify complex choices.',
    },
    {
      number: '04',
      title: 'Continually Updated Insights',
      description:
        'Trends and specifications evolve rapidly. Our editorial team continuously reviews, fact-checks, and refreshes articles so you always receive current information.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-background to-background-secondary/30 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            About {brand.siteName}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight">
            Empowering Smart Choices Through In-Depth, Honest Insights.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-normal leading-relaxed mb-12">
            {brand.siteTagline ? (brand.siteTagline.endsWith('.') ? brand.siteTagline : `${brand.siteTagline}.`) : 'Your trusted destination for clear perspectives, expert guides, and curated reviews.'}{' '}At <span className="text-foreground font-semibold">{brand.siteName}</span>, we cut through the noise so you can make informed decisions with total confidence.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {trustMetrics.map((metric, i) => (
              <div
                key={i}
                className="bg-card/90 backdrop-blur-sm rounded-2xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  {metric.icon}
                </div>
                <h2 className="text-base font-bold text-foreground mb-1">{metric.title}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{metric.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Main Content Container ──────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 sm:space-y-24">
        {/* Our Story & Mission Section */}
        <section className="bg-card rounded-3xl p-8 sm:p-12 border border-border/80 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Our Mission
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
              Why We Started {brand.siteName}
            </h2>
            <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
              <p>
                In today&apos;s saturated digital marketplace, finding reliable, hype-free product breakdowns and lifestyle recommendations can feel overwhelming. Too often, search results are cluttered with sponsored bias and generic summaries that offer little real-world value.
              </p>
              <p>
                <span className="text-foreground font-medium">{brand.siteName}</span> was established to bring clarity back to readers. Whether exploring the latest hardware benchmarks, reviewing health and lifestyle staples, or unearthing actionable tips, we focus on what genuinely matters: practical utility, authentic quality, and clear facts.
              </p>
            </div>
          </div>
        </section>

        {/* Editorial Pillars Grid */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">
              How We Work
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Our Core Editorial Principles
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Every story, guide, and comparison on our portal adheres to four uncompromising pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {pillars.map((pillar) => (
              <div
                key={pillar.number}
                className="bg-card rounded-3xl p-8 border border-border/80 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200"
              >
                <div className="text-xs font-mono font-black text-primary/80 uppercase tracking-widest mb-3">
                  Pillar {pillar.number}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Editorial Integrity & Fact-Checking */}
        <section className="bg-background-secondary/50 rounded-3xl p-8 sm:p-12 border border-border/80">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1">
              <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">
                Standards
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
                Editorial Integrity
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We believe trust is earned through consistent accountability, verified sources, and reader-first ethics.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-sm">
                <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    ✓
                  </div>
                  Fact-Checked Claims
                </div>
                <p className="text-xs text-muted-foreground pl-7">
                  Specifications, prices, and claims are cross-verified with official documentation.
                </p>
              </div>

              <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-sm">
                <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    ✓
                  </div>
                  Editorial Autonomy
                </div>
                <p className="text-xs text-muted-foreground pl-7">
                  Writers and reviewers maintain complete independence without commercial influence.
                </p>
              </div>

              <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-sm">
                <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    ✓
                  </div>
                  Clear Disclosures
                </div>
                <p className="text-xs text-muted-foreground pl-7">
                  Any affiliate relationships or review units are transparently disclosed to our readers.
                </p>
              </div>

              <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-sm">
                <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    ✓
                  </div>
                  Active Revisions
                </div>
                <p className="text-xs text-muted-foreground pl-7">
                  Articles are promptly updated whenever new models or verified corrections emerge.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Call to Action ──────────────────────────────────────── */}
        <section className="bg-card rounded-3xl p-8 sm:p-14 border border-border shadow-md text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
              Have Questions or Want to Collaborate?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
              Whether you have feedback on our guides, inquiry about partnerships, or product tips, our editorial team is always eager to connect.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary/90 transition-all duration-200"
              >
                Contact Editorial Team
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-background-secondary border border-border/80 text-foreground font-semibold text-sm hover:bg-card transition-all duration-200"
              >
                Explore Latest Articles
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}