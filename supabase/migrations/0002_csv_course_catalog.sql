-- Keeps a display name for catalogue instructors even before an Auth profile is linked.
-- instructor_id remains the trusted relationship used for faculty authorization.

alter table public.course_sections
  add column if not exists instructor_name text not null default 'Staff';

update public.course_sections as section
set instructor_name = profile.full_name
from public.profiles as profile
where section.instructor_id = profile.id
  and nullif(trim(profile.full_name), '') is not null;

comment on column public.course_sections.instructor_name is
  'Catalogue display name imported from CSV; instructor_id is the trusted authenticated faculty relationship.';
