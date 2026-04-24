-- Profiles: kids and parents
create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('kid', 'parent')),
  age integer,
  avatar_color text default '#171614',
  created_at timestamptz default now()
);

-- Subjects reference
create table subjects (
  id text primary key,
  label text not null,
  color text not null
);

-- Lessons (approved queue + completed)
create table lessons (
  id text primary key,
  title text not null,
  subject_id text references subjects(id),
  assigned_to uuid references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'completed')),
  why_now text,
  xp_reward integer default 50,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Individual steps within a lesson
create table lesson_steps (
  id uuid primary key default gen_random_uuid(),
  lesson_id text references lessons(id) on delete cascade,
  step_order integer not null,
  type text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

-- A completed or in-progress lesson session
create table lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id text references lessons(id),
  kid_id uuid references profiles(id),
  started_at timestamptz default now(),
  completed_at timestamptz,
  time_spent_seconds integer
);

-- Per-step responses within a session
create table step_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references lesson_sessions(id) on delete cascade,
  step_id uuid references lesson_steps(id),
  answer jsonb,
  is_correct boolean,
  feedback_note text,
  created_at timestamptz default now()
);

-- Post-lesson feedback from the kid
create table lesson_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references lesson_sessions(id) on delete cascade,
  fun_rating integer check (fun_rating between 1 and 4),
  learned_something text,
  difficulty text check (difficulty in ('too_easy', 'just_right', 'too_hard')),
  created_at timestamptz default now()
);

-- Trait progress per kid
create table traits (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references profiles(id),
  trait_name text not null,
  score integer default 0,
  updated_at timestamptz default now(),
  unique (kid_id, trait_name)
);

-- XP and level per kid
create table kid_progress (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references profiles(id) unique,
  xp integer default 0,
  level integer default 1,
  streak_days integer default 0,
  last_lesson_at timestamptz,
  updated_at timestamptz default now()
);

-- ─── Seed data ───────────────────────────────────────────────

insert into subjects (id, label, color) values
  ('philosophy',  'Philosophy',  'oklch(0.72 0.12 295)'),
  ('geography',   'Geography',   'oklch(0.72 0.12 180)'),
  ('writing',     'Writing',     'oklch(0.72 0.12 40)'),
  ('money',       'Money',       'oklch(0.72 0.12 125)'),
  ('tech',        'Tech',        'oklch(0.72 0.12 220)'),
  ('history',     'History',     'oklch(0.72 0.12 30)'),
  ('science',     'Science',     'oklch(0.72 0.12 155)'),
  ('art',         'Art',         'oklch(0.72 0.12 350)');

-- Profiles
insert into profiles (id, name, role, age, avatar_color) values
  ('00000000-0000-0000-0000-000000000001', 'Reef',   'kid',    9,  '#4F7942'),
  ('00000000-0000-0000-0000-000000000002', 'Tommy',  'kid',    11, '#3B5FA0'),
  ('00000000-0000-0000-0000-000000000003', 'Parent', 'parent', null, '#171614');

-- Kid progress starting state
insert into kid_progress (kid_id, xp, level, streak_days) values
  ('00000000-0000-0000-0000-000000000001', 120, 2, 3),
  ('00000000-0000-0000-0000-000000000002', 210, 3, 5);

-- Traits for Reef
insert into traits (kid_id, trait_name, score) values
  ('00000000-0000-0000-0000-000000000001', 'Curiosity',        42),
  ('00000000-0000-0000-0000-000000000001', 'Critical Thinking',35),
  ('00000000-0000-0000-0000-000000000001', 'Problem Solving',  28),
  ('00000000-0000-0000-0000-000000000001', 'Resilience',       20),
  ('00000000-0000-0000-0000-000000000001', 'Adaptability',     15),
  ('00000000-0000-0000-0000-000000000001', 'Independence',     18);

-- Traits for Tommy
insert into traits (kid_id, trait_name, score) values
  ('00000000-0000-0000-0000-000000000002', 'Curiosity',        55),
  ('00000000-0000-0000-0000-000000000002', 'Critical Thinking',48),
  ('00000000-0000-0000-0000-000000000002', 'Problem Solving',  40),
  ('00000000-0000-0000-0000-000000000002', 'Resilience',       30),
  ('00000000-0000-0000-0000-000000000002', 'Adaptability',     25),
  ('00000000-0000-0000-0000-000000000002', 'Independence',     35);

-- Lessons for Reef
insert into lessons (id, title, subject_id, assigned_to, status, why_now, xp_reward, order_index) values
  ('reef-geo-1',   'Why every map lies',    'geography',  '00000000-0000-0000-0000-000000000001', 'pending',  'Strong curiosity score — good time to challenge assumptions.',  50, 1),
  ('reef-write-1', 'Finish what you start', 'writing',    '00000000-0000-0000-0000-000000000001', 'pending',  'Reef abandoned 2 written answers — directly addresses that.',  50, 2),
  ('reef-phil-1',  'Are you still you?',    'philosophy', '00000000-0000-0000-0000-000000000001', 'approved', 'Great follow-on from last week''s identity discussion.',        60, 3);

-- Lessons for Tommy
insert into lessons (id, title, subject_id, assigned_to, status, why_now, xp_reward, order_index) values
  ('tommy-money-1','What is interest, really?',    'money', '00000000-0000-0000-0000-000000000002', 'pending',  'Tommy asked about saving last session — perfect timing.',    60, 1),
  ('tommy-tech-1', 'How computers make decisions', 'tech',  '00000000-0000-0000-0000-000000000002', 'approved', 'Strong problem-solving — logic gates will come naturally.',  50, 2);

-- Steps: reef-geo-1
insert into lesson_steps (lesson_id, step_order, type, content) values
  ('reef-geo-1', 1, 'Read', '{"text": "Every map you have ever seen is a lie. Not a bad lie — a necessary one. The Earth is round. Paper is flat. Something always has to give."}'),
  ('reef-geo-1', 2, 'Multiple choice', '{"question": "A map that keeps the shapes of countries correct will…", "options": ["…also keep their sizes correct", "…distort their sizes", "…only work near the equator", "…show the Earth perfectly"], "correct": 1}'),
  ('reef-geo-1', 3, 'Drag to match', '{"question": "Match each map type to what it sacrifices.", "pairs": [["Mercator", "Distorts size near poles"], ["Peters", "Distorts shape"], ["Globe", "Distorts nothing — but cannot fit in a pocket"]]}'),
  ('reef-geo-1', 4, 'Interactive', '{"prompt": "Drag the slider from the equator to the North Pole and watch how Greenland grows. At the equator it is roughly the size of Algeria. At the top — it looks bigger than Africa."}'),
  ('reef-geo-1', 5, 'Written answer', '{"question": "If every map lies, which lie would you choose — and why?", "note": "No right answer. Assessed for reasoning."}');

-- Steps: reef-write-1
insert into lesson_steps (lesson_id, step_order, type, content) values
  ('reef-write-1', 1, 'Read', '{"text": "The hardest sentence to write is the last one. Starting is easy — your brain is full of ideas. Finishing means making a choice: this is what I actually think."}'),
  ('reef-write-1', 2, 'Multiple choice', '{"question": "Why do people usually abandon a piece of writing?", "options": ["They run out of words", "They are not sure what they really think yet", "They forget what they were writing about", "Writing is too hard"], "correct": 1}'),
  ('reef-write-1', 3, 'Drag to order', '{"question": "Put these parts of a good paragraph in order.", "items": ["Start with a clear claim", "Give one example or reason", "Explain why that example matters", "End with one sharp sentence"]}'),
  ('reef-write-1', 4, 'Written answer', '{"question": "Finish this sentence in exactly one more sentence: The most interesting thing about a ship is…", "note": "Assessed for completion and specificity."}'),
  ('reef-write-1', 5, 'Socratic', '{"question": "What is the difference between stopping because you are done and stopping because you are stuck?"}');

-- Steps: reef-phil-1
insert into lesson_steps (lesson_id, step_order, type, content) values
  ('reef-phil-1', 1, 'Read', '{"text": "You have changed a lot since you were 4. Different size, different thoughts, different favourite food. So — are you the same person? Or did that kid just turn into you?"}'),
  ('reef-phil-1', 2, 'Multiple choice', '{"question": "What makes you you over time?", "options": ["Your body — same physical person", "Your memories — you remember being that kid", "Your personality — similar way of thinking", "All of these, somehow"], "correct": 3}'),
  ('reef-phil-1', 3, 'Drag to order', '{"question": "Order these from most important to staying you to least important.", "items": ["Your memories", "Your body", "Your name", "Your relationships"]}'),
  ('reef-phil-1', 4, 'Interactive', '{"prompt": "Tap each year marker. See what changed and what stayed the same. Reef at 4 → Reef at 7 → Reef at 9. Which version feels most like you?"}'),
  ('reef-phil-1', 5, 'Written answer', '{"question": "If you lost all your memories tomorrow but kept your personality — would you still be you?", "note": "No right answer. Claude gives a follow-up question."}');

-- Steps: tommy-money-1
insert into lesson_steps (lesson_id, step_order, type, content) values
  ('tommy-money-1', 1, 'Read', '{"text": "An ancient king asked his mathematician for a reward. One grain of rice on square one of the chessboard. Two on square two. Four on square three. Double each time. The king laughed. Then he lost his kingdom."}'),
  ('tommy-money-1', 2, 'Multiple choice', '{"question": "By square 64, roughly how much rice would that be?", "options": ["About a truckload", "Enough to fill a football stadium", "More rice than has ever been grown on Earth", "About 1,000 tonnes"], "correct": 2}'),
  ('tommy-money-1', 3, 'Interactive', '{"prompt": "Move the interest rate slider (1-15%) and the years slider (1-30). Watch the bar chart. At what point does the line start to curve sharply upward?"}'),
  ('tommy-money-1', 4, 'Drag to match', '{"question": "Match each term to its definition.", "pairs": [["Principal", "The money you start with"], ["Interest", "The extra you earn"], ["Compound", "When interest earns interest"], ["Simple", "Interest only on the original amount"]]}'),
  ('tommy-money-1', 5, 'Written answer', '{"question": "If you had 100 and could either spend it today or save it at 8% for 10 years — what would you actually do, and why?", "note": "Assessed for reasoning, not the right financial answer."}');

-- Steps: tommy-tech-1
insert into lesson_steps (lesson_id, step_order, type, content) values
  ('tommy-tech-1', 1, 'Read', '{"text": "Every app you have ever used is just a very long chain of yes/no questions. Is the password correct? Yes — let them in. No — ask again. That is it. That is computing."}'),
  ('tommy-tech-1', 2, 'Multiple choice', '{"question": "What does an if/then statement do?", "options": ["Stores a number", "Makes a decision based on a condition", "Repeats something", "Connects to the internet"], "correct": 1}'),
  ('tommy-tech-1', 3, 'Drag to order', '{"question": "Build a login system. Put these steps in the right order.", "items": ["User types password", "Check if password matches stored version", "If yes — show home screen", "If no — show error and try again"]}'),
  ('tommy-tech-1', 4, 'Interactive', '{"prompt": "Follow the flowchart. Click each decision node and choose the branch. Try to reach Access granted in as few steps as possible."}'),
  ('tommy-tech-1', 5, 'Written answer', '{"question": "Design the if/then logic for a traffic light. What questions does it need to ask, and when?", "note": "Assessed for logical completeness."}');
