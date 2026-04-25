# Curio

> A smart, beautiful micro-learning app for Reef (9) and Tommy (11) — grown-up enough to take seriously, fun enough to keep coming back.

---

## What This Is

Curio is a homeschooling web app built for two boys. It delivers short, interactive lessons across a wide range of subjects, tracks their progress, and gives their parent a dashboard to review, approve, and generate new lessons. Lessons are AI-generated and personalised based on each kid's performance history.

The visual reference is **Brilliant** — confident, modern, not childish. It lives in the browser (laptop or tablet), not mobile.

---

## The Kids

| | Reef | Tommy |
|---|---|---|
| Age | 9 | 11 |
| Avatar | Green (#4F7942) | Blue (#3B5FA0) |

Both kids use the same lesson content, adapted in difficulty for their age.

---

## Subjects

Geography · History · Philosophy · Science · Tech · Music · Art · Economics · Money · Business · Reading & Writing

---

## Traits (Growth System)

Alongside subjects, kids develop six personal traits tracked over time:

- Curiosity
- Critical Thinking
- Problem Solving
- Resilience
- Adaptability
- Independence

---

## Gamification

- **XP + Levels** — earned by completing lessons
- **Streaks** — daily learning streaks shown with a flame icon

---

## Pages & Routes

| Route | What it is |
|---|---|
| `/` | Kid login — profile picker (no passcode needed), shows both kids' avatars |
| `/home` | Kid home — Level/XP bar, Start next lesson card, weekly goals |
| `/lesson/[id]` | Lesson player — 5-step interactive lesson |
| `/feedback` | Post-lesson feedback — fun rating, learned something?, difficulty |
| `/complete` | Lesson complete — XP animation, streak update, traits bump |
| `/parent` | Parent dashboard — lesson queue, generate lessons, completed history |

---

## Lesson Interactions

Each lesson has 5 steps, which can include any of:

1. **Read** — body text with Hebrew word translation on click (tap any word → popup with Hebrew)
2. **Multiple choice** — question with 4 options, feedback on answer
3. **Drag to order** — arrange items in the correct sequence
4. **Drag to match** — match pairs side by side
5. **Interactive diagram** — tap/drag to explore (e.g. a timeline scrubber)
6. **Written answer** — open-ended, assessed by AI with a follow-up
7. **Socratic** — deep question with no single correct answer, Claude responds

---

## Kid Flow

```
Login (pick profile) → Home → Start Lesson → [5 steps] → Feedback → Complete screen
```

---

## Parent Dashboard

The parent reviews and controls what lessons the kids see:

- **Lesson queue** — pending and approved lessons per kid, each with a "Why now" rationale
- **Preview** — open any lesson to see all steps before approving
- **Approve / Remove / Revoke** — control what appears on each kid's home screen
- **Generate** — AI generates a new personalised lesson based on the kid's recent performance (scores, fun rating, difficulty, subjects done)
- **Completed lessons** — full history with score %, time spent, step-by-step results, and the kid's feedback
- **Struggle panel** — lessons where score was under 70%, used to inform next lesson generation

---

## Design System

**Colors:**
- Background: `#F6F3EC` (warm off-white)
- Ink: `#16140F` (deep near-black)
- Ink secondary: `#3A3830`, `#6B685E`, `#9B988C`
- Line / border: `#E2DDCF`
- Card: `#FFFFFF`
- Lime (XP / progress): `oklch(0.86 0.17 120)`
- Violet (traits): `oklch(0.62 0.18 295)`
- Amber (streaks): `oklch(0.78 0.16 60)`
- Rose (errors / low scores): `oklch(0.78 0.12 20)`

**Typography:**
- Serif / editorial: `var(--font-serif)` — used for lesson titles, big headings
- Body / UI: `var(--font-body)` — used for everything else
- No emoji in icons — hand-tuned SVG line icons throughout

**Lesson background:** Colorful doodle illustrations (ship wheel, anchor, compass, hourglass, question marks, etc.) sit on the left and right margins of the lesson — bold enough to notice, clear of the content column.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + inline styles (design token system)
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude — lesson generation, written answer feedback, Hebrew word translation
- **Auth:** None (family-only app, profile picker only)

---

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | Kid and parent profiles |
| `subjects` | Subject reference (id, label, color) |
| `lessons` | Lesson queue per kid (pending / approved / completed) |
| `lesson_steps` | Individual steps within a lesson |
| `lesson_sessions` | A completed or in-progress lesson attempt |
| `step_responses` | Per-step answers and correctness |
| `lesson_feedback` | Post-lesson fun/difficulty/learned ratings |
| `traits` | Trait scores per kid |
| `kid_progress` | XP, level, streak per kid |

---

## API Routes

| Route | Purpose |
|---|---|
| `POST /api/lessons/generate` | AI generates a personalised new lesson for a kid |
| `POST /api/ai-feedback` | AI gives feedback on a written answer step |
| `POST /api/translate` | Translates a word to Hebrew for the in-lesson popup |

---

## How to Customise

- **Add a new subject:** Add a row to the `subjects` table in Supabase, then add it to the `SUBJECT_ICONS` map in `app/home/page.tsx`
- **Change kid names/ages:** Update the `profiles` table in Supabase — the app reads them dynamically
- **Adjust lesson difficulty:** The AI prompt in `app/api/lessons/generate/route.ts` includes kid age — edit the prompt to adjust tone or complexity
- **Add a new lesson step type:** Add it to `LessonStep['type']` in `lib/database.types.ts` and handle it in `app/lesson/[id]/page.tsx`

---

## Recent History

- **April 2026:** Initial build — full kid flow (login → lesson → complete), parent dashboard, AI lesson generation, Hebrew word translation, lesson feedback collection, completed lessons history
