"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowLeft, BarChart3, Bell, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronDown, CircleDollarSign, Clock3, Download, GraduationCap, LayoutDashboard,
  ListFilter, Menu, MoreHorizontal, Search, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, UserCog, Users, X,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { facultyRoster, notices, registrarActivity } from "@/lib/demo-data";
import { roleLabels, type AppRole, type Course } from "@/lib/types";

type RoleDashboardProps = {
  role: AppRole;
  name: string;
  isDemo?: boolean;
  initialCourses?: Course[];
  initialRegisteredIds?: string[];
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

export function RoleDashboard({ role, name, isDemo = false, initialCourses = [], initialRegisteredIds }: RoleDashboardProps) {
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
          <div className="top-actions"><button aria-label="Notifications" className="icon-button"><Bell size={19} /><span className="notification-dot" /></button><span className="avatar small">{initials}</span></div>
        </header>
        {isDemo && <div className="demo-banner"><Sparkles size={15} /><span>The catalogue below is loaded from local Supabase. Preview actions do not write to the database.</span><Link href="/">Sign in for live actions</Link></div>}
        <div className="workspace-content">
          {active === "Settings" ? <SettingsView role={role} /> :
            role === "student" ? <StudentView active={active} notify={notify} isDemo={isDemo} availableCourses={initialCourses} initialRegisteredIds={initialRegisteredIds} name={name} /> :
            role === "faculty" ? <FacultyView active={active} notify={notify} name={name} courses={initialCourses} /> :
            role === "registrar" ? <RegistrarView active={active} notify={notify} courses={initialCourses} /> :
            <AdminView active={active} notify={notify} />}
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

function StudentView({ active, notify, isDemo, availableCourses, initialRegisteredIds, name }: { active: string; notify: (message: string) => void; isDemo: boolean; availableCourses: Course[]; initialRegisteredIds?: string[]; name: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);
  const [registered, setRegistered] = useState(() => new Set(initialRegisteredIds ?? []));
  const [busy, setBusy] = useState<string | null>(null);
  const filtered = useMemo(() => availableCourses.filter((course) => `${course.code} ${course.title} ${course.instructor}`.toLowerCase().includes(query.toLowerCase())), [availableCourses, query]);
  const registeredCourses = useMemo(() => availableCourses.filter((course) => registered.has(course.id)), [availableCourses, registered]);
  const registeredCredits = registeredCourses.reduce((sum, course) => sum + course.credits, 0);
  const waitlistedCourse = availableCourses.find((course) => course.status === "waitlist");
  const termName = availableCourses[0]?.termName ?? "Current term";
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const changeRegistration = useCallback(async (course: Course) => {
    const alreadyRegistered = registered.has(course.id);
    setBusy(course.id);
    try {
      if (!isDemo) {
        const response = await fetch("/api/registrations", {
          method: alreadyRegistered ? "DELETE" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sectionId: course.id }),
        });
        if (!response.ok) throw new Error((await response.json()).error ?? "Request failed");
      }
      setRegistered((current) => {
        const next = new Set(current);
        if (alreadyRegistered) next.delete(course.id);
        else next.add(course.id);
        return next;
      });
      notify(alreadyRegistered ? `${course.code} removed from your schedule.` : `${course.code} added to your schedule.`);
      setSelected(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Registration could not be updated.");
    } finally {
      setBusy(null);
    }
  }, [isDemo, notify, registered]);

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
        const wasRegistered = registered.has(course.id);
        await changeRegistration(course);
        return { sectionId: course.id, courseCode: course.code, status: wasRegistered ? "dropped" : course.seatsAvailable ? "registered" : "waitlisted" };
      },
    });

    return () => lifecycle.abort();
  }, [availableCourses, changeRegistration, registered, termName]);

  if (active === "Course catalog") {
    return <>
      <PageTitle eyebrow={termName} title="Course catalog" note="Search current offerings and review availability before registering." actions={<button className="secondary-button"><ListFilter size={17} /> Filters</button>} />
      <div className="search-field"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by course, code, or instructor" aria-label="Search courses" /><kbd>⌘ K</kbd></div>
      <div className="catalog-toolbar"><span>{filtered.length} courses</span><span>Updated moments ago</span></div>
      <div className="course-list">{filtered.map((course) => <CourseRow key={course.id} course={course} registered={registered.has(course.id)} onSelect={() => setSelected(course)} />)}</div>
      {filtered.length === 0 && <div className="empty-state"><Search /><strong>No catalogue records found</strong><span>Import data with npm run db:import-csv, then refresh this page.</span></div>}
      {selected && <CourseDrawer course={selected} registered={registered.has(selected.id)} busy={busy === selected.id} onClose={() => setSelected(null)} onAction={() => changeRegistration(selected)} />}
    </>;
  }

  if (active === "My schedule") return <ScheduleView registered={registeredCourses} termName={termName} />;
  if (active === "Waitlist") return <SimpleTableView title="My waitlist" note="Track your position and respond when a seat becomes available." columns={["Course", "Availability", "Term", "Status"]} rows={waitlistedCourse ? [[`${waitlistedCourse.code} · ${waitlistedCourse.title}`, "Section full", termName, "Waitlist available"]] : []} />;
  if (active === "Payments") return <PaymentsView notify={notify} />;

  return <>
    <PageTitle eyebrow={today} title={`Good morning, ${name.split(" ")[0]}`} note="Your registration is on track. Here is what needs your attention." actions={<button className="primary-button" onClick={() => document.querySelector<HTMLButtonElement>('[data-nav="catalog"]')?.click()}><Search size={17} /> Find courses</button>} />
    <div className="metric-grid"><MetricCard label="Registered credits" value={`${registeredCredits} / 24`} note={`${Math.max(0, 24 - registeredCredits)} credits available`} /><MetricCard label="Classes this term" value={String(registeredCourses.length)} note="Loaded from your registrations" tone="mint" /><MetricCard label="Waitlist available" value={waitlistedCourse ? "Yes" : "None"} note={waitlistedCourse ? `${waitlistedCourse.code} · ${waitlistedCourse.title}` : "No full sections"} tone="gold" /><MetricCard label="Amount due" value="₹0" note="No outstanding balance" /></div>
    <div className="content-grid two-one">
      <section className="panel"><div className="panel-heading"><div><span className="page-eyebrow">Registered</span><h2>Your classes</h2></div><button onClick={() => notify("Full weekly schedule opened.")}>View week</button></div><div className="timeline">{registeredCourses.slice(0, 3).map((course, index) => <div className="timeline-row" key={course.id}><span className="timeline-time">{course.schedule.split(" ").slice(-1)[0]}</span><span className={`timeline-line ${index % 2 ? "gold" : "mint"}`} /><div><strong>{course.code} · {course.title}</strong><small>{course.room} · {course.instructor}</small></div><span className="duration">{course.credits} credits</span></div>)}{registeredCourses.length === 0 && <div className="empty-state"><BookOpen /><strong>No registered courses</strong><span>Add a course from the catalogue.</span></div>}</div></section>
      <section className="panel"><div className="panel-heading"><div><span className="page-eyebrow">Registration</span><h2>What’s next</h2></div></div><div className="task-list"><div><span className="task-check"><Check size={15} /></span><span><strong>Academic hold cleared</strong><small>Account eligible to register</small></span></div><div><span className="task-number">2</span><span><strong>Review waitlist availability</strong><small>{waitlistedCourse ? `${waitlistedCourse.code} · ${waitlistedCourse.title}` : "No full sections"}</small></span></div><div><span className="task-number muted">3</span><span><strong>Review final schedule</strong><small>{registeredCourses.length} registered sections</small></span></div></div></section>
    </div>
    <section className="panel notice-panel"><div className="panel-heading"><div><span className="page-eyebrow">Updates</span><h2>Notices for you</h2></div></div><div className="notice-list">{notices.map((notice) => <div className={`notice ${notice.tone}`} key={notice.id}><span className="notice-mark" /><span><strong>{notice.title}</strong><small>{notice.body}</small></span></div>)}</div></section>
  </>;
}

function CourseRow({ course, registered, onSelect }: { course: Course; registered: boolean; onSelect: () => void }) {
  const availability = course.seatsAvailable === 0 ? "Waitlist" : `${course.seatsAvailable} seats left`;
  return <button className="course-row" onClick={onSelect}><span className="course-code">{course.code.slice(0, 3)}</span><span className="course-main"><strong>{course.code} · {course.title}</strong><small>{course.instructor} · {course.schedule}</small></span><span className="course-room">{course.room}<small>{course.credits} credits</small></span><span className={`seat-status ${course.seatsAvailable === 0 ? "waitlist" : course.seatsAvailable < 5 ? "low" : ""}`}><span />{registered ? "Registered" : availability}</span><MoreHorizontal size={19} /></button>;
}

function CourseDrawer({ course, registered, busy, onClose, onAction }: { course: Course; registered: boolean; busy: boolean; onClose: () => void; onAction: () => void }) {
  return <><button className="drawer-scrim" aria-label="Close course details" onClick={onClose} /><aside className="course-drawer" aria-label={`${course.code} details`}><div className="drawer-head"><span className="course-code large">{course.code.slice(0, 3)}</span><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></div><span className="page-eyebrow">{course.department} · {course.credits} credits</span><h2>{course.code}</h2><h3>{course.title}</h3>{course.description && <p>{course.description}</p>}<p>{course.schedule}<br />{course.room} · {course.instructor}</p><div className="detail-grid"><div><small>Capacity</small><strong>{course.capacity}</strong></div><div><small>Available</small><strong>{course.seatsAvailable}</strong></div><div><small>Level</small><strong>{course.level}</strong></div><div><small>Status</small><strong>{course.status}</strong></div></div><div className="prereq-box"><strong>Registration check</strong><span><CheckCircle2 size={17} /> Prerequisites satisfied</span><span><CheckCircle2 size={17} /> No schedule conflict</span><span><CheckCircle2 size={17} /> Within credit limit</span></div><button className={registered ? "danger-button full" : "primary-button full"} disabled={busy} onClick={onAction}>{busy ? "Updating…" : registered ? "Drop this course" : course.seatsAvailable ? "Add to my schedule" : "Join the waitlist"}</button></aside></>;
}

function ScheduleView({ registered, termName = "Current term" }: { registered: Course[]; termName?: string }) {
  const positions = [
    { gridColumn: 2, gridRow: "3 / span 2", className: "mint-event" },
    { gridColumn: 3, gridRow: "2 / span 2", className: "gold-event" },
    { gridColumn: 4, gridRow: "5 / span 2", className: "rose-event" },
    { gridColumn: 5, gridRow: "3 / span 2", className: "mint-event" },
    { gridColumn: 6, gridRow: "6 / span 2", className: "gold-event" },
  ];
  return <><PageTitle eyebrow={termName} title="My schedule" note="A conflict-free view of your registered courses." actions={<button className="secondary-button"><Download size={17} /> Export calendar</button>} /><div className="schedule-summary"><div><strong>{registered.length}</strong><span>courses</span></div><div><strong>{registered.reduce((sum, course) => sum + course.credits, 0)}</strong><span>credits</span></div><div><strong>0</strong><span>conflicts</span></div></div><section className="panel"><div className="weekly-grid"><div className="week-corner" />{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => <div className="week-day" key={day}>{day}</div>)}{["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"].map((time) => <div className="week-time" key={time}>{time}</div>)}{registered.slice(0, positions.length).map((course, index) => <div key={course.id} className={`schedule-event ${positions[index].className}`} style={{ gridColumn: positions[index].gridColumn, gridRow: positions[index].gridRow }}><strong>{course.code}</strong><small>{course.room}</small></div>)}</div>{registered.length === 0 && <div className="empty-state"><CalendarDays /><strong>No courses scheduled</strong><span>Registered sections will appear here.</span></div>}</section></>;
}

function PaymentsView({ notify }: { notify: (message: string) => void }) {
  return <><PageTitle eyebrow="Student account" title="Payments" note="Review tuition charges and verified payment history." /><div className="metric-grid"><MetricCard label="Current balance" value="₹0" note="Nothing due" tone="mint" /><MetricCard label="Last payment" value="₹48,500" note="Received 16 Aug 2026" /><MetricCard label="Payment status" value="Paid" note="Fall 2026" /></div><section className="panel"><div className="panel-heading"><h2>Payment history</h2><button onClick={() => notify("Receipt download prepared.")}><Download size={16} /> Download receipt</button></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody><tr><td>16 Aug 2026</td><td>Fall semester tuition</td><td>Hosted payment</td><td>₹48,500</td><td><span className="status-badge success">Paid</span></td></tr></tbody></table></div></section></>;
}

function FacultyView({ active, notify, name, courses }: { active: string; notify: (message: string) => void; name: string; courses: Course[] }) {
  const enrolled = courses.reduce((sum, course) => sum + course.capacity - course.seatsAvailable, 0);
  const fullSections = courses.filter((course) => course.status === "waitlist").length;
  const termName = courses[0]?.termName ?? "Current term";
  if (active === "Rosters" || active === "My classes") return <SimpleTableView title={active} note="Current enrollment for your assigned course sections." columns={["Student ID", "Name", "Programme", "Status"]} rows={facultyRoster.map((student) => [student.id, student.name, student.program, student.status])} actions={<button className="secondary-button" onClick={() => notify("Roster exported.")}><Download size={17} /> Export roster</button>} />;
  if (active === "Schedule") return <ScheduleView registered={courses} termName={termName} />;
  return <><PageTitle eyebrow="Faculty workspace" title={`Welcome back, ${name}`} note="Your classes and roster activity for the current term." /><div className="metric-grid"><MetricCard label="Assigned sections" value={String(courses.length)} note={termName} /><MetricCard label="Total students" value={String(enrolled)} note="Across assigned sections" tone="mint" /><MetricCard label="Full sections" value={String(fullSections)} note="Waitlist-enabled sections" tone="gold" /><MetricCard label="Catalogue source" value="CSV" note="Stored in Supabase" /></div><div className="content-grid two-one"><section className="panel"><div className="panel-heading"><h2>Assigned classes</h2><button onClick={() => notify("Showing all assigned classes.")}>View all</button></div>{courses.slice(0, 3).map((course) => <div className="compact-course" key={course.id}><span className="course-code">{course.code.slice(0, 3)}</span><span><strong>{course.code} · {course.title}</strong><small>{course.schedule} · {course.room}</small></span><span>{course.capacity - course.seatsAvailable}/{course.capacity}</span></div>)}{courses.length === 0 && <div className="empty-state"><BookOpen /><strong>No linked sections</strong><span>Rerun the CSV importer after creating this faculty account.</span></div>}</section><section className="panel"><div className="panel-heading"><h2>Quick actions</h2></div><div className="quick-actions"><button onClick={() => notify("Opening roster…")}><Users /> View today’s roster</button><button onClick={() => notify("Announcement composer opened.")}><Bell /> Send announcement</button><button onClick={() => notify("Schedule exported.")}><Download /> Export schedule</button></div></section></div></>;
}

function RegistrarView({ active, notify, courses }: { active: string; notify: (message: string) => void; courses: Course[] }) {
  const totalCapacity = courses.reduce((sum, course) => sum + course.capacity, 0);
  const totalEnrollment = courses.reduce((sum, course) => sum + course.capacity - course.seatsAvailable, 0);
  const utilisation = totalCapacity ? Math.round((totalEnrollment / totalCapacity) * 100) : 0;
  const termName = courses[0]?.termName ?? "Current term";
  if (active === "Course offerings") return <SimpleTableView title="Course offerings" note={`Manage the sections published for ${termName}.`} columns={["Course", "Instructor", "Schedule", "Seats", "Status"]} rows={courses.map((course) => [course.code, course.instructor, course.schedule, `${course.capacity - course.seatsAvailable}/${course.capacity}`, course.status ?? "open"])} actions={<button className="primary-button" onClick={() => notify("New section form opened.")}>Add section</button>} />;
  if (active === "Registration") return <SimpleTableView title="Registration operations" note="Review current section capacity and registration availability." columns={["Course", "Section", "Enrollment", "Available", "Status"]} rows={courses.map((course) => [course.code, course.sectionCode ?? "A", `${course.capacity - course.seatsAvailable}/${course.capacity}`, String(course.seatsAvailable), course.status ?? "open"])} />;
  if (active === "Reports") return <ReportsView notify={notify} courses={courses} />;
  return <><PageTitle eyebrow="Registrar workspace" title="Registration control centre" note="A live overview of enrollment, capacity, and operational attention." actions={<button className="primary-button" onClick={() => notify("Registration window settings opened.")}><SlidersHorizontal size={17} /> Manage window</button>} /><div className="metric-grid"><MetricCard label="Active registrations" value={String(totalEnrollment)} note="From imported sections" tone="mint" /><MetricCard label="Seat utilisation" value={`${utilisation}%`} note={`Across ${courses.length} sections`} /><MetricCard label="Available seats" value={String(Math.max(0, totalCapacity - totalEnrollment))} note={termName} tone="gold" /><MetricCard label="Full sections" value={String(courses.filter((course) => course.status === "waitlist").length)} note="Waitlist enabled" /></div><div className="content-grid two-one"><section className="panel"><div className="panel-heading"><h2>Enrollment activity</h2><span className="subtle-label">Current catalogue</span></div><div className="bar-chart" aria-label="Enrollment by imported section">{courses.slice(0, 10).map((course) => <span key={course.id} style={{ height: `${Math.max(8, Math.round(((course.capacity - course.seatsAvailable) / course.capacity) * 100))}%` }} />)}</div><div className="chart-labels"><span>Lower fill</span><span>Imported sections</span><span>Higher fill</span></div></section><section className="panel"><div className="panel-heading"><h2>Capacity alerts</h2><button>View all</button></div>{courses.filter((course) => course.seatsAvailable < 10).map((course) => <div className="capacity-row" key={course.id}><span><strong>{course.code}</strong><small>{course.title}</small></span><span className={course.seatsAvailable ? "status-badge warning" : "status-badge danger"}>{course.seatsAvailable ? `${course.seatsAvailable} left` : "Full"}</span></div>)}</section></div><section className="panel"><div className="panel-heading"><h2>Recent administrative activity</h2><button><Download size={16} /> Export</button></div><div className="activity-list">{registrarActivity.map((item) => <div key={`${item.time}-${item.action}`}><span className="activity-time">{item.time}</span><span><strong>{item.action}</strong><small>{item.detail}</small></span><span>{item.actor}</span></div>)}</div></section></>;
}

function ReportsView({ notify, courses }: { notify: (message: string) => void; courses: Course[] }) {
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
  return <><PageTitle eyebrow="Decision support" title="Reports" note={`Enrollment and capacity insights for ${courses[0]?.termName ?? "the current term"}.`} actions={<button className="secondary-button" onClick={() => notify("Report export prepared.")}><Download size={17} /> Export report</button>} /><div className="metric-grid"><MetricCard label="Total enrollment" value={String(enrollment)} note="Across imported sections" tone="mint" /><MetricCard label="Total capacity" value={String(capacity)} note={`${courses.length} sections`} /><MetricCard label="Average section fill" value={`${fill}%`} note="Calculated from Supabase" /><MetricCard label="Full sections" value={String(courses.filter((course) => course.seatsAvailable === 0).length)} note="Waitlist candidates" tone="gold" /></div><section className="panel"><div className="panel-heading"><h2>Enrollment by department</h2><span className="subtle-label">Section fill</span></div>{departments.map(([department, totals]) => { const departmentFill = totals.capacity ? Math.round((totals.enrollment / totals.capacity) * 100) : 0; return <div className="progress-row" key={department}><span>{department}</span><div><i style={{ width: `${departmentFill}%` }} /></div><strong>{departmentFill}%</strong></div>; })}</section></>;
}

function AdminView({ active, notify }: { active: string; notify: (message: string) => void }) {
  if (active === "Users & roles") return <SimpleTableView title="Users & roles" note="Role assignments are enforced by database policies, not by this interface alone." columns={["User", "Email", "Role", "Status"]} rows={[["Sahestraansh Tyagi", "student@ocrs.local", "Student", "Active"], ["Dr. Arjun Menon", "faculty@ocrs.local", "Faculty", "Active"], ["Rohan Kapoor", "registrar@ocrs.local", "Registrar", "Active"], ["Anika Bose", "admin@ocrs.local", "System administrator", "Active"]]} actions={<button className="primary-button" onClick={() => notify("Invite workflow opened.")}>Invite user</button>} />;
  if (active === "Audit trail") return <SimpleTableView title="Audit trail" note="Append-only records of security-sensitive and administrative activity." columns={["Time", "Actor", "Action", "Resource", "Result"]} rows={registrarActivity.map((item) => [item.time, item.actor, item.action, item.detail, "Success"])} actions={<button className="secondary-button" onClick={() => notify("Audit export prepared.")}><Download size={17} /> Export</button>} />;
  if (active === "System health") return <SystemHealth />;
  return <><PageTitle eyebrow="Administration" title="System overview" note="Access governance, integrations, and platform health at a glance." /><div className="metric-grid"><MetricCard label="Active users" value="5,084" note="1,203 online today" tone="mint" /><MetricCard label="Services healthy" value="6 / 6" note="All checks passing" /><MetricCard label="Pending role requests" value="4" note="Awaiting review" tone="gold" /><MetricCard label="Security events" value="0" note="Past 24 hours" /></div><div className="content-grid two-one"><SystemHealth compact /><section className="panel"><div className="panel-heading"><h2>Access summary</h2></div>{[["Students", "4,612"], ["Faculty", "382"], ["Registrars", "14"], ["Administrators", "6"]].map(([label, count]) => <div className="capacity-row" key={label}><span><strong>{label}</strong><small>Active assignments</small></span><strong>{count}</strong></div>)}</section></div></>;
}

function SystemHealth({ compact = false }: { compact?: boolean }) {
  const services = [["Supabase database", "Operational", "86 ms"], ["Supabase authentication", "Operational", "121 ms"], ["Student information system", "Operational", "204 ms"], ["Payment provider", "Operational", "178 ms"], ["Email notifications", "Operational", "96 ms"], ["Next.js application", "Operational", "72 ms"]];
  return <section className="panel"><div className="panel-heading"><div><span className="page-eyebrow">Live checks</span><h2>{compact ? "Service health" : "System health"}</h2></div><span className="service-chip"><span className="status-dot" /> All operational</span></div><div className="service-list">{services.slice(0, compact ? 4 : services.length).map(([name, status, latency]) => <div key={name}><span><span className="status-dot" /><strong>{name}</strong></span><span>{status}</span><small>{latency}</small></div>)}</div></section>;
}

function SimpleTableView({ title, note, columns, rows, actions }: { title: string; note: string; columns: string[]; rows: string[][]; actions?: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase()));
  return <><PageTitle eyebrow="Fall 2026" title={title} note={note} actions={actions} /><div className="search-field compact"><Search size={19} /><input aria-label={`Search ${title.toLowerCase()}`} placeholder={`Search ${title.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} /></div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{filtered.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cellIndex === row.length - 1 ? <span className="status-badge success">{cell}</span> : cell}</td>)}</tr>)}</tbody></table></div>{filtered.length === 0 && <div className="empty-state"><Search /><strong>No matching results</strong><span>Try a different search term.</span></div>}</section></>;
}

function SettingsView({ role }: { role: AppRole }) {
  return <><PageTitle eyebrow="Preferences" title="Settings" note="Manage display and notification preferences for this workspace." /><section className="panel settings-list"><div><span><strong>Email notifications</strong><small>Registration updates, waitlist offers, and service notices.</small></span><button className="toggle on" aria-label="Disable email notifications"><span /></button></div><div><span><strong>Reduced motion</strong><small>Minimise non-essential interface animation.</small></span><button className="toggle" aria-label="Enable reduced motion"><span /></button></div><div><span><strong>Workspace role</strong><small>Assigned by an authorised university administrator.</small></span><span className="status-badge neutral">{roleLabels[role]}</span></div></section></>;
}
