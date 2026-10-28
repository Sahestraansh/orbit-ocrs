import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Trash2 } from "lucide-react";
import type { Course } from "@/lib/types";

type WhatIfPlannerProps = {
  open: boolean;
  onToggle: () => void;
  courses: Course[];
  registeredCourses: Course[];
  draftIds: Set<string>;
  onRemove: (id: string) => void;
  onClear: () => void;
  storageReady: boolean;
  creditLimit?: number;
};

type Meeting = { day: string; start: number; end: number };

const DAY_PATTERN = /\b(monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thu|friday|fri)\b/gi;
const DAY_NAMES: Record<string, string> = {
  mon: "Monday", monday: "Monday",
  tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
  wed: "Wednesday", wednesday: "Wednesday",
  thu: "Thursday", thurs: "Thursday", thursday: "Thursday",
  fri: "Friday", friday: "Friday",
};

function parseMeetings(schedule: string): Meeting[] {
  const time = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/.exec(schedule);
  if (!time || time.index === undefined) return [];
  const start = Number(time[1]) * 60 + Number(time[2]);
  const end = Number(time[3]) * 60 + Number(time[4]);
  if (end <= start) return [];

  const days = new Set<string>();
  for (const match of schedule.slice(0, time.index).matchAll(DAY_PATTERN)) {
    const day = DAY_NAMES[match[0].toLowerCase()];
    if (day) days.add(day);
  }
  return [...days].map((day) => ({ day, start, end }));
}

function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function findConflicts(courses: Course[]): string[] {
  const conflicts: string[] = [];
  for (let left = 0; left < courses.length; left += 1) {
    for (let right = left + 1; right < courses.length; right += 1) {
      const first = courses[left];
      const second = courses[right];
      for (const firstMeeting of parseMeetings(first.schedule)) {
        for (const secondMeeting of parseMeetings(second.schedule)) {
          if (firstMeeting.day !== secondMeeting.day) continue;
          if (firstMeeting.start < secondMeeting.end && secondMeeting.start < firstMeeting.end) {
            conflicts.push(`${first.code} and ${second.code} overlap on ${firstMeeting.day} (${formatTime(Math.max(firstMeeting.start, secondMeeting.start))}).`);
          }
        }
      }
    }
  }
  return [...new Set(conflicts)];
}

export function WhatIfPlanner({ open, onToggle, courses, registeredCourses, draftIds, onRemove, onClear, storageReady, creditLimit }: WhatIfPlannerProps) {
  const draftCourses = courses.filter((course) => draftIds.has(course.id));
  const projectedCourses = [...registeredCourses, ...draftCourses];
  const registeredCredits = registeredCourses.reduce((total, course) => total + course.credits, 0);
  const draftCredits = draftCourses.reduce((total, course) => total + course.credits, 0);
  const projectedCredits = registeredCredits + draftCredits;
  const conflicts = findConflicts(projectedCourses);
  const needsScheduleReview = projectedCourses.some((course) => parseMeetings(course.schedule).length === 0);
  const exceedsLimit = creditLimit !== undefined && projectedCredits > creditLimit;

  return <>
    <div className="planner-trigger-row">
      <button className="secondary-button planner-trigger" type="button" aria-expanded={open} aria-controls="what-if-planner" onClick={onToggle}>
        <CalendarDays size={17} /> {open ? "Close what-if planner" : "What-if schedule planner"}
        <span className="planner-count">{draftCourses.length}</span>
      </button>
      <span className="planner-trigger-note">Preview a schedule before registering</span>
    </div>
    {open && <section className="panel what-if-planner" id="what-if-planner" aria-labelledby="planner-title">
      <div className="panel-heading planner-heading">
        <div><span className="page-eyebrow">Planning tool</span><h2 id="planner-title">What-if schedule planner</h2><p>Try course combinations without changing your registrations.</p></div>
        {draftCourses.length > 0 && <button className="planner-clear" type="button" onClick={onClear}><Trash2 size={15} /> Clear draft</button>}
      </div>
      <div className="planner-metrics">
        <div><span>Already registered</span><strong>{registeredCredits} credits</strong></div>
        <div><span>Draft plan</span><strong>{draftCredits} credits</strong></div>
        <div className={exceedsLimit ? "over-limit" : "in-limit"}><span>{creditLimit === undefined ? "Projected total" : "Programme credit limit"}</span><strong>{creditLimit === undefined ? `${projectedCredits} credits` : `${projectedCredits} / ${creditLimit} credits`}</strong></div>
      </div>
      {conflicts.length > 0 ? <div className="planner-alert" role="status"><AlertTriangle size={18} /><div><strong>{conflicts.length} timetable clash{conflicts.length === 1 ? "" : "es"} found</strong>{conflicts.map((conflict) => <span key={conflict}>{conflict}</span>)}</div></div> :
        <div className="planner-success" role="status"><CheckCircle2 size={18} /><span>{projectedCourses.length ? needsScheduleReview ? "No clash found in the available meeting data; review sections with unlisted times." : "No timetable clashes found in this plan." : "Add a course to check the projected timetable."}</span></div>}
      {exceedsLimit && <p className="planner-warning">This draft is above your programme credit limit. Check your programme rules before registering.</p>}
      {needsScheduleReview && projectedCourses.length > 0 && <p className="planner-warning"><Clock3 size={15} /> Some meeting times are unavailable or could not be read, so review those sections manually.</p>}
      {draftCourses.length > 0 ? <ul className="planner-course-list">{draftCourses.map((course) => <li key={course.id}>
        <span className="planner-course-code">{course.code}</span>
        <span className="planner-course-detail"><strong>{course.title}</strong><small>{course.schedule} · {course.credits} credits</small></span>
        <button type="button" aria-label={`Remove ${course.code} from draft plan`} onClick={() => onRemove(course.id)}><Trash2 size={16} /></button>
      </li>)}</ul> : <p className="planner-empty">Open a course’s details and choose “Add to draft plan” to try it here.</p>}
      <p className="planner-footnote">Drafts are saved in this browser when storage is available{storageReady ? "." : "…"} Adding a course here does not register you.</p>
    </section>}
  </>;
}
