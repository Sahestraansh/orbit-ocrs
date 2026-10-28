import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Database, GraduationCap, LockKeyhole, ShieldCheck } from "lucide-react";
import { signInWithUniversitySSO } from "@/app/auth/actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { isLocalAuthMode } from "@/lib/supabase/admin";

const roleCards = [
  { role: "student", label: "Student", note: "Search sections, compare meeting times, and draft a schedule.", icon: GraduationCap },
  { role: "faculty", label: "Faculty", note: "Review assigned sections and current enrollment counts.", icon: BookOpen },
  { role: "registrar", label: "Registrar", note: "Review published offerings, capacity, and reports.", icon: CalendarDays },
  { role: "system_admin", label: "Administrator", note: "Review account roles and recorded audit events.", icon: ShieldCheck },
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
          <span className="service-chip"><span className="status-dot" /> {localMode ? "Local demo" : "University access"}</span>
          <a href="#demo">Role previews</a>
        </div>
      </nav>

      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Course registration workspace</div>
          <h1>Plan your term,<br /><em>one course at a time.</em></h1>
          <p className="hero-lede">Search current sections, compare meeting times and check seat availability before you register.</p>

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

        </div>

        <div className="workflow-card" aria-label="How course registration works">
          <span className="workflow-label">A clearer way to register</span>
          <ol>
            <li><span>01</span><div><strong>Find a section</strong><small>Search the current catalogue by course or instructor.</small></div></li>
            <li><span>02</span><div><strong>Check your week</strong><small>Compare meeting times and spot clashes in a draft plan.</small></div></li>
            <li><span>03</span><div><strong>Register when ready</strong><small>The server checks eligibility and availability before saving.</small></div></li>
          </ol>
          <p>Draft planning is separate from live registration, so exploring options won’t change your enrolment.</p>
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
        <span>Orbit OCRS · course-registration prototype</span>
        <span><LockKeyhole size={14} /> {localMode ? "Local demo data" : "University sign-in"}</span>
      </footer>
    </main>
  );
}
