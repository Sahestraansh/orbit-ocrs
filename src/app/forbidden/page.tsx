import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function Forbidden() {
  return <main className="centered-state"><div className="state-card"><span className="state-icon danger"><ShieldX /></span><h1>This workspace is not assigned to you</h1><p>Your account is secure, but your current role does not allow access to this page.</p><Link className="secondary-button" href="/dashboard">Open my workspace</Link></div></main>;
}
