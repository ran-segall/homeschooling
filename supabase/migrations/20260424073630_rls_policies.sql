-- Enable RLS on all tables
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table lessons enable row level security;
alter table lesson_steps enable row level security;
alter table lesson_sessions enable row level security;
alter table step_responses enable row level security;
alter table lesson_feedback enable row level security;
alter table traits enable row level security;
alter table kid_progress enable row level security;

-- Allow anon to read everything (family-only app, no auth needed)
create policy "anon read profiles"       on profiles       for select using (true);
create policy "anon read subjects"       on subjects       for select using (true);
create policy "anon read lessons"        on lessons        for select using (true);
create policy "anon read lesson_steps"   on lesson_steps   for select using (true);
create policy "anon read sessions"       on lesson_sessions for select using (true);
create policy "anon read responses"      on step_responses for select using (true);
create policy "anon read feedback"       on lesson_feedback for select using (true);
create policy "anon read traits"         on traits         for select using (true);
create policy "anon read progress"       on kid_progress   for select using (true);

-- Allow anon to write (kids completing lessons, parents managing)
create policy "anon insert sessions"     on lesson_sessions for insert with check (true);
create policy "anon update sessions"     on lesson_sessions for update using (true);
create policy "anon insert responses"    on step_responses  for insert with check (true);
create policy "anon insert feedback"     on lesson_feedback for insert with check (true);
create policy "anon update progress"     on kid_progress    for update using (true);
create policy "anon update lessons"      on lessons         for update using (true);
create policy "anon insert lessons"      on lessons         for insert with check (true);
create policy "anon insert steps"        on lesson_steps    for insert with check (true);
create policy "anon delete lessons"      on lessons         for delete using (true);
