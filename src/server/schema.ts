/**
 * Database migrations, applied in order by migrate() (see db.ts) and never
 * edited once shipped — add a new entry instead. Kept as TS strings rather
 * than .sql files so the dev server, the tests and scripts/admin.ts all load
 * them the same way. Each statement runs on its own (Neon's HTTP driver takes
 * one statement per query), but a migration's statements share a transaction.
 */
export const MIGRATIONS: { id: string; statements: string[] }[] = [
  {
    id: "001_auth_and_calendar",
    statements: [
      `create table users (
        id uuid primary key default gen_random_uuid(),
        email text not null unique check (email = lower(email)),
        name text not null check (char_length(name) between 1 and 80),
        password_hash text,
        created_at timestamptz not null default now()
      )`,
      `create table sessions (
        token_hash text primary key,
        user_id uuid not null references users(id) on delete cascade,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      )`,
      `create index sessions_user_idx on sessions (user_id)`,
      // One-time links for setting a password (new accounts, resets).
      `create table password_tokens (
        token_hash text primary key,
        user_id uuid not null references users(id) on delete cascade,
        expires_at timestamptz not null,
        used_at timestamptz
      )`,
      `create table login_attempts (
        id bigint generated always as identity primary key,
        email text not null,
        succeeded boolean not null,
        attempted_at timestamptz not null default now()
      )`,
      `create index login_attempts_email_idx on login_attempts (email, attempted_at)`,

      `create table calendars (
        id uuid primary key default gen_random_uuid(),
        name text not null check (char_length(name) between 1 and 80),
        color text not null,
        owner_id uuid not null references users(id),
        created_at timestamptz not null default now()
      )`,
      `create table calendar_members (
        calendar_id uuid not null references calendars(id) on delete cascade,
        user_id uuid not null references users(id) on delete cascade,
        role text not null check (role in ('viewer', 'editor', 'admin')),
        primary key (calendar_id, user_id)
      )`,
      `create index calendar_members_user_idx on calendar_members (user_id)`,

      // start_at/end_at are absolute instants. timezone is the IANA zone the
      // event was planned in: it decides the wall-clock day of all-day events
      // and how recurrences step across DST. end_at is exclusive.
      `create table events (
        id uuid primary key,
        calendar_id uuid not null references calendars(id) on delete cascade,
        title text not null check (char_length(title) between 1 and 200),
        description text,
        start_at timestamptz not null,
        end_at timestamptz not null,
        timezone text not null,
        all_day boolean not null default false,
        category text,
        status text not null default 'confirmed'
          check (status in ('confirmed', 'tentative', 'cancelled')),
        recurrence_rule text,
        recurrence_until timestamptz,
        exdates timestamptz[] not null default '{}',
        created_by uuid not null references users(id),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        version integer not null default 1,
        constraint events_positive_duration check (end_at > start_at)
      )`,
      // Range queries are "end_at > from and start_at < to" per calendar; past
      // events are what piles up, so lead with end_at to skip them.
      `create index events_calendar_range_idx on events (calendar_id, end_at, start_at)`,
      `create index events_recurring_idx on events (calendar_id) where recurrence_rule is not null`,
      `create table event_participants (
        event_id uuid not null references events(id) on delete cascade,
        user_id uuid not null references users(id) on delete cascade,
        primary key (event_id, user_id)
      )`,
      `create index event_participants_user_idx on event_participants (user_id)`,
    ],
  },
  {
    id: "002_job_titles_and_push",
    statements: [
      // Shown instead of the person's name across the calendar when set.
      `alter table users add column job_title text check (char_length(job_title) <= 60)`,
      // One row per browser/phone that accepted notifications. The endpoint
      // is unique per device; the keys encrypt the payload for that device.
      `create table push_subscriptions (
        endpoint text primary key,
        user_id uuid not null references users(id) on delete cascade,
        p256dh text not null,
        auth text not null,
        created_at timestamptz not null default now()
      )`,
      `create index push_subscriptions_user_idx on push_subscriptions (user_id)`,
    ],
  },
  {
    id: "003_app_lock",
    statements: [
      // Installed-app lock (see server/applock.ts): a 6-digit code (hashed)
      // and how each person prefers to unlock.
      `alter table users add column pin_hash text`,
      `alter table users add column pin_failures integer not null default 0`,
      `alter table users add column unlock_method text not null default 'pin'
         check (unlock_method in ('pin', 'passkey', 'password'))`,
      // App sessions only serve data while unlocked; the window slides forward
      // with every request, so ~5 minutes away from the app locks it again.
      `alter table sessions add column app_lock boolean not null default false`,
      `alter table sessions add column unlocked_until timestamptz`,
      // Face ID / fingerprint: one WebAuthn credential per device.
      `create table passkeys (
        id text primary key,
        user_id uuid not null references users(id) on delete cascade,
        public_key text not null,
        counter bigint not null default 0,
        transports text,
        device_name text,
        created_at timestamptz not null default now(),
        last_used_at timestamptz
      )`,
      `create index passkeys_user_idx on passkeys (user_id)`,
      // The pending WebAuthn challenge of a session (one at a time).
      `create table webauthn_challenges (
        session_hash text primary key references sessions(token_hash) on delete cascade,
        challenge text not null,
        expires_at timestamptz not null
      )`,
    ],
  },
  {
    id: "004_unlock_methods",
    statements: [
      // Several ways in at once (e.g. code + Face ID, one backing up the
      // other). Replaces users.unlock_method, which stays until the code that
      // reads it is gone from production, then can be dropped.
      `alter table users add column unlock_methods text[] not null default '{pin}'
         check (cardinality(unlock_methods) > 0
                and unlock_methods <@ array['pin', 'passkey', 'password']::text[])`,
      `update users set unlock_methods = array[unlock_method]`,
    ],
  },
  {
    id: "005_error_log",
    statements: [
      // Who sees the "Erros" page (set with `npm run admin -- error-viewer`).
      `alter table users add column can_see_errors boolean not null default false`,
      // Errors from visitors' browsers and from the server, one row per
      // distinct error (same fingerprint = same place in the code), counted.
      `create table error_reports (
        id uuid primary key default gen_random_uuid(),
        fingerprint text not null unique,
        source text not null check (source in ('browser', 'server')),
        message text not null,
        detail text,
        url text,
        user_agent text,
        count integer not null default 1,
        first_seen timestamptz not null default now(),
        last_seen timestamptz not null default now(),
        last_user_id uuid references users(id) on delete set null,
        resolved boolean not null default false
      )`,
      `create index error_reports_last_seen_idx on error_reports (last_seen desc)`,
    ],
  },
];
