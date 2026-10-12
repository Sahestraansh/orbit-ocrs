import type { Notice } from "@/lib/types";

export const notices: Notice[] = [
  {
    id: "registration-window",
    title: "Registration closes Friday at 5:00 PM",
    body: "Review your schedule and resolve any outstanding holds before the deadline.",
    tone: "warning",
  },
  {
    id: "catalog-updated",
    title: "Fall catalog updated",
    body: "Two new Computer Science electives and revised room assignments are now available.",
    tone: "info",
  },
];

export const facultyRoster = [
  { id: "24BCE1021", name: "Aarav Sharma", program: "B.Tech CSE", status: "Enrolled" },
  { id: "24BCE1098", name: "Meera Nair", program: "B.Tech CSE", status: "Enrolled" },
  { id: "24BRS1100", name: "Sahestraansh Tyagi", program: "B.Tech CSE", status: "Enrolled" },
  { id: "24BCE1174", name: "Zoya Khan", program: "B.Tech IT", status: "Waitlisted" },
];

export const registrarActivity = [
  { time: "09:42", action: "Section capacity changed", detail: "CSE301 · 55 to 60 seats", actor: "R. Kapoor" },
  { time: "09:18", action: "Registration hold cleared", detail: "Student 24BCE1047", actor: "P. Shah" },
  { time: "08:55", action: "New section published", detail: "HUM208 · Section B", actor: "R. Kapoor" },
  { time: "08:31", action: "Waitlist promotion completed", detail: "STA210 · 3 students", actor: "System" },
];
