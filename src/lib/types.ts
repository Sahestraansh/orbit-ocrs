export type AppRole = "student" | "faculty" | "registrar" | "system_admin";

export type Course = {
  id: string;
  code: string;
  title: string;
  description?: string;
  instructor: string;
  credits: number;
  schedule: string;
  room: string;
  seatsAvailable: number;
  capacity: number;
  department: string;
  level: string;
  sectionCode?: string;
  termCode?: string;
  termName?: string;
  status?: "open" | "waitlist" | "closed";
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "success" | "warning";
};

export const roleLabels: Record<AppRole, string> = {
  student: "Student",
  faculty: "Faculty",
  registrar: "Registrar",
  system_admin: "System administrator",
};

export const rolePaths: Record<AppRole, string> = {
  student: "/student",
  faculty: "/faculty",
  registrar: "/registrar",
  system_admin: "/admin",
};
