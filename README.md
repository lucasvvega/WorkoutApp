<<<<<<< HEAD
# Splitline — Workout Tracker

A weekly workout planner: assign a different workout to each day of the week,
build it out of ordered "splits" (exercises), and run it with a built-in
rest timer that counts down between splits.

**Live app:** [add your Netlify link here]
**Demo video (YouTube, unlisted):** [add your video link here]

## What it does

- **Register / log in / log out** with email + password (Supabase Auth).
- **Weekly schedule** — a card for every day of the week (Mon–Sun); click a
  day to create or edit the workout assigned to it.
- **Splits (CRUD)** — add exercises to a workout with sets, reps, and a rest
  time in seconds; remove any split; rename or delete a whole workout.
- **Start workout** — runs through a day's splits in order. Finishing a split
  starts a countdown rest timer (with a "+15s" and "skip rest" option) before
  showing the next split, until the workout is complete.
- All data is private per-account, enforced with Supabase Row Level Security.

## Technologies used

- **Frontend:** HTML, CSS, vanilla JavaScript (no framework/build step)
- **Backend / database / auth:** [Supabase](https://supabase.com) — Postgres
  database + built-in email/password auth, accessed from the browser with
  `@supabase/supabase-js`
- **Hosting:** [Netlify](https://netlify.com)
- Built with the help of AI tools (see Hootcamp lectures) for scaffolding,
  debugging, and the Supabase schema/RLS policies.

## Project structure

```
index.html   – markup for the auth screen, schedule, editor, and run modal
style.css    – all styling
script.js    – app logic: auth, data loading, CRUD, and the workout runner
config.js    – your Supabase project URL + anon key (fill in, see below)
supabase-schema.sql – table definitions + Row Level Security policies
```

## Setup instructions (run it yourself)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
2. In the Supabase dashboard, open **SQL Editor → New query**, paste in the
   contents of `supabase-schema.sql`, and run it. This creates the
   `workouts` and `splits` tables and locks them down with Row Level
   Security so each user only sees their own data.
3. In **Project Settings → API**, copy your **Project URL** and **anon
   public** key into `config.js`:
   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```
4. (Optional, recommended for a class demo) In **Authentication → Providers
   → Email**, turn off "Confirm email" so test accounts can log in
   immediately after registering.
5. Open `index.html` in a browser (or run any static server, e.g.
   `npx serve .`) to try it locally.
6. **Deploy:** drag the project folder into
   [Netlify Drop](https://app.netlify.com/drop), or connect the GitHub repo
   to Netlify for git-based deploys. No build command is needed — it's a
   static site.

## Notes

- The `SUPABASE_ANON_KEY` is safe to expose in client-side code; it only
  grants the access allowed by the Row Level Security policies in
  `supabase-schema.sql`, not full database access.
- Each day currently holds one workout, which is what "align different
  workouts for different days" means here — e.g. Push on Monday, Pull on
  Tuesday, Legs on Thursday, and so on.
=======
# WorkoutApp
>>>>>>> 31e50fc7c0b6d1a0aa201113463fb8e896865a30
