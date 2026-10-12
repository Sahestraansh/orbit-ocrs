import Link from "next/link";
import { Clock3 } from "lucide-react";

export default function AccessPending() {
  return <main className="centered-state"><div className="state-card"><span className="state-icon"><Clock3 /></span><h1>Your access is being prepared</h1><p>Your account is authenticated, but a university role has not been assigned yet. Contact the registrar or system administrator.</p><Link className="secondary-button" href="/">Return home</Link></div></main>;
}
