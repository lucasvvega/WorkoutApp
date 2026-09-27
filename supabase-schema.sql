-- ============================================================
-- Workout Tracker — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- Table: workouts
-- One row = one named workout assigned to a day of the week.
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week text not null check (day_of_week in
    ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  name text not null,
  created_at timestamptz not null default now()
);

-- Table: splits
-- One row = one exercise/segment inside a workout, in order,
-- with a rest timer (in seconds) to take *after* completing it.
create table if not exists splits (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  name text not null,
  sets int,
  reps int,
  weight numeric,
  rest_seconds int not null default 60,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Row Level Security: every user can only see/edit their own data
-- ------------------------------------------------------------
alter table workouts enable row level security;
alter table splits enable row level security;

create policy "workouts_select_own" on workouts
  for select using (auth.uid() = user_id);
create policy "workouts_insert_own" on workouts
  for insert with check (auth.uid() = user_id);
create policy "workouts_update_own" on workouts
  for update using (auth.uid() = user_id);
create policy "workouts_delete_own" on workouts
  for delete using (auth.uid() = user_id);

-- splits are owned indirectly through their parent workout
create policy "splits_select_own" on splits
  for select using (
    exists (select 1 from workouts w where w.id = splits.workout_id and w.user_id = auth.uid())
  );
create policy "splits_insert_own" on splits
  for insert with check (
    exists (select 1 from workouts w where w.id = splits.workout_id and w.user_id = auth.uid())
  );
create policy "splits_update_own" on splits
  for update using (
    exists (select 1 from workouts w where w.id = splits.workout_id and w.user_id = auth.uid())
  );
create policy "splits_delete_own" on splits
  for delete using (
    exists (select 1 from workouts w where w.id = splits.workout_id and w.user_id = auth.uid())
  );

create index if not exists splits_workout_id_idx on splits(workout_id);
create index if not exists workouts_user_id_idx on workouts(user_id);
