import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Database, GraduationCap, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { signInWithUniversitySSO } from "@/app/auth/actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { isLocalAuthMode } from "@/lib/supabase/admin";

const roleCards = [
  { role: "student", label: "Student", note: "Plan a term, add courses, and manage your waitlist.", icon: GraduationCap },
  { role: "faculty", label: "Faculty", note: "View assigned classes and focused roster details.", icon: BookOpen },
  { role: "registrar", label: "Registrar", note: "Manage offerings, registration windows, and reports.", icon: CalendarDays },
  { role: "system_admin", label: "Administrator", note: "Control access, monitor integrations, and audit changes.", icon: ShieldCheck },
] as const;

type HomeProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const configured = hasSupabaseConfig();
  const localMode = isLocalAuthMode();
  const setupMessage = params.setup === "required"
    ? "Supabase is not connected yet. You can explore every workspace below, then follow the setup guide to enable university sign-in."
    : params.setup === "sso-domain"
      ? "Add UNIVERSITY_SSO_DOMAIN to enable your university identity provider."
      : null;
  const authMessage = params.auth === "required"
    ? "Please sign in with your university account to continue."
    : params.auth === "failed"
      ? "We could not complete sign-in. Please try again or contact the university help desk."
      : null;

  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="Orbit home">
          <span className="brand-mark"><GraduationCap size={20} /></span>
          <span>Orbit</span>
        </Link>
        <div className="nav-meta">
          <span className="service-chip"><span className="status-dot" /> All systems normal</span>
          <a href="#help">Help</a>
        </div>
      </nav>

      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> Registration, without the rush</div>
          <h1>Your semester,<br /><em>beautifully organised.</em></h1>
          <p className="hero-lede">Find the right courses, build a conflict-free schedule, and register with confidence—all in one calm workspace.</p>

          {(setupMessage || authMessage) && (
            <div className="inline-alert" role="status">
              <span className="alert-icon">i</span>
              <span>{setupMessage ?? authMessage}</span>
            </div>
          )}

          {localMode ? (
            <Link className="primary-button hero-button" href="/login"><Database size={18} /> Sign in to the local system <ArrowRight size={18} /></Link>
          ) : (
            <form action={signInWithUniversitySSO}>
              <button className="primary-button hero-button" type="submit">
                <LockKeyhole size={18} /> Sign in with university SSO <ArrowRight size={18} />
              </button>
            </form>
          )}
          <p className="signin-note">{localMode ? "The database, API, and accounts are running only on this Mac." : "Secure access for students, faculty, and university teams."}</p>

          <div className="trust-row" aria-label="Platform benefits">
            <span><CheckCircle2 size={17} /> Live seat availability</span>
            <span><CheckCircle2 size={17} /> Conflict checks</span>
            <span><CheckCircle2 size={17} /> Accessible by design</span>
          </div>
        </div>

        <div className="schedule-preview" aria-label="Example weekly schedule">
          <div className="preview-topbar">
            <div><span className="preview-kicker">My week</span><strong>Fall semester</strong></div>
            <span className="credit-pill">13 credits</span>
          </div>
          <div className="mini-calendar">
            <div className="time-col"><span>9 AM</span><span>11 AM</span><span>1 PM</span><span>3 PM</span></div>
            {[
              { day: "MON", blocks: [["CSE301", "DBMS", "mint"], ["CSE315", "Web Engineering", "blue"]] },
              { day: "TUE", blocks: [["STA210", "Probability", "gold"], ["HUM102", "Ethics", "rose"]] },
              { day: "WED", blocks: [["CSE301", "DBMS", "mint"], ["CSE315", "Web Engineering", "blue"]] },
              { day: "THU", blocks: [["STA210", "Probability", "gold"], ["", "Open study", "ghost"]] },
            ].map((column) => (
              <div className="day-col" key={column.day}>
                <span className="day-name">{column.day}</span>
                {column.blocks.map(([code, title, color], index) => (
                  <div className={`class-block ${color}`} key={`${column.day}-${title}`} style={{ marginTop: index ? 28 : 8 }}>
                    <strong>{code || "Free"}</strong><small>{title}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="preview-footer"><span><span className="tiny-avatar">ST</span> Schedule ready to review</span><CheckCircle2 size={20} /></div>
        </div>
      </section>

      <section className="role-demo" id="demo">
        <div className="section-heading">
          <div><span className="eyebrow">Interactive preview</span><h2>Explore each role</h2></div>
          <p>{configured ? "Preview the experience without changing university data." : "The preview is ready now; connect Supabase when you are ready for live university data."}</p>
        </div>
        <div className="role-grid">
          {roleCards.map(({ role, label, note, icon: Icon }) => (
            <Link className="role-card" href={`/demo/${role}`} key={role}>
              <span className="role-icon"><Icon size={22} /></span>
              <span><strong>{label}</strong><small>{note}</small></span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <footer className="landing-footer" id="help">
        <span>© 2026 Orbit University Services</span>
        <span><LockKeyhole size={14} /> Protected by university SSO</span>
        <span>Accessibility · Privacy · Support</span>
      </footer>
    </main>
  );
}
