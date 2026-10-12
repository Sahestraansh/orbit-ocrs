import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_HEADERS = [
  "term_code", "term_name", "term_starts_on", "term_ends_on", "registration_opens_at",
  "registration_closes_at", "drop_deadline_at", "term_active", "course_code", "course_title",
  "course_description", "department", "level", "credits", "course_active", "section_code",
  "instructor_name", "instructor_email", "capacity", "enrolled_count", "waitlist_enabled", "room",
  "meeting_pattern", "section_status",
];

function parseArguments() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  return {
    dryRun: args.includes("--dry-run"),
    replaceEnrollment: args.includes("--replace-enrollment") || args.includes("--replace-enrolment"),
    filePath: path.resolve(fileIndex >= 0 && args[fileIndex + 1] ? args[fileIndex + 1] : "data/course_catalog.csv"),
  };
}

async function loadEnvironmentFile(filePath) {
  let contents;
  try {
    contents = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field.trim());
      field = "";
    } else if (character === "\n") {
      row.push(field.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(field.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  if (rows.length < 2) throw new Error("CSV must contain a header and at least one data row.");
  return rows;
}

function requiredText(value, label, rowNumber) {
  if (!value) throw new Error(`Row ${rowNumber}: ${label} is required.`);
  return value;
}

function integer(value, label, rowNumber, minimum, maximum) {
  if (!/^-?\d+$/.test(value)) throw new Error(`Row ${rowNumber}: ${label} must be a whole number.`);
  const parsed = Number(value);
  if (parsed < minimum || parsed > maximum) throw new Error(`Row ${rowNumber}: ${label} must be between ${minimum} and ${maximum}.`);
  return parsed;
}

function boolean(value, label, rowNumber) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Row ${rowNumber}: ${label} must be true or false.`);
}

function dateOnly(value, label, rowNumber) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`Row ${rowNumber}: ${label} must use YYYY-MM-DD format.`);
  }
  return value;
}

function timestamp(value, label, rowNumber) {
  if (Number.isNaN(Date.parse(value))) throw new Error(`Row ${rowNumber}: ${label} must be an ISO timestamp.`);
  return new Date(value).toISOString();
}

function enumValue(value, label, rowNumber, allowed) {
  if (!allowed.includes(value)) throw new Error(`Row ${rowNumber}: ${label} must be one of ${allowed.join(", ")}.`);
  return value;
}

function recordsFromCsv(text) {
  const rows = parseCsv(text);
  const headers = rows[0];
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  const unexpected = headers.filter((header) => !REQUIRED_HEADERS.includes(header));
  if (missing.length) throw new Error(`CSV is missing required columns: ${missing.join(", ")}.`);
  if (unexpected.length) throw new Error(`CSV contains unexpected columns: ${unexpected.join(", ")}.`);
  if (new Set(headers).size !== headers.length) throw new Error("CSV contains duplicate column headings.");

  const sectionKeys = new Set();
  return rows.slice(1).map((values, index) => {
    const rowNumber = index + 2;
    if (values.length !== headers.length) throw new Error(`Row ${rowNumber}: expected ${headers.length} fields but found ${values.length}.`);
    const raw = Object.fromEntries(headers.map((header, column) => [header, values[column]]));
    const capacity = integer(raw.capacity, "capacity", rowNumber, 1, 1000);
    const enrolledCount = integer(raw.enrolled_count, "enrolled_count", rowNumber, 0, capacity);
    const courseCode = requiredText(raw.course_code, "course_code", rowNumber).toUpperCase();
    const sectionCode = requiredText(raw.section_code, "section_code", rowNumber).toUpperCase();
    const termCode = requiredText(raw.term_code, "term_code", rowNumber).toUpperCase();
    const sectionKey = `${termCode}|${courseCode}|${sectionCode}`;
    if (sectionKeys.has(sectionKey)) throw new Error(`Row ${rowNumber}: duplicate section ${sectionKey}.`);
    sectionKeys.add(sectionKey);

    return {
      rowNumber,
      term: {
        code: termCode,
        name: requiredText(raw.term_name, "term_name", rowNumber),
        starts_on: dateOnly(raw.term_starts_on, "term_starts_on", rowNumber),
        ends_on: dateOnly(raw.term_ends_on, "term_ends_on", rowNumber),
        registration_opens_at: timestamp(raw.registration_opens_at, "registration_opens_at", rowNumber),
        registration_closes_at: timestamp(raw.registration_closes_at, "registration_closes_at", rowNumber),
        drop_deadline_at: timestamp(raw.drop_deadline_at, "drop_deadline_at", rowNumber),
        active: boolean(raw.term_active, "term_active", rowNumber),
      },
      course: {
        code: courseCode,
        title: requiredText(raw.course_title, "course_title", rowNumber),
        description: requiredText(raw.course_description, "course_description", rowNumber),
        department: requiredText(raw.department, "department", rowNumber),
        level: integer(raw.level, "level", rowNumber, 100, 900),
        credits: integer(raw.credits, "credits", rowNumber, 1, 12),
        active: boolean(raw.course_active, "course_active", rowNumber),
      },
      section: {
        section_code: sectionCode,
        instructor_name: requiredText(raw.instructor_name, "instructor_name", rowNumber),
        instructor_email: requiredText(raw.instructor_email, "instructor_email", rowNumber).toLowerCase(),
        capacity,
        enrolled_count: enrolledCount,
        waitlist_enabled: boolean(raw.waitlist_enabled, "waitlist_enabled", rowNumber),
        room: requiredText(raw.room, "room", rowNumber),
        meeting_pattern: requiredText(raw.meeting_pattern, "meeting_pattern", rowNumber),
        status: enumValue(raw.section_status, "section_status", rowNumber, ["draft", "published", "cancelled", "completed"]),
      },
    };
  });
}

function uniqueConsistent(records, field, keySelector) {
  const values = new Map();
  for (const record of records) {
    const value = record[field];
    const key = keySelector(value);
    const previous = values.get(key);
    if (previous && JSON.stringify(previous) !== JSON.stringify(value)) {
      throw new Error(`Conflicting ${field} details were supplied for ${key}.`);
    }
    values.set(key, value);
  }
  return [...values.values()];
}

function assertLocalSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required in .env.local.");
  const hostname = new URL(url).hostname;
  if (!new Set(["127.0.0.1", "localhost"]).has(hostname)) {
    throw new Error("This importer is restricted to the local Supabase project.");
  }
  return { url, secretKey };
}

async function expectResult(promise, action) {
  const result = await promise;
  if (result.error) throw new Error(`${action}: ${result.error.message}`);
  return result.data ?? [];
}

async function main() {
  const options = parseArguments();
  await loadEnvironmentFile(path.resolve(".env.local"));
  const csvText = await fs.readFile(options.filePath, "utf8");
  const records = recordsFromCsv(csvText);
  const terms = uniqueConsistent(records, "term", (term) => term.code);
  const courses = uniqueConsistent(records, "course", (course) => course.code);

  console.log(`Validated ${records.length} section rows, ${courses.length} courses, and ${terms.length} term from ${path.relative(process.cwd(), options.filePath)}.`);
  if (options.dryRun) {
    console.log("Dry run complete. No database records were changed.");
    return;
  }

  const { url, secretKey } = assertLocalSupabase();
  const supabase = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const termRows = await expectResult(supabase.from("terms").upsert(terms, { onConflict: "code" }).select("id,code"), "Unable to import terms");
  const courseRows = await expectResult(supabase.from("courses").upsert(courses, { onConflict: "code" }).select("id,code"), "Unable to import courses");
  const termIds = new Map(termRows.map((row) => [row.code, row.id]));
  const courseIds = new Map(courseRows.map((row) => [row.code, row.id]));

  const instructorEmails = [...new Set(records.map((record) => record.section.instructor_email))];
  const profileRows = instructorEmails.length
    ? await expectResult(supabase.from("profiles").select("id,email,full_name").in("email", instructorEmails), "Unable to resolve instructors")
    : [];
  const instructorIds = new Map(profileRows.map((profile) => [profile.email.toLowerCase(), profile.id]));

  const existingRows = await expectResult(
    supabase.from("course_sections").select("id,term_id,course_id,section_code,enrolled_count").in("term_id", [...termIds.values()]),
    "Unable to inspect existing sections",
  );
  const existingSections = new Map(existingRows.map((section) => [`${section.term_id}|${section.course_id}|${section.section_code}`, section]));

  let inserted = 0;
  let updated = 0;
  for (const record of records) {
    const termId = termIds.get(record.term.code);
    const courseId = courseIds.get(record.course.code);
    if (!termId || !courseId) throw new Error(`Unable to resolve IDs for row ${record.rowNumber}.`);
    const sectionKey = `${termId}|${courseId}|${record.section.section_code}`;
    const existing = existingSections.get(sectionKey);
    const payload = {
      term_id: termId,
      course_id: courseId,
      section_code: record.section.section_code,
      instructor_id: instructorIds.get(record.section.instructor_email) ?? null,
      instructor_name: record.section.instructor_name,
      capacity: record.section.capacity,
      waitlist_enabled: record.section.waitlist_enabled,
      room: record.section.room,
      meeting_pattern: record.section.meeting_pattern,
      status: record.section.status,
      ...(!existing || options.replaceEnrollment ? { enrolled_count: record.section.enrolled_count } : {}),
    };
    await expectResult(
      supabase.from("course_sections").upsert(payload, { onConflict: "term_id,course_id,section_code" }).select("id"),
      `Unable to import section on CSV row ${record.rowNumber}`,
    );
    if (existing) updated += 1;
    else inserted += 1;
  }

  const unresolved = instructorEmails.filter((email) => !instructorIds.has(email));
  const verificationRows = await expectResult(
    supabase
      .from("course_sections")
      .select("section_code,instructor_name,capacity,enrolled_count,room,meeting_pattern,courses!inner(code),terms!inner(code)")
      .in("term_id", [...termIds.values()]),
    "Unable to verify imported sections",
  );
  const importedSectionKeys = new Set(verificationRows.map((section) => `${section.terms.code}|${section.courses.code}|${section.section_code}`));
  const missingSections = records
    .map((record) => `${record.term.code}|${record.course.code}|${record.section.section_code}`)
    .filter((key) => !importedSectionKeys.has(key));
  if (missingSections.length) throw new Error(`Import verification failed for: ${missingSections.join(", ")}.`);

  console.log(`Import complete: ${inserted} sections inserted and ${updated} sections updated.`);
  console.log(`Verified ${records.length} CSV sections in Supabase with course, instructor, capacity, room, and schedule columns.`);
  if (unresolved.length) {
    console.log(`Instructor profiles not yet linked: ${unresolved.join(", ")}. Their CSV names are still displayed.`);
  }
  if (!options.replaceEnrollment && updated) {
    console.log("Existing enrolled_count values were preserved. Use --replace-enrollment only when intentionally restoring CSV baseline counts.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
