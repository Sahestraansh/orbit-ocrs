import Link from "next/link";
import { ArrowLeft, Database, GraduationCap, LockKeyhole, UserPlus } from "lucide-react";
import { createLocalDemoAccount, signInLocally } from "@/app/auth/actions";
import { isLocalAuthMode } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const createMode = params.mode === "create";
  const error = typeof params.error === "string" ? params.error : null;
  const localEnabled = isLocalAuthMode();

  if (!localEnabled) {
    return (
      <main className="centered-state">
        <div className="state-card">
          <span className="state-icon"><Database /></span>
          <h1>Start the local database first</h1>
          <p>Local sign-in becomes available after the local Supabase URL and keys are added to <code>.env.local</code>.</p>
          <Link className="secondary-button" href="/"><ArrowLeft size={17} /> Return home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <Link className="brand" href="/"><span className="brand-mark"><GraduationCap size={20} /></span><span>Orbit</span></Link>
        <div className="login-heading">
          <span className="eyebrow">Local demonstration</span>
          <h1>{createMode ? "Create a test account" : "Sign in to Orbit"}</h1>
          <p>{createMode ? "Choose a role for this local demonstration account. Role selection is disabled outside localhost." : "Use an account stored in the local Supabase database on this Mac."}</p>
        </div>

        {error && <div className="inline-alert" role="alert"><span className="alert-icon">!</span><span>{error}</span></div>}

        <form className="login-form" action={createMode ? createLocalDemoAccount : signInLocally}>
          {createMode && <label><span>Full name</span><input name="fullName" autoComplete="name" placeholder="Sahestraansh Tyagi" required /></label>}
          <label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="student@ocrs.local" required /></label>
          <label><span>Password</span><input name="password" type="password" autoComplete={createMode ? "new-password" : "current-password"} placeholder="At least 8 characters" minLength={8} required /></label>
          {createMode && <label><span>Demonstration role</span><select name="role" defaultValue="student"><option value="student">Student</option><option value="faculty">Faculty</option><option value="registrar">Registrar</option><option value="system_admin">System administrator</option></select></label>}
          <button className="primary-button full" type="submit">{createMode ? <><UserPlus size={18} /> Create account</> : <><LockKeyhole size={18} /> Sign in</>}</button>
        </form>

        <div className="login-switch">
          <span>{createMode ? "Already created an account?" : "First time using the local database?"}</span>
          <Link href={createMode ? "/login" : "/login?mode=create"}>{createMode ? "Sign in" : "Create a test account"}</Link>
        </div>
        <div className="local-note"><Database size={17} /><span>All account and registration data stays in the local Docker database on this Mac.</span></div>
      </section>
    </main>
  );
}
