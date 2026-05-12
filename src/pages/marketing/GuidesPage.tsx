import { Link, useParams, Navigate } from "react-router-dom";
import { Clock, ChevronRight, BookOpen, ShieldCheck } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { getGuide, listGuides, type GuideKey } from "@/i18n/guidesContent";
import { PageHero, PageSection } from "@/components/layout/Page";

const GUIDE_KEYS: Record<string, GuideKey> = {
  "how-to-buy-tickets-safely": "safe-tickets",
  "comment-acheter-billets-football-en-securite": "safe-tickets",
  "matchday-travel-checklist": "matchday-travel",
  "checklist-matchday-voyage": "matchday-travel",
  "league-coverage": "league-coverage",
  "guides-championnats": "league-coverage",
  "stadium-experience": "stadium-experience",
  "guides-experience-stade": "stadium-experience",
};

export const GuidesIndexPage = () => {
  const { locale, dir, tf } = useLanguage();
  const guides = listGuides(locale);

  return (
    <WebsiteLayout>
      <div dir={dir}>
        <PageHero
          eyebrow={
            <>
              <BookOpen className="w-3.5 h-3.5" />
              {tf("guides.eyebrow", "Editorial guides")}
            </>
          }
          title={tf("guides.index.title", "Football tickets, explained")}
          subtitle={tf(
            "guides.index.subtitle",
            "Independent, fan-written guides to buying real tickets, navigating any matchday, and getting the most out of every league and stadium we cover."
          )}
          center={false}
        />

        <PageSection tone="white">
          <div className="grid sm:grid-cols-2 gap-6">
            {guides.map((g) => (
              <Link
                key={g.slug}
                to={`/guides/${g.slug}`}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#2ECC71] hover:shadow-[0_12px_30px_-14px_rgba(46,204,113,0.35)] transition-all"
              >
                <div className="text-3xl mb-3" aria-hidden="true">{g.emoji}</div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#2C3E50] tracking-tight group-hover:text-[#2ECC71] transition-colors">
                  {g.title}
                </h2>
                <p className="mt-2 text-sm text-[#2C3E50]/70 leading-relaxed">{g.description}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-[#2C3E50]/60">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {g.readMinutes} min
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#2ECC71] ml-auto group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </PageSection>

        <PageSection tone="slate" size="tight" divider>
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-[#2ECC71] mt-1 shrink-0" />
            <p className="text-sm text-[#2C3E50]/80 leading-relaxed max-w-3xl">
              {tf(
                "guides.disclosure",
                "Every guide on Foot Ticket Finder is written and reviewed by our editorial team. We do not sell tickets and our recommendations are independent of any affiliate commission we may earn from outbound links."
              )}
            </p>
          </div>
        </PageSection>
      </div>
    </WebsiteLayout>
  );
};

export const GuideDetailPage = () => {
  const { slug } = useParams();
  const { locale, dir, tf } = useLanguage();
  const key = slug ? GUIDE_KEYS[slug] : undefined;
  if (!key) return <Navigate to="/guides" replace />;
  const guide = getGuide(locale, key);

  return (
    <WebsiteLayout>
      <div dir={dir}>
        <PageHero
          breadcrumbs={[
            { label: tf("website.nav.home", "Home"), to: "/" },
            { label: tf("guides.eyebrow", "Guides"), to: "/guides" },
            { label: guide.title },
          ]}
          eyebrow={
            <>
              <span className="text-base leading-none" aria-hidden="true">{guide.emoji}</span>
              {tf("guides.eyebrow", "Editorial guides")}
            </>
          }
          title={guide.title}
          subtitle={guide.intro}
          meta={
            <span className="inline-flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {guide.readMinutes} {tf("guides.min_read", "min read")}
            </span>
          }
          center={false}
        />

        <PageSection tone="white" width="narrow">
          <article>
            <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-p:leading-relaxed prose-a:text-[#2ECC71] prose-a:font-semibold prose-strong:text-[#2C3E50]">
              {guide.sections.map((s, i) => (
                <section key={i} className="mt-8 first:mt-0">
                  <h2>{s.heading}</h2>
                  <div dangerouslySetInnerHTML={{ __html: s.body }} />
                </section>
              ))}
            </div>

            {guide.takeaways.length > 0 && (
              <aside className="mt-12 rounded-2xl bg-[#0F1A2E] text-white p-6 sm:p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#2ECC71] mb-4">
                  {tf("guides.takeaways", "Key takeaways")}
                </h3>
                <ul className="space-y-2.5">
                  {guide.takeaways.map((tk, i) => (
                    <li key={i} className="flex gap-3 text-sm text-white/85 leading-relaxed">
                      <span className="text-[#2ECC71] font-bold shrink-0">→</span>
                      <span>{tk}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/guides"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C3E50] hover:text-[#2ECC71] transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                {tf("guides.back", "Back to all guides")}
              </Link>
            </div>
          </article>
        </PageSection>
      </div>
    </WebsiteLayout>
  );
};

export default GuidesIndexPage;
