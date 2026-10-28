"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowLeft, BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronDown,
  CircleDollarSign, Clock3, GraduationCap, LayoutDashboard, Menu, MoreHorizontal,
  Search, Settings, ShieldCheck, SlidersHorizontal, UserCog, Users, X,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { roleLabels, type AppRole, type Course } from "@/lib/types";
import { WhatIfPlanner } from "@/components/what-if-planner";

type PaymentRecord = { id: string; amountMinor: number; currency: string; status: string; description: string; createdAt: string };
type StudentNotice = { id: string; title: string; body: string };
type AdminAccount = { id: string; name: string; email: string; role: string | null; active: boolean };
type AdminAuditRecord = { id: string; occurredAt: string; actor: string; action: string; resource: string; outcome: string };

type RoleDashboardProps = {
  role: AppRole;
  name: string;
  isDemo?: boolean;
  initialCourses?: Course[];
  initialRegisteredIds?: string[];
  initialWaitlistedIds?: string[];
  creditLimit?: number;
  payments?: PaymentRecord[];
  notifications?: StudentNotice[];
  adminAccounts?: AdminAccount[];
  auditRecords?: AdminAuditRecord[];
  databaseConnected?: boolean;
  adminDataMessage?: string;
};

const navByRole = {
  student: [
    ["Overview", LayoutDashboard], ["Course catalog", Search], ["My schedule", CalendarDays],
    ["Waitlist", Clock3], ["Payments", CircleDollarSign],
  ],
  faculty: [["Overview", LayoutDashboard], ["My classes", BookOpen], ["Rosters", Users], ["Schedule", CalendarDays]],
  registrar: [["Overview", LayoutDashboard], ["Course offerings", BookOpen], ["Registration", SlidersHorizontal], ["Reports", BarChart3]],
  system_admin: [["Overview", LayoutDashboard], ["Users & roles", UserCog], ["System health", Activity], ["Audit trail", ShieldCheck]],
} as const;

export function RoleDashboard({ role, name, isDemo = false, initialCourses = [], initialRegisteredIds, initialWaitlistedIds, creditLimit, payments, notifications = [], adminAccounts = [], auditRecords = [], databaseConnected = false, adminDataMessage }: RoleDashboardProps) {
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function navigate(label: string) {
    setActive(label);
    setMobileOpen(false);
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand"><span className="brand-mark"><GraduationCap size={20} /></span><span>Orbit</span></div>
        <div className="role-context"><small>Workspace</small><strong>{roleLabels[role]}</strong><ChevronDown size={15} /></div>
        <nav className="side-nav" aria-label={`${roleLabels[role]} workspace`}>
          {navByRole[role].map(([label, Icon]) => (
            <button key={label} data-nav={label === "Course catalog" ? "catalog" : undefined} className={active === label ? "active" : ""} onClick={() => navigate(label)}>
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => navigate("Settings")} className={active === "Settings" ? "active" : ""}><Settings size={19} /> Settings</button>
          {isDemo ? <Link href="/"><ArrowLeft size={18} /> Exit preview</Link> : <form action={signOut}><button type="submit"><ArrowLeft size={18} /> Sign out</button></form>}
          <div className="profile-mini"><span className="avatar">{initials}</span><span><strong>{name}</strong><small>{isDemo ? "Preview account" : "University account"}</small></span></div>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <main className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="breadcrumb"><span>{roleLabels[role]}</span><span>/</span><strong>{active}</strong></div>
          <div className="top-actions"><span className="avatar small" aria-label={name}>{initials}</span></div>
        </header>
        {isDemo && <div className="demo-banner"><span>Preview account. Changes here are not saved to university records.</span><Link href="/">Sign in for live actions</Link></div>}
        <div className="workspace-content">
          {active === "Settings" ? <SettingsView role={role} /> :
            role === "student" ? <StudentView active={active} notify={notify} isDemo={isDemo} availableCourses={initialCourses} initialRegisteredIds={initialRegisteredIds} initialWaitlistedIds={initialWaitlistedIds} creditLimit={creditLimit} payments={payments ?? []} notifications={notifications} name={name} /> :
            role === "faculty" ? <FacultyView active={active} name={name} courses={isDemo ? [] : initialCourses} isDemo={isDemo} /> :
            role === "registrar" ? <RegistrarView active={active} courses={initialCourses} /> :
            <AdminView active={active} accounts={adminAccounts} auditRecords={auditRecords} databaseConnected={databaseConnected} dataMessage={adminDataMessage ?? (isDemo ? "Account and audit data are not loaded in preview mode." : undefined)} />}
        </div>
      </main>

      {toast && <div className="toast" role="status"><CheckCircle2 size={19} /><span>{toast}</span><button aria-label="Dismiss" onClick={() => setToast(null)}><X size={16} /></button></div>}
    </div>
  );
}

function PageTitle({ eyebrow, title, note, actions }: { eyebrow: string; title: string; note: string; actions?: React.ReactNode }) {
  return <div className="page-title"><div><span className="page-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{note}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

function MetricCard({ label, value, note, tone = "default" }: { label: string; value: string; note: string; tone?: string }) {
  return <article className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function StudentView({ active, notify, isDemo, availableCourses, initialRegisteredIds, initialWaitlistedIds, creditLimit, payments, notifications, name }: { active: string; notify: (message: string) => void; isDemo: boolean; availableCourses: Course[]; initialRegisteredIds?: string[]; initialWaitlistedIds?: string[]; creditLimit?: number; payments: PaymentRecord[]; notifications: StudentNotice[]; name: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);
  const [registered, setRegistered] = useState(() => new Set(initialRegisteredIds ?? []));
  const [waitlisted, setWaitlisted] = useState(() => new Set(initialWaitlistedIds ?? []));
  const waitlistedCourses = useMemo(() => availableCourses.filter((course) => waitlisted.has(course.id)), [availableCourses, waitlisted]);
  const [draftCourseIds, setDraftCourseIds] = useState<Set<string>>(new Set());
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [draftStorageReady, setDraftStorageReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const draftStorageKey = `orbit:course-plan:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${availableCourses[0]?.termCode ?? "current-term"}`;
  const filtered = useMemo(() => availableCourses.filter((course) => `${course.code} ${course.title} ${course.instructor}`.toLowerCase().includes(query.toLowerCase())), [availableCourses, query]);
  const registeredCourses = useMemo(() => availableCourses.filter((course) => registered.has(course.id)), [availableCourses, registered]);
  const registeredCredits = registeredCourses.reduce((sum, course) => sum + course.credits, 0);
  const termName = availableCourses[0]?.termName ?? "Current term";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(draftStorageKey) ?? "[]") as unknown;
        if (Array.isArray(saved)) {
          const availableIds = new Set(availableCourses.map((course) => course.id));
          setDraftCourseIds(new Set(saved.filter((id): id is string => typeof id === "string" && availableIds.has(id))));
        }
      } catch {
        setDraftCourseIds(new Set());
      }
      setDraftStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [availableCourses, draftStorageKey]);

  useEffect(() => {
    if (!draftStorageReady) return;
    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify([...draftCourseIds]));
    } catch {
      // Keep the planner usable when browser storage is disabled.
    }
  }, [draftCourseIds, draftStorageKey, draftStorageReady]);

  const addToDraftPlan = useCallback((course: Course) => {
    if (registeredCourses.some((registeredCourse) => registeredCourse.code === course.code)) {
      notify(`${course.code} is already in your registered schedule.`);
      return;
    }
    if (availableCourses.some((item) => draftCourseIds.has(item.id) && item.code === course.code)) {
      notify(`A section of ${course.code} is already in your draft plan.`);
      return;
    }
    setDraftCourseIds((current) => new Set(current).add(course.id));
    setPlannerOpen(true);
    setSelected(null);
    notify(`${course.code} added to your draft plan. You are not registered.`);
  }, [availableCourses, draftCourseIds, notify, registeredCourses]);

  const changeRegistration = useCallback(async (course: Course) => {
    const alreadyRegistered = registered.has(course.id);
    const alreadyWaitlisted = waitlisted.has(course.id);
    const removing = alreadyRegistered || alreadyWaitlisted;
    setBusy(course.id);
    try {
      let resultStatus: string | undefined;
      if (!isDemo) {
        const response = await fetch("/api/registrations", {
          method: removing ? "DELETE" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sectionId: course.id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Request failed");
        resultStatus = result.registration?.status;
      }
      const nextStatus = removing ? "dropped" : resultStatus ?? (course.seatsAvailable > 0 ? "registered" : course.status);
      setRegistered((current) => {
        const next = new Set(current);
        if (nextStatus === "registered") next.add(course.id);
        else next.delete(course.id);
        return next;
      });
      setWaitlisted((current) => {
        const next = new Set(current);
        if (nextStatus === "waitlisted") next.add(course.id);
        else next.delete(course.id);
        return next;
      });
      if (!removing) setDraftCourseIds((current) => {
        const next = new Set(current);
        next.delete(course.id);
        return next;
      });
      notify(nextStatus === "dropped" ? `${course.code} removed from your schedule.` : nextStatus === "waitlisted" ? `You joined the waitlist for ${course.code}.` : `${course.code} added to your schedule.`);
      setSelected(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Registration could not be updated.");
    } finally {
      setBusy(null);
    }
  }, [isDemo, notify, registered, waitlisted]);

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: object; execute: (input: unknown) => unknown };
    const context = (document as Document & { modelContext?: { registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);

    void register({
      name: "search_course_catalog",
      title: "Search course catalog",
      description: `Find ${termName} course sections by course code, title, or instructor without changing registration.`,
      inputSchema: { type: "object", properties: { query: { type: "string", minLength: 1 } }, required: ["query"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const value = typeof input === "object" && input !== null && "query" in input && typeof input.query === "string" ? input.query.trim() : "";
        if (!value) throw new Error("query is required");
        const matches = availableCourses.filter((course) => `${course.code} ${course.title} ${course.instructor}`.toLowerCase().includes(value.toLowerCase()));
        setQuery(value);
        return { count: matches.length, courses: matches.slice(0, 10).map(({ id, code, title, seatsAvailable }) => ({ id, code, title, seatsAvailable })) };
      },
    });

    void register({
      name: "update_course_registration",
      title: "Update course registration",
      description: "Register for, waitlist, or drop one course section and update the visible student schedule.",
      inputSchema: { type: "object", properties: { sectionId: { type: "string" } }, required: ["sectionId"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const sectionId = typeof input === "object" && input !== null && "sectionId" in input && typeof input.sectionId === "string" ? input.sectionId : "";
        const course = availableCourses.find((item) => item.id === sectionId);
        if (!course) throw new Error("Unknown sectionId");
        const wasActive = registered.has(course.id) || waitlisted.has(course.id);
        await changeRegistration(course);
        return { sectionId: course.id, courseCode: course.code, status: wasActive ? "dropped" : course.seatsAvailable ? "registered" : course.status === "waitlist" ? "waitlisted" : "closed" };
      },
    });

    return () => lifecycle.abort();
  }, [availableCourses, changeRegistration, registered, termName, waitlisted]);

  if (active === "Course catalog") {
    return <>
      <PageTitle eyebrow={termName} title="Course catalog" note="Search published sections and compare meeting times before registering." />
      <div className="search-field"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by course, code, or instructor" aria-label="Search courses" /></div>
      <WhatIfPlanner open={plannerOpen} onToggle={() => setPlannerOpen((current) => !current)} courses={availableCourses} registeredCourses={registeredCourses} draftIds={draftCourseIds} onRemove={(id) => setDraftCourseIds((current) => { const next = new Set(current); next.delete(id); return next; })} onClear={() => setDraftCourseIds(new Set())} storageReady={draftStorageReady} creditLimit={creditLimit} />
      <div className="catalog-toolbar"><span>{filtered.length} {filtered.length === 1 ? "offering" : "offerings"}</span></div>
      <div className="course-list">{filtered.map((course) => <CourseRow key={course.id} course={course} registered={registered.has(course.id)} waitlisted={waitlisted.has(course.id)} onSelect={() => setSelected(course)} />)}</div>
      {filtered.length === 0 && <div className="empty-state"><Search /><strong>No catalogue records found</strong><span>Import data with npm run db:import-csv, then refresh this page.</span></div>}
      {selected && <CourseDrawer course={selected} registered={registered.has(selected.id)} waitlisted={waitlisted.has(selected.id)} planned={draftCourseIds.has(selected.id)} planBlocked={registeredCourses.some((course) => course.code === selected.code) || waitlistedCourses.some((course) => course.code === selected.code)} busy={busy === selected.id} onClose={() => setSelected(null)} onAction={() => changeRegistration(selected)} onPlan={() => addToDraftPlan(selected)} />}
    </>;
  }

  if (active === "My schedule") return <ScheduleView registered={registeredCourses} termName={termName} emptyMessage={isDemo ? "Your registration data is not loaded in preview mode." : undefined} />;
  if (active === "Waitlist") return <SimpleTableView title="My waitlist" note="Sections where your registration is currently marked as waitlisted." columns={["Course", "Section", "Term", "Status"]} rows={waitlistedCourses.map((course) => [`${course.code} · ${course.title}`, course.sectionCode ?? "—", course.termName ?? termName, "Waitlisted"])} emptyMessage={isDemo ? "Waitlist data is not loaded in preview mode." : "You have no waitlisted sections for this term."} />;
  if (active === "Payments") return <PaymentsView payments={payments} isDemo={isDemo} />;

  return <>
    <PageTitle eyebrow={termName} title={isDemo ? "Student preview" : `Welcome, ${name.split(" ")[0]}`} note={isDemo ? "Browse the catalogue and try the draft planner. Account registrations are not loaded in preview mode." : "Review your current registrations or search the catalogue for another section."} actions={<button className="primary-button" onClick={() => document.querySelector<HTMLButtonElement>('[data-nav="catalog"]')?.click()}><Search size={17} /> Find courses</button>} />
    <div className="metric-grid student-metrics"><MetricCard label="Registered sections" value={isDemo ? "—" : String(registeredCourses.length)} note={isDemo ? "Sign in to load your account" : "Current term"} /><MetricCard label="Registered credits" value={isDemo ? "—" : String(registeredCredits)} note={isDemo || creditLimit === undefined ? "Programme limit is not available" : `Programme limit: ${creditLimit} credits`} tone="mint" /><MetricCard label="Waitlisted sections" value={isDemo ? "—" : String(waitlistedCourses.length)} note={isDemo ? "Sign in to load your account" : "Based on your registrations"} tone="gold" /></div>
    <div className="content-grid two-one">
      <section className="panel"><div className="panel-heading"><div><span className="page-eyebrow">Registered</span><h2>Your classes</h2></div></div><div className="timeline">{registeredCourses.map((course) => <div className="timeline-row" key={course.id}><span className="timeline-time">{course.sectionCode ?? "Section"}</span><span className="timeline-line mint" /><div><strong>{course.code} · {course.title}</strong><small>{course.schedule} · {course.room}</small></div><span className="duration">{course.credits} credits</span></div>)}{registeredCourses.length === 0 && <div className="empty-state"><BookOpen /><strong>{isDemo ? "Account not connected" : "No registered courses"}</strong><span>{isDemo ? "Sign in to view your own registered sections." : "Your confirmed sections will appear here."}</span></div>}</div></section>
      <section className="panel"><div className="panel-heading"><div><span className="page-eyebrow">Planning</span><h2>Before you register</h2></div></div><div className="task-list"><div><span className="task-number">1</span><span><strong>Compare section times</strong><small>The draft planner checks the meeting data in the catalogue.</small></span></div><div><span className="task-number">2</span><span><strong>Review your credit total</strong><small>{creditLimit === undefined ? "The programme limit is checked by the registration service." : `Your programme limit is ${creditLimit} credits.`}</small></span></div><div><span className="task-number">3</span><span><strong>Submit when ready</strong><small>Eligibility and seat availability are checked on the server.</small></span></div></div></section>
    </div>
    <section className="panel notice-panel"><div className="panel-heading"><div><span className="page-eyebrow">Account</span><h2>Notifications</h2></div></div>{notifications.length > 0 ? <div className="notice-list">{notifications.map((notification) => <div className="notice" key={notification.id}><span className="notice-mark" /><span><strong>{notification.title}</strong><small>{notification.body}</small></span></div>)}</div> : <p className="quiet-empty">{isDemo ? "Notifications are available after sign-in." : "No notifications are recorded for your account."}</p>}</section>
  </>;
}

function CourseRow({ course, registered, waitlisted, onSelect }: { course: Course; registered: boolean; waitlisted: boolean; onSelect: () => void }) {
  const availability = course.seatsAvailable === 0 ? course.status === "waitlist" ? "Waitlist available" : "Closed" : `${course.seatsAvailable} seats left`;
  const availabilityClass = course.seatsAvailable === 0 ? course.status === "waitlist" ? "waitlist" : "closed" : course.seatsAvailable < 5 ? "low" : "";
  return <button className="course-row" onClick={onSelect}><span className="course-code">{course.code.slice(0, 3)}</span><span className="course-main"><strong>{course.code} · {course.title}</strong><small>{course.instructor} · {course.schedule}</small></span><span className="course-room">{course.room}<small>{course.credits} credits</small></span><span className={`seat-status ${availabilityClass}`}><span />{registered ? "Registered" : waitlisted ? "Waitlisted" : availability}</span><MoreHorizontal size={19} /></button>;
}

function CourseDrawer({ course, registered, waitlisted, planned, planBlocked, busy, onClose, onAction, onPlan }: { course: Course; registered: boolean; waitlisted: boolean; planned: boolean; planBlocked: boolean; busy: boolean; onClose: () => void; onAction: () => void; onPlan: () => void }) {
  const cannotRegister = !registered && !waitlisted && course.seatsAvailable === 0 && course.status !== "waitlist";
  const actionLabel = waitlisted ? "Leave the waitlist" : registered ? "Drop this course" : course.seatsAvailable ? "Add to my schedule" : course.status === "waitlist" ? "Join the waitlist" : "Section closed";
  return <><button className="drawer-scrim" aria-label="Close course details" onClick={onClose} /><aside className="course-drawer" aria-label={`${course.code} details`}><div className="drawer-head"><span className="course-code large">{course.code.slice(0, 3)}</span><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></div><span className="page-eyebrow">{course.department} · {course.credits} credits</span><h2>{course.code}</h2><h3>{course.title}</h3>{course.description && <p>{course.description}</p>}<p>{course.schedule}<br />{course.room} · {course.instructor}</p><div className="detail-grid"><div><small>Capacity</small><strong>{course.capacity}</strong></div><div><small>Available</small><strong>{course.seatsAvailable}</strong></div><div><small>Level</small><strong>{course.level}</strong></div><div><small>Status</small><strong>{course.status}</strong></div></div><div className="prereq-box"><strong>Registration checks</strong><span>Prerequisites, schedule conflicts, credit limits, and available seats are checked when you submit.</span></div><button className={registered || waitlisted ? "danger-button full" : "primary-button full"} disabled={busy || cannotRegister} onClick={onAction}>{busy ? "Updating…" : actionLabel}</button><button className="secondary-button full drawer-plan-button" type="button" disabled={planned || planBlocked} onClick={onPlan}>{planned ? "Already in draft plan" : planBlocked ? "Already registered or waitlisted" : "Add to draft plan"}</button><p className="drawer-plan-note">A draft plan does not change your registration.</p></aside></>;
}

function ScheduleView({ registered, termName = "Current term", emptyMessage = "Sections you register for will appear here." }: { registered: Course[]; termName?: string; emptyMessage?: string }) {
  return <><PageTitle eyebrow={termName} title="My schedule" note="Meeting times and rooms for your registered sections." /><div className="schedule-summary"><div><strong>{registered.length}</strong><span>sections</span></div><div><strong>{registered.reduce((sum, course) => sum + course.credits, 0)}</strong><span>credits</span></div></div><section className="panel schedule-list">{registered.length ? registered.map((course) => <article className="schedule-course" key={course.id}><div><strong>{course.code} · {course.title}</strong><small>{course.sectionCode ? `Section ${course.sectionCode} · ` : ""}{course.credits} credits</small></div><div><strong>{course.schedule}</strong><small>{course.room} · {course.instructor}</small></div></article>) : <div className="empty-state"><CalendarDays /><strong>No registered sections</strong><span>{emptyMessage}</span></div>}</section></>;
}

function PaymentsView({ payments, isDemo }: { payments: PaymentRecord[]; isDemo: boolean }) {
  return <><PageTitle eyebrow="Student account" title="Payments" note="Transactions recorded for your account." /><section className="panel table-panel">{payments.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(payment.createdAt))}</td><td>{payment.description}</td><td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: payment.currency }).format(payment.amountMinor / 100)}</td><td>{payment.status}</td></tr>)}</tbody></table></div> : <div className="empty-state"><strong>{isDemo ? "Payment history not loaded" : "No payment transactions"}</strong><span>{isDemo ? "Sign in to view payment records associated with your account." : "No payment records are currently associated with your account."}</span></div>}</section></>;
}

function FacultyView({ active, name, courses, isDemo }: { active: string; name: string; courses: Course[]; isDemo: boolean }) {
  const enrolled = courses.reduce((sum, course) => sum + course.capacity - course.seatsAvailable, 0);
  const fullSections = courses.filter((course) => course.status === "waitlist").length;
  const termName = courses[0]?.termName ?? "Current term";
  if (active === "Rosters" || active === "My classes") return <SimpleTableView title={active} note={active === "Rosters" ? "Enrollment totals are shown by section. Individual student records are not displayed in this view." : "Published course sections assigned to your account."} columns={["Course", "Section", "Meeting time", "Room", "Enrolled", "Capacity"]} rows={courses.map((course) => [course.code, course.sectionCode ?? "—", course.schedule, course.room, String(course.capacity - course.seatsAvailable), String(course.capacity)])} emptyMessage={isDemo ? "Faculty assignment data is not loaded in preview mode." : "No published sections are linked to this faculty account."} />;
  if (active === "Schedule") return <ScheduleView registered={courses} termName={termName} emptyMessage={isDemo ? "Faculty assignment data is not loaded in preview mode." : undefined} />;
  return <><PageTitle eyebrow="Faculty workspace" title={isDemo ? "Faculty preview" : `Welcome back, ${name}`} note={isDemo ? "The preview does not include a faculty account or assigned sections." : "Sections and seat counts assigned to your account."} />{isDemo ? <section className="panel"><div className="empty-state"><BookOpen /><strong>Faculty data not loaded</strong><span>Sign in with an assigned faculty account to view its sections.</span></div></section> : <><div className="metric-grid"><MetricCard label="Assigned sections" value={String(courses.length)} note={termName} /><MetricCard label="Enrolled seats" value={String(enrolled)} note="Across assigned sections" tone="mint" /><MetricCard label="Full sections" value={String(fullSections)} note="Waitlist is enabled" tone="gold" /></div><section className="panel"><div className="panel-heading"><h2>Assigned sections</h2></div>{courses.length ? courses.map((course) => <div className="compact-course" key={course.id}><span className="course-code">{course.code.slice(0, 3)}</span><span><strong>{course.code} · {course.title}</strong><small>{course.schedule} · {course.room}</small></span><span>{course.capacity - course.seatsAvailable}/{course.capacity}</span></div>) : <div className="empty-state"><BookOpen /><strong>No assigned sections</strong><span>Published sections assigned to your account will appear here.</span></div>}</section></>}</>;
}

function RegistrarView({ active, courses }: { active: string; courses: Course[] }) {
  const totalCapacity = courses.reduce((sum, course) => sum + course.capacity, 0);
  const totalEnrollment = courses.reduce((sum, course) => sum + course.capacity - course.seatsAvailable, 0);
  const utilisation = totalCapacity ? Math.round((totalEnrollment / totalCapacity) * 100) : 0;
  const termName = courses[0]?.termName ?? "Current term";
  if (active === "Course offerings") return <SimpleTableView title="Course offerings" note={`Published sections for ${termName}.`} columns={["Course", "Section", "Instructor", "Meeting time", "Seats", "Status"]} rows={courses.map((course) => [course.code, course.sectionCode ?? "—", course.instructor, course.schedule, `${course.capacity - course.seatsAvailable}/${course.capacity}`, course.status ?? "open"])} emptyMessage="No published sections are available for this term." />;
  if (active === "Registration") return <SimpleTableView title="Registration operations" note="Review current section capacity and registration availability." columns={["Course", "Section", "Enrollment", "Available", "Status"]} rows={courses.map((course) => [course.code, course.sectionCode ?? "A", `${course.capacity - course.seatsAvailable}/${course.capacity}`, String(course.seatsAvailable), course.status ?? "open"])} />;
  if (active === "Reports") return <ReportsView courses={courses} />;
  const highestFill = [...courses].sort((first, second) => (second.capacity - second.seatsAvailable) / second.capacity - (first.capacity - first.seatsAvailable) / first.capacity).slice(0, 5);
  const limitedAvailability = courses.filter((course) => course.seatsAvailable < 10);
  return <><PageTitle eyebrow={termName} title="Registration overview" note="Published section counts and seat availability from the current catalogue." /><div className="metric-grid"><MetricCard label="Enrolled seats" value={String(totalEnrollment)} note="Across published sections" tone="mint" /><MetricCard label="Seat utilisation" value={`${utilisation}%`} note={`${courses.length} sections`} /><MetricCard label="Seats available" value={String(Math.max(0, totalCapacity - totalEnrollment))} note={termName} tone="gold" /><MetricCard label="Full sections" value={String(courses.filter((course) => course.status === "waitlist").length)} note="Waitlist enabled" /></div><div className="content-grid two-one"><section className="panel"><div className="panel-heading"><h2>Most filled sections</h2></div>{highestFill.length ? highestFill.map((course) => <div className="capacity-row" key={course.id}><span><strong>{course.code} · {course.title}</strong><small>Section {course.sectionCode ?? "—"} · {course.schedule}</small></span><strong>{course.capacity - course.seatsAvailable}/{course.capacity}</strong></div>) : <p className="quiet-empty">No published sections are available.</p>}</section><section className="panel"><div className="panel-heading"><h2>Fewer than 10 seats left</h2></div>{limitedAvailability.length ? limitedAvailability.map((course) => <div className="capacity-row" key={course.id}><span><strong>{course.code}</strong><small>{course.title}</small></span><span className={course.seatsAvailable ? "status-badge warning" : "status-badge danger"}>{course.seatsAvailable ? `${course.seatsAvailable} left` : "Full"}</span></div>) : <p className="quiet-empty">No sections meet this availability threshold.</p>}</section></div></>;
}

function ReportsView({ courses }: { courses: Course[] }) {
  const capacity = courses.reduce((sum, course) => sum + course.capacity, 0);
  const enrollment = courses.reduce((sum, course) => sum + course.capacity - course.seatsAvailable, 0);
  const fill = capacity ? Math.round((enrollment / capacity) * 100) : 0;
  const departments = Object.entries(courses.reduce<Record<string, { capacity: number; enrollment: number }>>((totals, course) => {
    const current = totals[course.department] ?? { capacity: 0, enrollment: 0 };
    current.capacity += course.capacity;
    current.enrollment += course.capacity - course.seatsAvailable;
    totals[course.department] = current;
    return totals;
  }, {}));
  return <><PageTitle eyebrow={courses[0]?.termName ?? "Current term"} title="Reports" note="Enrollment and capacity totals calculated from published sections." /><div className="metric-grid"><MetricCard label="Enrolled seats" value={String(enrollment)} note="Across published sections" tone="mint" /><MetricCard label="Total capacity" value={String(capacity)} note={`${courses.length} sections`} /><MetricCard label="Average section fill" value={`${fill}%`} note="Calculated from the catalogue" /><MetricCard label="Full sections" value={String(courses.filter((course) => course.seatsAvailable === 0).length)} note="Waitlist candidates" tone="gold" /></div><section className="panel"><div className="panel-heading"><h2>Enrollment by department</h2><span className="subtle-label">Section fill</span></div>{departments.length ? departments.map(([department, totals]) => { const departmentFill = totals.capacity ? Math.round((totals.enrollment / totals.capacity) * 100) : 0; return <div className="progress-row" key={department}><span>{department}</span><div><i style={{ width: `${departmentFill}%` }} /></div><strong>{departmentFill}%</strong></div>; }) : <p className="quiet-empty">No catalogue data is available for this term.</p>}</section></>;
}

function AdminView({ active, accounts, auditRecords, databaseConnected, dataMessage }: { active: string; accounts: AdminAccount[]; auditRecords: AdminAuditRecord[]; databaseConnected: boolean; dataMessage?: string }) {
  if (active === "Users & roles") return <SimpleTableView eyebrow="Administration" title="Users & roles" note="Account and role assignments read from the application database." columns={["Name", "Email", "Role", "Account"]} rows={accounts.map((account) => [account.name || "Name not provided", account.email, account.role ?? "Unassigned", account.active ? "Active" : "Inactive"])} emptyMessage={dataMessage ?? "No account records were returned."} />;
  if (active === "Audit trail") return <SimpleTableView eyebrow="Administration" title="Audit trail" note="Recent records from the append-only audit log." columns={["Date", "Actor", "Action", "Resource", "Outcome"]} rows={auditRecords.map((record) => [new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.occurredAt)), record.actor, record.action, record.resource, record.outcome])} emptyMessage={dataMessage ?? "No audit events have been recorded."} />;
  if (active === "System health") return <SystemHealth databaseConnected={databaseConnected} />;
  const unavailable = dataMessage ? "—" : undefined;
  return <><PageTitle eyebrow="Administration" title="System overview" note="Current account assignments and recorded audit activity." />{dataMessage && <div className="inline-alert" role="status"><span>{dataMessage}</span></div>}<div className="metric-grid"><MetricCard label="Active accounts" value={unavailable ?? String(accounts.filter((account) => account.active).length)} note="From account profiles" tone="mint" /><MetricCard label="Assigned roles" value={unavailable ?? String(accounts.filter((account) => account.role).length)} note="From role assignments" /><MetricCard label="Audit records" value={unavailable ?? String(auditRecords.length)} note="Recent records loaded" tone="gold" /><MetricCard label="Non-success outcomes" value={unavailable ?? String(auditRecords.filter((record) => record.outcome.toLowerCase() !== "success").length)} note="Within loaded audit records" /></div><div className="content-grid two-one"><SystemHealth databaseConnected={databaseConnected} compact /><section className="panel"><div className="panel-heading"><h2>Role assignments</h2></div>{dataMessage ? <p className="quiet-empty">Account records could not be loaded.</p> : <>{(["student", "faculty", "registrar", "system_admin"] as const).map((role) => <div className="capacity-row" key={role}><span><strong>{roleLabels[role]}</strong><small>Assigned accounts</small></span><strong>{accounts.filter((account) => account.role === role).length}</strong></div>)}</>}</section></div></>;
}

function SystemHealth({ compact = false, databaseConnected }: { compact?: boolean; databaseConnected: boolean }) {
  return <section className="panel"><div className="panel-heading"><div><span className="page-eyebrow">Connection check</span><h2>{compact ? "Database" : "System health"}</h2></div><span className={`service-chip ${databaseConnected ? "" : "service-chip-unverified"}`}><span className="status-dot" /> {databaseConnected ? "Query succeeded" : "Not verified"}</span></div><p className="quiet-empty">{databaseConnected ? "The authenticated application successfully read account data for this request. External services are not monitored here." : "No database health query is available for this request."}</p></section>;
}

function SimpleTableView({ title, note, columns, rows, actions, eyebrow = "Workspace", emptyMessage }: { title: string; note: string; columns: string[]; rows: string[][]; actions?: React.ReactNode; eyebrow?: string; emptyMessage?: string }) {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase()));
  return <><PageTitle eyebrow={eyebrow} title={title} note={note} actions={actions} />{rows.length > 0 && <div className="search-field compact"><Search size={19} /><input aria-label={`Search ${title.toLowerCase()}`} placeholder={`Search ${title.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} /></div>}<section className="panel table-panel">{filtered.length > 0 ? <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{filtered.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state"><strong>{rows.length ? "No matching results" : emptyMessage ?? "No records are available."}</strong>{rows.length > 0 && <span>Try a different search term.</span>}</div>}</section></>;
}

function SettingsView({ role }: { role: AppRole }) {
  return <><PageTitle eyebrow="Account" title="Settings" note="Your current workspace access." /><section className="panel settings-list"><div><span><strong>Workspace role</strong><small>Role assigned to this account and used by the application’s access checks.</small></span><span className="status-badge neutral">{roleLabels[role]}</span></div><p className="quiet-empty">Display and notification preferences are not configurable in this version.</p></section></>;
}
