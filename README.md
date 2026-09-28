# Workout Buddy

This is an app that allows you to track your workout routine throughout the week. Set split times and sets for different workouts. Allow yourself to train at your best capacity without having to remember every little thing!

**Live app:** https://shiny-sprite-1946cf.netlify.app/
**Demo video:** https://www.youtube.com/watch?v=VRARCRmZswE

## What it does

- **Register / log in / log out** with email and password (Supabase Auth).
- **Weekly schedule:** a card for each day (Mon–Sun). Click a day to create or edit its workout.
- **Splits (CRUD):** add exercises with sets, reps, and rest time; remove splits; rename or delete a workout.
- **Start workout:** step through a day's splits in order. Finishing a split starts a rest countdown (with +15s and skip options) before the next one.
- Data is private to each account, enforced with Supabase Row Level Security.

## Technologies used

- HTML, CSS, and vanilla JavaScript
- Supabase (database and authentication)
- Netlify (hosting)
- AI tools for building and debugging

## Setup instructions

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the contents of `supabase-schema.sql`.
3. Copy your Project URL and anon key (Project Settings → API) into `config.js`.
4. Open `index.html` in a browser, or deploy the folder to Netlify.g