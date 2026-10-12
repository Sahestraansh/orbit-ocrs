-- OCRS baseline schema for Supabase PostgreSQL.
-- Apply through the Supabase CLI so every environment receives the same versioned change.

create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'faculty', 'registrar', 'system_admin');
create type public.section_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.registration_status as enum ('registered', 'dropped', 'waitlisted', 'withdrawn');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  university_id text unique,
  email text not null,
  full_name text not null default '',
  programme text,
  year_level integer check (year_level between 1 and 8),
  max_credits integer not null default 24 check (max_credits between 0 and 40),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.app_role not null,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now()
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  registration_opens_at timestamptz not null,
  registration_closes_at timestamptz not null,
  drop_deadline_at timestamptz not null,
  active boolean not null default false,
  check (ends_on >= starts_on),
  check (registration_closes_at > registration_opens_at)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  department text not null,
  level integer not null check (level between 100 and 900),
  credits integer not null check (credits between 1 and 12),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_prerequisites (
  course_id uuid not null references public.courses(id) on delete cascade,
  prerequisite_course_id uuid not null references public.courses(id) on delete restrict,
  minimum_grade text,
  primary key (course_id, prerequisite_course_id),
  check (course_id <> prerequisite_course_id)
);

create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  section_code text not null,
  instructor_id uuid references public.profiles(id) on delete set null,
  capacity integer not null check (capacity > 0),
  enrolled_count integer not null default 0 check (enrolled_count >= 0),
  waitlist_enabled boolean not null default true,
  room text,
  meeting_pattern text,
  status public.section_status not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term_id, course_id, section_code),
  check (enrolled_count <= capacity)
);

create table public.section_meetings (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.course_sections(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null,
  room text,
  check (ends_at > starts_at)
);

create table public.academic_history (
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  grade text,
  completed_at date,
  passed boolean not null default false,
  primary key (student_id, course_id)
);

create table public.student_holds (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  hold_type text not null,
  reason text not null,
  blocks_registration boolean not null default true,
  placed_by uuid references public.profiles(id),
  placed_at timestamptz not null default now(),
  cleared_by uuid references public.profiles(id),
  cleared_at timestamptz
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  section_id uuid not null references public.course_sections(id) on delete restrict,
  status public.registration_status not null,
  registered_at timestamptz,
  dropped_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, section_id)
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  section_id uuid not null references public.course_sections(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete cascade,
  position bigint generated always as identity,
  joined_at timestamptz not null default now(),
  offered_at timestamptz,
  offer_expires_at timestamptz,
  accepted_at timestamptz,
  unique (section_id, student_id)
);

create table public.registration_overrides (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  section_id uuid not null references public.course_sections(id) on delete cascade,
  override_type text not null check (override_type in ('capacity', 'prerequisite', 'conflict', 'credit_limit')),
  reason text not null,
  granted_by uuid not null references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  provider text not null,
  provider_reference text not null unique,
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null default 'INR',
  status public.payment_status not null default 'pending',
  description text not null,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  outcome text not null default 'success',
  metadata jsonb not null default '{}'::jsonb
);

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  status text not null default 'received',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  unique (provider, external_event_id)
);

create index course_sections_catalog_idx on public.course_sections (term_id, status, course_id);
create index course_sections_instructor_idx on public.course_sections (instructor_id, term_id);
create index section_meetings_conflict_idx on public.section_meetings (section_id, weekday, starts_at, ends_at);
create index registrations_student_status_idx on public.registrations (student_id, status);
create index registrations_section_status_idx on public.registrations (section_id, status);
create index waitlist_section_position_idx on public.waitlist_entries (section_id, position);
create index holds_student_active_idx on public.student_holds (student_id) where cleared_at is null and blocks_registration;
create index audit_occurred_idx on public.audit_logs (occurred_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger courses_updated before update on public.courses for each row execute function public.set_updated_at();
create trigger sections_updated before update on public.course_sections for each row execute function public.set_updated_at();
create trigger registrations_updated before update on public.registrations for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer set search_path = public
as $$ select role from public.user_roles where user_id = auth.uid() $$;

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer set search_path = public
as $$ select coalesce(public.current_app_role() = required_role, false) $$;

create or replace function public.register_for_section(p_section_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_section public.course_sections%rowtype;
  v_term public.terms%rowtype;
  v_registration_id uuid;
  v_credits integer;
  v_max_credits integer;
  v_has_conflict boolean;
begin
  if v_student is null or not public.has_role('student') then raise exception 'Student authentication required'; end if;

  select * into v_section from public.course_sections where id = p_section_id for update;
  if not found or v_section.status <> 'published' then raise exception 'Section is not available'; end if;
  select * into v_term from public.terms where id = v_section.term_id;
  if now() not between v_term.registration_opens_at and v_term.registration_closes_at then raise exception 'Registration window is closed'; end if;
  if exists (select 1 from public.student_holds where student_id = v_student and blocks_registration and cleared_at is null) then raise exception 'A registration hold must be cleared first'; end if;

  select coalesce(sum(c.credits), 0), p.max_credits into v_credits, v_max_credits
  from public.profiles p
  left join public.registrations r on r.student_id = p.id and r.status = 'registered'
  left join public.course_sections s on s.id = r.section_id and s.term_id = v_section.term_id
  left join public.courses c on c.id = s.course_id
  where p.id = v_student group by p.max_credits;
  select v_credits + credits into v_credits from public.courses where id = v_section.course_id;
  if v_credits > v_max_credits and not exists (select 1 from public.registration_overrides where student_id = v_student and section_id = p_section_id and override_type = 'credit_limit' and (expires_at is null or expires_at > now())) then raise exception 'Credit limit exceeded'; end if;

  select exists (
    select 1 from public.registrations r
    join public.course_sections enrolled on enrolled.id = r.section_id and enrolled.term_id = v_section.term_id
    join public.section_meetings existing_meeting on existing_meeting.section_id = enrolled.id
    join public.section_meetings requested_meeting on requested_meeting.section_id = p_section_id
      and requested_meeting.weekday = existing_meeting.weekday
      and requested_meeting.starts_at < existing_meeting.ends_at
      and requested_meeting.ends_at > existing_meeting.starts_at
    where r.student_id = v_student and r.status = 'registered'
  ) into v_has_conflict;
  if v_has_conflict and not exists (select 1 from public.registration_overrides where student_id = v_student and section_id = p_section_id and override_type = 'conflict' and (expires_at is null or expires_at > now())) then raise exception 'The section conflicts with your current schedule'; end if;

  if v_section.enrolled_count < v_section.capacity then
    insert into public.registrations (student_id, section_id, status, registered_at)
    values (v_student, p_section_id, 'registered', now())
    on conflict (student_id, section_id) do update set status = 'registered', registered_at = now(), dropped_at = null
    returning id into v_registration_id;
    update public.course_sections set enrolled_count = enrolled_count + 1, version = version + 1 where id = p_section_id;
    delete from public.waitlist_entries where section_id = p_section_id and student_id = v_student;
  elsif v_section.waitlist_enabled then
    insert into public.registrations (student_id, section_id, status)
    values (v_student, p_section_id, 'waitlisted')
    on conflict (student_id, section_id) do update set status = 'waitlisted', dropped_at = null
    returning id into v_registration_id;
    insert into public.waitlist_entries (registration_id, section_id, student_id)
    values (v_registration_id, p_section_id, v_student)
    on conflict (section_id, student_id) do nothing;
  else
    raise exception 'Section is full';
  end if;

  insert into public.audit_logs (actor_id, action, resource_type, resource_id)
  values (v_student, case when v_section.enrolled_count < v_section.capacity then 'registration.created' else 'waitlist.joined' end, 'course_section', p_section_id::text);
  return jsonb_build_object('id', v_registration_id, 'status', case when v_section.enrolled_count < v_section.capacity then 'registered' else 'waitlisted' end);
end;
$$;

create or replace function public.drop_registration(p_section_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_status public.registration_status;
begin
  if v_student is null or not public.has_role('student') then raise exception 'Student authentication required'; end if;
  select status into v_status from public.registrations where student_id = v_student and section_id = p_section_id for update;
  if not found or v_status not in ('registered', 'waitlisted') then raise exception 'No active registration found'; end if;
  update public.registrations set status = 'dropped', dropped_at = now() where student_id = v_student and section_id = p_section_id;
  delete from public.waitlist_entries where student_id = v_student and section_id = p_section_id;
  if v_status = 'registered' then update public.course_sections set enrolled_count = greatest(0, enrolled_count - 1), version = version + 1 where id = p_section_id; end if;
  insert into public.audit_logs (actor_id, action, resource_type, resource_id) values (v_student, 'registration.dropped', 'course_section', p_section_id::text);
  return jsonb_build_object('status', 'dropped');
end;
$$;

revoke all on function public.register_for_section(uuid) from public;
revoke all on function public.drop_registration(uuid) from public;
grant execute on function public.register_for_section(uuid) to authenticated;
grant execute on function public.drop_registration(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.terms enable row level security;
alter table public.courses enable row level security;
alter table public.course_prerequisites enable row level security;
alter table public.course_sections enable row level security;
alter table public.section_meetings enable row level security;
alter table public.academic_history enable row level security;
alter table public.student_holds enable row level security;
alter table public.registrations enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.registration_overrides enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.integration_events enable row level security;

create policy "profiles_read_self_or_staff" on public.profiles for select to authenticated using (id = auth.uid() or public.current_app_role() in ('registrar','system_admin'));
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "roles_read_self_or_admin" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role('system_admin'));
create policy "roles_admin_insert" on public.user_roles for insert to authenticated with check (public.has_role('system_admin'));
create policy "roles_admin_update" on public.user_roles for update to authenticated using (public.has_role('system_admin')) with check (public.has_role('system_admin'));
create policy "roles_admin_delete" on public.user_roles for delete to authenticated using (public.has_role('system_admin'));

create policy "terms_authenticated_read" on public.terms for select to authenticated using (true);
create policy "courses_authenticated_read" on public.courses for select to authenticated using (active or public.current_app_role() in ('registrar','system_admin'));
create policy "prerequisites_authenticated_read" on public.course_prerequisites for select to authenticated using (true);
create policy "sections_authenticated_read" on public.course_sections for select to authenticated using (status = 'published' or public.current_app_role() in ('registrar','system_admin') or instructor_id = auth.uid());
create policy "meetings_authenticated_read" on public.section_meetings for select to authenticated using (true);

create policy "registrar_manage_terms" on public.terms for all to authenticated using (public.has_role('registrar')) with check (public.has_role('registrar'));
create policy "registrar_manage_courses" on public.courses for all to authenticated using (public.has_role('registrar')) with check (public.has_role('registrar'));
create policy "registrar_manage_prerequisites" on public.course_prerequisites for all to authenticated using (public.has_role('registrar')) with check (public.has_role('registrar'));
create policy "registrar_manage_sections" on public.course_sections for all to authenticated using (public.has_role('registrar')) with check (public.has_role('registrar'));
create policy "registrar_manage_meetings" on public.section_meetings for all to authenticated using (public.has_role('registrar')) with check (public.has_role('registrar'));

create policy "history_student_or_staff_read" on public.academic_history for select to authenticated using (student_id = auth.uid() or public.current_app_role() in ('registrar','system_admin'));
create policy "holds_student_or_registrar_read" on public.student_holds for select to authenticated using (student_id = auth.uid() or public.has_role('registrar'));
create policy "holds_registrar_manage" on public.student_holds for all to authenticated using (public.has_role('registrar')) with check (public.has_role('registrar'));
create policy "registrations_student_read" on public.registrations for select to authenticated using (student_id = auth.uid());
create policy "registrations_faculty_read_assigned" on public.registrations for select to authenticated using (exists (select 1 from public.course_sections s where s.id = section_id and s.instructor_id = auth.uid()));
create policy "registrations_registrar_read" on public.registrations for select to authenticated using (public.has_role('registrar'));
create policy "waitlist_student_read" on public.waitlist_entries for select to authenticated using (student_id = auth.uid());
create policy "waitlist_registrar_read" on public.waitlist_entries for select to authenticated using (public.has_role('registrar'));
create policy "overrides_student_read" on public.registration_overrides for select to authenticated using (student_id = auth.uid());
create policy "overrides_registrar_manage" on public.registration_overrides for all to authenticated using (public.has_role('registrar')) with check (public.has_role('registrar'));
create policy "payments_student_read" on public.payment_transactions for select to authenticated using (student_id = auth.uid());
create policy "notifications_self_read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications_self_update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "audit_admin_read" on public.audit_logs for select to authenticated using (public.has_role('system_admin'));
create policy "integration_admin_read" on public.integration_events for select to authenticated using (public.has_role('system_admin'));

grant usage on schema public to authenticated;
grant select on public.terms, public.courses, public.course_prerequisites, public.course_sections, public.section_meetings to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.student_holds, public.registration_overrides to authenticated;
grant select on public.academic_history, public.registrations, public.waitlist_entries, public.payment_transactions, public.audit_logs, public.integration_events to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.terms, public.courses, public.course_prerequisites, public.course_sections, public.section_meetings to authenticated;

comment on table public.audit_logs is 'Append-only for authenticated application roles; inserts occur through trusted functions or service integrations.';
comment on table public.payment_transactions is 'Stores provider references and amounts only; never store raw card data.';
