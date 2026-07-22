import CompanionCard from "@/components/CompanionCard";
import CompanionsList from "@/components/CompanionsList";
import CTA from "@/components/CTA";
import { getAllCompanions, getRecentSessions, getBookmarkedCompanionIds } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";

const Page = async () => {
  const companions = await getAllCompanions({ limit: 3 });
  const recentSessionsCompanions = await getRecentSessions(10);
  const bookmarkedIds = await getBookmarkedCompanionIds();

  return (
    <main>
      <section className="hero-showcase">
        <div className="hero-orb hero-orb--one" />
        <div className="hero-orb hero-orb--two" />
        <div className="hero-grid-pattern" />
        <p className="hero-kicker reveal-up" style={{ animationDelay: "0.05s" }}>
          Converso AI Lessons
        </p>
        <h1 className="hero-title reveal-up" style={{ animationDelay: "0.15s" }}>
          Learn faster with voice-first companions designed for focus and flow.
        </h1>
        <p className="hero-subtitle reveal-up" style={{ animationDelay: "0.25s" }}>
          Jump into short, guided sessions for coding, science, math, language, and economics with
          immersive pacing and adaptive feedback.
        </p>
        <div className="hero-stats">
          <article className="hero-stat reveal-up" style={{ animationDelay: "0.35s" }}>
            <p className="hero-stat-value">{companions.length}</p>
            <p className="hero-stat-label">Featured companions</p>
          </article>
          <article className="hero-stat reveal-up" style={{ animationDelay: "0.45s" }}>
            <p className="hero-stat-value">{recentSessionsCompanions.length}</p>
            <p className="hero-stat-label">Recent session entries</p>
          </article>
          <article className="hero-stat reveal-up" style={{ animationDelay: "0.55s" }}>
            <p className="hero-stat-value">{bookmarkedIds.size}</p>
            <p className="hero-stat-label">Bookmarks saved</p>
          </article>
        </div>
      </section>

      <div className="section-header reveal-up" style={{ animationDelay: "0.15s" }}>
        <p className="section-header-kicker">Explore</p>
        <h2 className="section-header-title">Recent Companions</h2>
      </div>

      <section className="home-section">
        <div className="companions-grid">
          {companions.map((companion, index) => (
            <div
              key={companion.id}
              className="reveal-up"
              style={{ animationDelay: `${0.2 + index * 0.12}s` }}
            >
              <CompanionCard
                {...companion}
                color={getSubjectColor(companion.subject)}
                bookmarked={bookmarkedIds.has(companion.id)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="reveal-up w-2/3 max-lg:w-full" style={{ animationDelay: "0.2s" }}>
          <CompanionsList
            title="Recently completed sessions"
            companions={recentSessionsCompanions}
            classNames="w-full"
          />
        </div>
        <div className="reveal-up w-full max-w-[420px] max-lg:max-w-[560px] max-md:max-w-full" style={{ animationDelay: "0.32s" }}>
          <CTA />
        </div>
      </section>
    </main>
  );
};

export default Page;
