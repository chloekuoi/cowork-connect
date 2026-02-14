# API Contract — Supabase Backend

**Last Updated:** 2026-02-06 (Phase 2)

---

## Tables Overview

| Table | RLS | Purpose |
|-------|-----|---------|
| `profiles` | Enabled | User profile data |
| `work_intents` | Enabled | Daily work intentions for discovery |
| `swipes` | Enabled | Swipe history (right/left) |
| `sessions` | Enabled | Co-working session records |
| `session_participants` | Enabled | Session participants and roles |

---

## Table: `profiles`

**Purpose:** Stores user profile information, linked to `auth.users`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | — | Primary key, matches `auth.users.id` |
| `email` | `TEXT` | Yes | `NULL` | User's email (from auth) |
| `username` | `TEXT` | No | — | Unique username (auto-generated if not set) |
| `name` | `TEXT` | Yes | `NULL` | Display name |
| `photo_url` | `TEXT` | Yes | `NULL` | Profile photo URL |
| `work_type` | `TEXT` | Yes | `NULL` | How they work (Freelancer, Remote Employee, etc.) |
| `interests` | `TEXT[]` | Yes | `NULL` | Array of interest tags |
| `bio` | `TEXT` | Yes | `NULL` | Short bio (not used in UI yet) |
| `onboarding_complete` | `BOOLEAN` | No | `FALSE` | Whether onboarding finished |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Last update time |

### Indexes
| Name | Columns | Type |
|------|---------|------|
| `profiles_pkey` | `id` | Primary Key |
| `profiles_username_key` | `username` | Unique |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can view all profiles | `SELECT` | `true` (public read) |
| Users can insert own profile | `INSERT` | `auth.uid() = id` |
| Users can update own profile | `UPDATE` | `auth.uid() = id` |

### Foreign Keys
| Column | References |
|--------|------------|
| `id` | `auth.users(id)` ON DELETE CASCADE |

---

## Table: `work_intents`

**Purpose:** Stores daily work intentions for the discovery feature

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `UUID` | No | — | FK to `profiles.id` |
| `task_description` | `TEXT` | No | — | What user is working on |
| `available_from` | `TIME` | No | — | Start of availability window |
| `available_until` | `TIME` | No | — | End of availability window |
| `work_style` | `TEXT` | No | — | One of: Deep focus, Happy to chat, Pomodoro fan, Flexible |
| `location_type` | `TEXT` | No | — | One of: Cafe, Library, Video Call, Anywhere |
| `location_name` | `TEXT` | Yes | `NULL` | Specific place name (optional) |
| `latitude` | `DOUBLE PRECISION` | No | — | User's latitude when intent was set |
| `longitude` | `DOUBLE PRECISION` | No | — | User's longitude when intent was set |
| `intent_date` | `DATE` | No | `CURRENT_DATE` | Date of the intent |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Last update time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `work_intents_pkey` | `id` |
| Unique | `work_intents_user_id_intent_date_key` | `(user_id, intent_date)` |
| Foreign Key | — | `user_id` → `profiles(id)` ON DELETE CASCADE |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_work_intents_date` | `intent_date` | Filter by date |
| `idx_work_intents_user_date` | `user_id, intent_date` | Lookup user's daily intent |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read all intents | `SELECT` | `true` | Discovery requires reading others' intents |
| Users can insert own intents | `INSERT` | `auth.uid() = user_id` | Only create your own |
| Users can update own intents | `UPDATE` | `auth.uid() = user_id` | Only edit your own |
| Users can delete own intents | `DELETE` | `auth.uid() = user_id` | Only delete your own |

---

## Table: `swipes`

**Purpose:** Records swipe actions for match detection

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `swiper_id` | `UUID` | No | — | FK to `profiles.id` (who swiped) |
| `swiped_id` | `UUID` | No | — | FK to `profiles.id` (who was swiped on) |
| `direction` | `TEXT` | No | — | `'right'` or `'left'` |
| `swipe_date` | `DATE` | No | `CURRENT_DATE` | Date of swipe |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `swipes_pkey` | `id` |
| Unique | `swipes_swiper_id_swiped_id_swipe_date_key` | `(swiper_id, swiped_id, swipe_date)` |
| Check | — | `direction IN ('right', 'left')` |
| Foreign Key | — | `swiper_id` → `profiles(id)` ON DELETE CASCADE |
| Foreign Key | — | `swiped_id` → `profiles(id)` ON DELETE CASCADE |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_swipes_swiper_date` | `swiper_id, swipe_date` | Get user's swipes for today |
| `idx_swipes_match_check` | `swiper_id, swiped_id, direction, swipe_date` | Efficient match lookup |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own swipes | `SELECT` | `auth.uid() = swiper_id OR auth.uid() = swiped_id` | See swipes where you are involved |
| Users can insert own swipes | `INSERT` | `auth.uid() = swiper_id` | Only record your own swipes |

**Note:** Users cannot see who swiped on them (privacy). Match detection happens via RPC.

---

## Table: `sessions`

**Purpose:** Stores co-working session lifecycle records for matches

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `match_id` | `UUID` | No | — | FK to `matches.id` |
| `initiated_by` | `UUID` | No | — | FK to `profiles.id` |
| `status` | `TEXT` | No | — | One of: `pending`, `active`, `declined`, `completed`, `cancelled` |
| `session_date` | `DATE` | No | `CURRENT_DATE` | Session date (day-level) |
| `scheduled_date` | `DATE` | No | `CURRENT_DATE` | Planned coworking date |
| `accepted_at` | `TIMESTAMPTZ` | Yes | `NULL` | When invitee accepted |
| `completed_at` | `TIMESTAMPTZ` | Yes | `NULL` | When session completed |
| `completed_ack` | `BOOLEAN` | Yes | `NULL` | True when both users locked in |
| `locked_by_initiator_at` | `TIMESTAMPTZ` | Yes | `NULL` | Initiator lock timestamp |
| `locked_by_invitee_at` | `TIMESTAMPTZ` | Yes | `NULL` | Invitee lock timestamp |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Last update time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `sessions_pkey` | `id` |
| Check | — | `status IN ('pending','active','declined','completed','cancelled')` |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_sessions_match_id` | `match_id` | Lookup sessions for a match |
| `idx_sessions_status` | `status` | Filter by active/pending |
| `idx_sessions_session_date` | `session_date` | Auto-complete stale sessions |
| `idx_sessions_scheduled_date` | `scheduled_date` | Filter by planned date |
| `idx_sessions_accepted_at` | `accepted_at` | Auto-cancel after 24h |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can read own sessions | `SELECT` | `EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = sessions.id AND sp.user_id = auth.uid())` |

### Foreign Keys
| Column | References |
|--------|------------|
| `match_id` | `matches(id)` ON DELETE CASCADE |
| `initiated_by` | `profiles(id)` ON DELETE CASCADE |

---

## Table: `session_participants`

**Purpose:** Links users to sessions with their role

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `session_id` | `UUID` | No | — | FK to `sessions.id` |
| `user_id` | `UUID` | No | — | FK to `profiles.id` |
| `role` | `TEXT` | No | — | One of: `initiator`, `invitee` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `session_participants_pkey` | `id` |
| Unique | `session_participants_session_id_user_id_key` | `(session_id, user_id)` |
| Check | — | `role IN ('initiator','invitee')` |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_session_participants_user_id` | `user_id` | Lookup sessions for a user |
| `idx_session_participants_session_id` | `session_id` | Lookup participants for a session |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can read own session participants | `SELECT` | `user_id = auth.uid()` |

### Foreign Keys
| Column | References |
|--------|------------|
| `session_id` | `sessions(id)` ON DELETE CASCADE |
| `user_id` | `profiles(id)` ON DELETE CASCADE |

---

## Table: `session_events`

**Purpose:** System events associated with a session (e.g., acceptance message)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `session_id` | `UUID` | No | — | FK to `sessions.id` |
| `event_type` | `TEXT` | No | — | Event type (e.g., `accepted`) |
| `message` | `TEXT` | No | — | Reserved for optional payload (empty for accepted) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `session_events_pkey` | `id` |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_session_events_session_id` | `session_id` | Lookup events for session |
| `idx_session_events_created_at` | `created_at` | Timeline ordering |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can read own session events | `SELECT` | `EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = session_events.session_id AND sp.user_id = auth.uid())` |

### Foreign Keys
| Column | References |
|--------|------------|
| `session_id` | `sessions(id)` ON DELETE CASCADE |

### Realtime: **ENABLED**

Supabase Realtime should be enabled on the `session_events` table. The client subscribes to `INSERT` events filtered by `session_id` for system messages.

---

## Functions (RPC)

### `check_match(p_swiper_id UUID, p_swiped_id UUID)`

**Purpose:** Check if a mutual match exists (both users swiped right on each other today)

**Returns:** `BOOLEAN`

**Security:** `SECURITY DEFINER` (runs with elevated privileges to read both users' swipes)

**Logic:**
```sql
SELECT EXISTS (
  SELECT 1 FROM swipes
  WHERE swiper_id = p_swiped_id      -- Other user swiped
  AND swiped_id = p_swiper_id        -- On current user
  AND direction = 'right'            -- Right swipe
  AND swipe_date = CURRENT_DATE      -- Today only
);
```

**Usage (from client):**
```typescript
const { data: isMatch } = await supabase
  .rpc('check_match', {
    p_swiper_id: currentUserId,
    p_swiped_id: swipedUserId,
  });
```

---

### `create_session(p_match_id UUID, p_initiator_id UUID, p_scheduled_date DATE)`

**Purpose:** Create a pending session for a match with a scheduled date (multiple pending invites allowed)

**Returns:** `UUID` (new session ID)

**Security:** `SECURITY DEFINER`

---

### `respond_to_session(p_session_id UUID, p_user_id UUID, p_response TEXT)`

**Purpose:** Invitee accepts or declines a pending session (accept inserts a session_event)

**Returns:** `VOID`

**Security:** `SECURITY DEFINER`

---

### `complete_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Manually complete an active session (participant only, legacy)

**Returns:** `VOID`

**Security:** `SECURITY DEFINER`

---

### `cancel_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Cancel a pending session (initiator only)

**Returns:** `VOID`

**Security:** `SECURITY DEFINER`

---

### `auto_complete_sessions()`

**Purpose:** Backward-compatible alias for `auto_cancel_sessions()`

**Returns:** `INTEGER` (count of completed sessions)

**Security:** `SECURITY DEFINER`

---

### `lock_in_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Record the user's lock-in; when both users lock, session is completed

**Returns:** `VOID`

**Security:** `SECURITY DEFINER`

---

### `auto_cancel_sessions()`

**Purpose:** Auto-cancel active sessions not fully locked after 24 hours

**Returns:** `INTEGER` (count of cancelled sessions)

**Security:** `SECURITY DEFINER`

---

## Triggers

### `profiles` — Auto-create on signup

**Status:** ⚠️ MAY NEED MANUAL SETUP (clickops)

If not already configured, create this trigger to auto-create profile rows:

```sql
-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    'user_' || REPLACE(NEW.id::TEXT, '-', '')::TEXT,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Storage Buckets

### `avatars` (NOT YET IMPLEMENTED)

**Status:** Planned for Phase 3

**Future Configuration:**
| Setting | Value |
|---------|-------|
| Public | No |
| File size limit | 5MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |

**Future Policies:**
```sql
-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone can view avatars
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

---

## SQL Files Committed

| File | Purpose | Status |
|------|---------|--------|
| `supabase/001_profiles_table.sql` | Profiles table + trigger (Phase 1) | ✅ Committed |
| `supabase/002_discovery_tables.sql` | work_intents, swipes, check_match (Phase 2) | ✅ Committed |

### Run Order

Execute in Supabase SQL Editor in this order:
1. `001_profiles_table.sql` — Creates profiles table, RLS, and signup trigger
2. `002_discovery_tables.sql` — Creates discovery tables and match function

---

## Clickops Audit

Items that may have been configured via Supabase Dashboard:

| Item | Location | Status |
|------|----------|--------|
| `profiles` table | Table Editor | ✅ Now documented in `001_profiles_table.sql` |
| `profiles` RLS policies | Auth → Policies | ✅ Now documented in `001_profiles_table.sql` |
| `handle_new_user` trigger | Database → Triggers | ✅ Now documented in `001_profiles_table.sql` |
| Auth email templates | Auth → Email Templates | ⚠️ Not committed (use defaults) |
| Auth redirect URLs | Auth → URL Configuration | ⚠️ Not committed (document if customized) |

### To Verify Dashboard Matches SQL

1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT * FROM pg_tables WHERE schemaname = 'public';`
3. Verify tables match SQL files
4. Run: `SELECT * FROM pg_policies;`
5. Verify policies match SQL files

---

## TypeScript Type Mapping

| Supabase Type | TypeScript Type | Notes |
|---------------|-----------------|-------|
| `UUID` | `string` | |
| `TEXT` | `string` | |
| `TEXT[]` | `string[]` | |
| `BOOLEAN` | `boolean` | |
| `DATE` | `string` | Format: `YYYY-MM-DD` |
| `TIME` | `string` | Format: `HH:MM:SS` |
| `TIMESTAMPTZ` | `string` | ISO 8601 format |
| `DOUBLE PRECISION` | `number` | |

---

## API Endpoints Used

All via `@supabase/supabase-js` client:

### Auth
| Method | Purpose |
|--------|---------|
| `supabase.auth.signUp()` | Create account |
| `supabase.auth.signInWithPassword()` | Login |
| `supabase.auth.signOut()` | Logout |
| `supabase.auth.getSession()` | Get current session |
| `supabase.auth.onAuthStateChange()` | Listen for auth changes |

### Database
| Method | Table | Purpose |
|--------|-------|---------|
| `supabase.from('profiles').select()` | profiles | Fetch profile |
| `supabase.from('profiles').upsert()` | profiles | Create/update profile |
| `supabase.from('work_intents').select()` | work_intents | Fetch intents |
| `supabase.from('work_intents').upsert()` | work_intents | Create/update intent |
| `supabase.from('swipes').select()` | swipes | Get user's swipes |
| `supabase.from('swipes').insert()` | swipes | Record swipe |
| `supabase.rpc('check_match')` | — | Check for mutual match |

---

## Data Flow Diagrams

### Discovery Flow
```
1. User opens Discover tab
   ↓
2. GET work_intents WHERE user_id = me AND intent_date = today
   ↓
3. If no intent → Show IntentScreen
   ↓
4. User submits intent
   ↓
5. UPSERT work_intents (user_id, intent_date)
   ↓
6. GET work_intents
   WHERE intent_date = today
   AND user_id != me
   JOIN profiles ON user_id
   ↓
7. Client filters by distance (Haversine)
   ↓
8. GET swipes WHERE swiper_id = me AND swipe_date = today
   ↓
9. Client excludes already-swiped users
   ↓
10. Display card stack
```

### Swipe + Match Flow
```
1. User swipes right on profile X
   ↓
2. INSERT swipes (swiper_id=me, swiped_id=X, direction='right')
   ↓
3. RPC check_match(me, X)
   ↓
4. Function checks: EXISTS swipe WHERE swiper=X, swiped=me, direction='right', today
   ↓
5. If true → Return match, show alert
   ↓
6. If false → Continue to next card
```

---

## Security Notes

1. **RLS is enabled on all tables** — No anonymous access
2. **Swipes are private** — Users can't see who swiped on them
3. **Match check uses SECURITY DEFINER** — Bypasses RLS to check both sides
4. **Location data is stored** — Consider privacy policy implications
5. **No rate limiting** — Consider adding for production
6. **Anon key is publishable** — Safe to include in client code

---
---

# Phase 3 Additions

**Added:** 2026-02-07

---

## Tables Overview (Updated)

| Table | RLS | Purpose | Phase |
|-------|-----|---------|-------|
| `profiles` | Enabled | User profile data | 1 |
| `work_intents` | Enabled | Daily work intentions for discovery | 2 |
| `swipes` | Enabled | Swipe history (right/left) | 2 |
| `matches` | Enabled | Persistent mutual matches | **3** |
| `messages` | Enabled | Chat messages between matched users | **3** |

---

## Table: `matches`

**Purpose:** Stores persistent match records when two users mutually swipe right

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `user1_id` | `UUID` | No | — | FK to `profiles.id` (lower UUID of the pair) |
| `user2_id` | `UUID` | No | — | FK to `profiles.id` (higher UUID of the pair) |
| `matched_at` | `TIMESTAMPTZ` | No | `NOW()` | When the match was created |
| `user1_last_read_at` | `TIMESTAMPTZ` | No | `NOW()` | Last time user1 read this chat |
| `user2_last_read_at` | `TIMESTAMPTZ` | No | `NOW()` | Last time user2 read this chat |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `matches_pkey` | `id` |
| Unique | `matches_user_pair_key` | `(user1_id, user2_id)` |
| Check | `matches_different_users` | `user1_id <> user2_id` |
| Foreign Key | — | `user1_id` → `profiles(id)` ON DELETE CASCADE |
| Foreign Key | — | `user2_id` → `profiles(id)` ON DELETE CASCADE |

### Business Rules

- **User ordering:** `user1_id` is always the lower UUID value. The `create_match` function enforces this ordering. This prevents `(A,B)` and `(B,A)` from being stored as separate rows.
- **One match per pair:** The unique constraint on `(user1_id, user2_id)` prevents duplicate matches.
- **Lifecycle:** Matches are permanent for MVP. No unmatch or delete from UI.
- **Last read tracking:** `user1_last_read_at` and `user2_last_read_at` default to `matched_at` on creation, updated via `mark_chat_read` RPC.

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_matches_user1` | `user1_id` | Find matches for a user |
| `idx_matches_user2` | `user2_id` | Find matches for a user |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own matches | `SELECT` | `auth.uid() = user1_id OR auth.uid() = user2_id` | Only see your own matches |

**Note:** No INSERT/UPDATE/DELETE policies for direct client access. All mutations go through SECURITY DEFINER RPC functions (`create_match`, `mark_chat_read`).

### UI Assumptions

- Frontend can rely on `user1_id < user2_id` ordering to determine which `last_read_at` column belongs to the current user
- Frontend can join with `profiles` on `user1_id` or `user2_id` to get the other user's info
- `matched_at` is used as the initial `last_read_at` value (messages before match creation are impossible)

---

## Table: `messages`

**Purpose:** Stores individual chat messages between matched users

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `match_id` | `UUID` | No | — | FK to `matches.id` |
| `sender_id` | `UUID` | No | — | FK to `profiles.id` (who sent the message) |
| `content` | `TEXT` | No | — | Message text content |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | When message was sent |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `messages_pkey` | `id` |
| Foreign Key | — | `match_id` → `matches(id)` ON DELETE CASCADE |
| Foreign Key | — | `sender_id` → `profiles(id)` ON DELETE CASCADE |
| Check | `messages_content_not_empty` | `TRIM(content) <> ''` |

### Business Rules

- **Messages are immutable:** No editing or deleting messages for MVP.
- **Content must not be empty:** CHECK constraint enforces non-empty trimmed content.
- **Ordering:** Messages are always fetched ordered by `created_at ASC` (oldest first).
- **No pagination:** All messages for a match are fetched at once (acceptable for MVP).

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_messages_match_id` | `match_id` | Fetch messages for a conversation |
| `idx_messages_match_created` | `match_id, created_at` | Ordered fetch + last message lookup |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read messages for own matches | `SELECT` | `match_id IN (SELECT id FROM matches WHERE auth.uid() = user1_id OR auth.uid() = user2_id)` | Only read messages in your conversations |
| Users can insert messages to own matches as themselves | `INSERT` | `auth.uid() = sender_id AND match_id IN (SELECT id FROM matches WHERE auth.uid() = user1_id OR auth.uid() = user2_id)` | Only send as yourself to your matches |

### Realtime: **ENABLED**

Supabase Realtime must be enabled on the `messages` table to support live chat. The client subscribes to `INSERT` events filtered by `match_id`.

### UI Assumptions

- Frontend can rely on `created_at` ordering for display
- Frontend uses `sender_id` to determine sent vs received styling
- Frontend subscribes to Realtime `INSERT` events on `messages` filtered by `match_id` for live updates
- No message IDs are shown to users (internal only)

---

## Functions (RPC) — Phase 3

### `create_match(p_user1 UUID, p_user2 UUID)`

**Purpose:** Create a persistent match record with properly ordered user IDs

**Returns:** `UUID` (the match ID)

**Security:** `SECURITY DEFINER` (bypasses RLS to insert into matches table)

**Logic:**
```
1. Order user IDs: u1 = LEAST(p_user1, p_user2), u2 = GREATEST(p_user1, p_user2)
2. INSERT INTO matches (user1_id, user2_id) VALUES (u1, u2) ON CONFLICT DO NOTHING
3. If insert succeeded → return new match id
4. If conflict (already exists) → SELECT and return existing match id
```

**Usage (from client):**
```typescript
const { data: matchId } = await supabase
  .rpc('create_match', {
    p_user1: currentUserId,
    p_user2: otherUserId,
  });
```

---

### `mark_chat_read(p_match_id UUID, p_user_id UUID)`

**Purpose:** Update the last_read_at timestamp for a user in a match

**Returns:** `void`

**Security:** `SECURITY DEFINER` (bypasses RLS to update matches table)

**Logic:**
```
1. Check if p_user_id is user1_id or user2_id in the match
2. If user1 → UPDATE matches SET user1_last_read_at = NOW() WHERE id = p_match_id
3. If user2 → UPDATE matches SET user2_last_read_at = NOW() WHERE id = p_match_id
4. If neither → no-op (user not in match)
```

**Usage (from client):**
```typescript
await supabase.rpc('mark_chat_read', {
  p_match_id: matchId,
  p_user_id: currentUserId,
});
```

---

## Updated API Endpoints

### Database — Phase 3 Additions

| Method | Table | Purpose |
|--------|-------|---------|
| `supabase.from('matches').select()` | matches | Fetch user's matches |
| `supabase.from('messages').select()` | messages | Fetch messages for a match |
| `supabase.from('messages').insert()` | messages | Send a message |
| `supabase.rpc('create_match')` | — | Create match on mutual swipe |
| `supabase.rpc('mark_chat_read')` | — | Update last read timestamp |

### Realtime — Phase 3

| Channel | Event | Filter | Purpose |
|---------|-------|--------|---------|
| `messages:{matchId}` | `INSERT` | `match_id=eq.{matchId}` | Live incoming messages in chat |

---

## Updated Data Flow Diagrams

### Match Creation Flow (Phase 3)
```
1. User B swipes right on User A
   ↓
2. INSERT swipes (swiper=B, swiped=A, direction='right')
   ↓
3. RPC check_match(B, A) → true (A already swiped right on B)
   ↓
4. RPC create_match(B, A) → orders as (LEAST, GREATEST) → inserts match row
   ↓
5. Returns matchId to client
   ↓
6. MatchModal shown with matchId, User A profile, User B profile
```

### Chat Flow (Phase 3)
```
1. User opens chat for match_id
   ↓
2. RPC mark_chat_read(match_id, user_id) → updates last_read_at
   ↓
3. SELECT messages WHERE match_id = X ORDER BY created_at ASC
   ↓
4. Subscribe to Realtime INSERT on messages WHERE match_id = X
   ↓
5. User types message and taps send
   ↓
6. INSERT messages (match_id, sender_id, content)
   ↓
7. Realtime delivers to other user's subscription
   ↓
8. On leave: unsubscribe from channel
```

### Unread Count Flow (Phase 3)
```
1. Matches tab gains focus
   ↓
2. For each match where user is user1 or user2:
   - Get user's last_read_at (user1_last_read_at or user2_last_read_at)
   - Count messages WHERE created_at > last_read_at AND sender_id != user
   ↓
3. Sum = total unread count → set as tab badge
```

---

## SQL Files — Phase 3

| File | Purpose | Status |
|------|---------|--------|
| `supabase/001_profiles_table.sql` | Profiles table + trigger (Phase 1) | ✅ Committed |
| `supabase/002_discovery_tables.sql` | work_intents, swipes, check_match (Phase 2) | ✅ Committed |
| `supabase/003_matching_tables.sql` | matches, messages, create_match, mark_chat_read (Phase 3) | 📋 To be created |

### Run Order

Execute in Supabase SQL Editor in this order:
1. `001_profiles_table.sql`
2. `002_discovery_tables.sql`
3. `003_matching_tables.sql`

---

## To Be Confirmed

| Item | Question | Impact |
|------|----------|--------|
| Message length limit | Should there be a max character count? | CHECK constraint on content length |
| Realtime connection limits | How many concurrent subscriptions does Supabase free tier support? | May need connection pooling |
| Match notification for first user | When User A swiped first and User B triggers the match, only User B sees the modal. Should User A be notified? | Would need push notifications (deferred) |

---

## Phase 3 Security Notes

1. **Matches use SECURITY DEFINER functions** — No direct INSERT by clients, prevents spoofed matches
2. **Messages RLS checks match membership** — Users can only read/write messages for their own matches
3. **No message editing or deletion** — Immutable messages prevent tampering
4. **Content validation** — CHECK constraint prevents empty messages at the database level
5. **Realtime filtered by match_id** — Users only subscribe to their own conversations

---
---

# Phase 4 Additions

**Added:** 2026-02-08

---

## Tables Overview (Updated)

| Table | RLS | Purpose | Phase |
|-------|-----|---------|-------|
| `profiles` | Enabled | User profile data | 1 |
| `work_intents` | Enabled | Daily work intentions for discovery | 2 |
| `swipes` | Enabled | Swipe history (right/left) | 2 |
| `matches` | Enabled | Persistent mutual matches | 3 |
| `messages` | Enabled | Chat messages between matched users | 3 |
| `sessions` | Enabled | Co-working session records with lifecycle status | **4** |
| `session_participants` | Enabled | Links users to sessions with role | **4** |
| `session_events` | Enabled | System events for session timeline | **4** |

---

## Table: `sessions`

**Purpose:** Stores co-working session records between matched users, tracking the full lifecycle from invitation to completion.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `match_id` | `UUID` | No | — | FK to `matches.id` |
| `initiated_by` | `UUID` | No | — | FK to `profiles.id` (who sent the invite) |
| `status` | `TEXT` | No | `'pending'` | One of: pending, active, declined, completed, cancelled |
| `session_date` | `DATE` | No | `CURRENT_DATE` | Date the session is for |
| `scheduled_date` | `DATE` | No | `CURRENT_DATE` | Planned coworking date |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | When the invite was sent |
| `accepted_at` | `TIMESTAMPTZ` | Yes | `NULL` | When the invitee accepted |
| `completed_at` | `TIMESTAMPTZ` | Yes | `NULL` | When the session ended |
| `completed_ack` | `BOOLEAN` | Yes | `NULL` | True when both users locked in |
| `locked_by_initiator_at` | `TIMESTAMPTZ` | Yes | `NULL` | Initiator lock timestamp |
| `locked_by_invitee_at` | `TIMESTAMPTZ` | Yes | `NULL` | Invitee lock timestamp |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `sessions_pkey` | `id` |
| Foreign Key | — | `match_id` → `matches(id)` ON DELETE CASCADE |
| Foreign Key | — | `initiated_by` → `profiles(id)` ON DELETE CASCADE |
| Check | `sessions_status_check` | `status IN ('pending', 'active', 'declined', 'completed', 'cancelled')` |

### Business Rules

- **Multiple pending invites allowed:** No one-per-user constraint.
- **Status transitions:**
  - `pending` → `active` (via `respond_to_session` with 'accept')
  - `pending` → `declined` (via `respond_to_session` with 'decline')
  - `pending` → `cancelled` (via `cancel_session`, initiator only)
  - `active` → `completed` (when both users lock in)
  - `active` → `cancelled` (via `auto_cancel_sessions` after 24h)
- **Invalid transitions:** Any other status change is rejected by the RPC functions.
- **Scheduled date:** Provided at creation. Backfilled from `session_date` for older rows.
- **Auto-cancel:** Sessions with status='active' and accepted_at older than 24 hours are cancelled if not fully locked.
- **Lifecycle:** No reactivation. Once a session is completed, declined, or cancelled, it is final.

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_sessions_match` | `match_id` | Find sessions for a match |
| `idx_sessions_status` | `status` | Filter by session status (for auto-complete query) |
| `idx_sessions_initiated_by` | `initiated_by` | Find sessions initiated by a user |
| `idx_sessions_scheduled_date` | `scheduled_date` | Filter by planned date |
| `idx_sessions_accepted_at` | `accepted_at` | Auto-cancel after 24h |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read sessions for own matches | `SELECT` | `match_id IN (SELECT id FROM matches WHERE auth.uid() = user1_id OR auth.uid() = user2_id)` | Only see sessions in your own matches |

**Note:** No INSERT/UPDATE/DELETE policies for direct client access. All mutations go through SECURITY DEFINER RPC functions.

### Realtime: **ENABLED**

Supabase Realtime must be enabled on the `sessions` table. The client subscribes to `UPDATE` events filtered by `id` to receive session status changes.
Realtime should also be enabled on `session_events` for system messages.

### UI Assumptions

- Frontend can determine the invitee by checking which user in the match is NOT `initiated_by`
- Frontend uses `status` field to determine which SessionRequestCard variant to render
- Frontend uses `created_at` to position session cards in the chat timeline
- `accepted_at` is used as the start time for lock-in eligibility
- Dual-lock UI uses lock timestamps to display each user's state

---

## Table: `session_participants`

**Purpose:** Links users to sessions with their role. Supports future expansion to group sessions (Phase 5+).

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `session_id` | `UUID` | No | — | FK to `sessions.id` |
| `user_id` | `UUID` | No | — | FK to `profiles.id` |
| `role` | `TEXT` | No | — | `'initiator'` or `'invitee'` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | When this participant was added |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `session_participants_pkey` | `id` |
| Unique | `session_participants_session_user_key` | `(session_id, user_id)` |
| Foreign Key | — | `session_id` → `sessions(id)` ON DELETE CASCADE |
| Foreign Key | — | `user_id` → `profiles(id)` ON DELETE CASCADE |
| Check | `session_participants_role_check` | `role IN ('initiator', 'invitee')` |

### Business Rules

- **Two participants per session:** `create_session` inserts exactly two rows (initiator + invitee).
- **Roles are immutable:** Once set, role does not change.
- **Derived from match:** Both participants are determined from the `matches` table (user1_id and user2_id). The initiator is `initiated_by`, the other is the invitee.

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_session_participants_session` | `session_id` | Find participants for a session |
| `idx_session_participants_user` | `user_id` | Find sessions a user is part of |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own session participations | `SELECT` | `auth.uid() = user_id` | Only see your own participations |

**Note:** All mutations go through SECURITY DEFINER RPC functions.

---

## Table: `session_events`

**Purpose:** System events associated with a session (e.g., acceptance message)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `session_id` | `UUID` | No | — | FK to `sessions.id` |
| `event_type` | `TEXT` | No | — | Event type (e.g., `accepted`) |
| `message` | `TEXT` | No | — | Reserved for optional payload (empty for accepted) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own session events | `SELECT` | `EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = session_events.session_id AND sp.user_id = auth.uid())` | Only see events for your sessions |

### Realtime: **ENABLED**

Supabase Realtime must be enabled on `session_events`. Clients subscribe to INSERT events filtered by `session_id`.

---

## Functions (RPC) — Phase 4

### `create_session(p_match_id UUID, p_initiator_id UUID, p_scheduled_date DATE)`

**Purpose:** Create a new pending invite between matched users with a planned date.

**Returns:** `UUID` (the session ID) or raises an exception.

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. Verify p_initiator_id is user1_id or user2_id in the match
2. Determine the invitee (the other user in the match)
3. INSERT INTO sessions (match_id, initiated_by, status, session_date, scheduled_date)
4. INSERT two session_participants rows (initiator + invitee)
5. RETURN new session id
```

**Usage (from client):**
```typescript
const { data: sessionId, error } = await supabase
  .rpc('create_session', {
    p_match_id: matchId,
    p_initiator_id: currentUserId,
    p_scheduled_date: selectedDate,
  });
```

---

### `respond_to_session(p_session_id UUID, p_user_id UUID, p_response TEXT)`

**Purpose:** Accept or decline a pending session invitation.

**Returns:** `void`

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. SELECT session WHERE id = p_session_id AND status = 'pending'
2. If not found → RAISE EXCEPTION 'Session not found or not pending'
3. Verify p_user_id is NOT initiated_by (must be the invitee)
4. If p_response = 'accept':
   - UPDATE sessions SET status = 'active', accepted_at = NOW() WHERE id = p_session_id
   - INSERT INTO session_events (session_id, event_type, message) VALUES (p_session_id, 'accepted', '')
5. If p_response = 'decline':
   - UPDATE sessions SET status = 'declined' WHERE id = p_session_id
6. Otherwise → RAISE EXCEPTION 'Invalid response'
```

**Usage (from client):**
```typescript
await supabase.rpc('respond_to_session', {
  p_session_id: sessionId,
  p_user_id: currentUserId,
  p_response: 'accept', // or 'decline'
});
```

---

### `complete_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Manually end an active session.

**Returns:** `void`

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. SELECT session WHERE id = p_session_id AND status = 'active'
2. If not found → RAISE EXCEPTION 'Session not found or not active'
3. Verify p_user_id is a participant (via session_participants)
4. UPDATE sessions SET status = 'completed', completed_at = NOW() WHERE id = p_session_id
```

**Usage (from client):**
```typescript
await supabase.rpc('complete_session', {
  p_session_id: sessionId,
  p_user_id: currentUserId,
});
```

---

### `cancel_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Cancel a pending session (initiator only).

**Returns:** `void`

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. SELECT session WHERE id = p_session_id AND status = 'pending'
2. If not found → RAISE EXCEPTION 'Session not found or not pending'
3. Verify p_user_id = initiated_by (only initiator can cancel)
4. UPDATE sessions SET status = 'cancelled' WHERE id = p_session_id
```

**Usage (from client):**
```typescript
await supabase.rpc('cancel_session', {
  p_session_id: sessionId,
  p_user_id: currentUserId,
});
```

---

### `auto_cancel_sessions()`

**Purpose:** Cancel active sessions not fully locked after 24 hours.

**Returns:** `INTEGER` (number of sessions cancelled)

**Security:** `SECURITY DEFINER`

**Usage (from client):**
```typescript
await supabase.rpc('auto_cancel_sessions');
```

---

## Updated API Endpoints

### Database — Phase 4 Additions

| Method | Table | Purpose |
|--------|-------|---------|
| `supabase.from('sessions').select()` | sessions | Fetch sessions for a match |
| `supabase.from('session_participants').select()` | session_participants | Fetch user's sessions |
| `supabase.rpc('create_session')` | — | Create a session invitation |
| `supabase.rpc('respond_to_session')` | — | Accept or decline a session |
| `supabase.rpc('complete_session')` | — | Manually end a session |
| `supabase.rpc('cancel_session')` | — | Cancel a pending session |
| `supabase.rpc('lock_in_session')` | — | Record user's lock-in |
| `supabase.rpc('auto_cancel_sessions')` | — | Auto-cancel stale sessions |

### Realtime — Phase 4

| Channel | Event | Filter | Purpose |
|---------|-------|--------|---------|
| `sessions` | UPDATE | `id=eq.<session_id>` | Session status updates |
| `session_events` | INSERT | `session_id=eq.<session_id>` | System messages |
| `sessions:{sessionId}` | `UPDATE` | `id=eq.{sessionId}` | Session status changes (accept, decline, complete) |

---

## Updated Data Flow Diagrams

### Session Invitation Flow (Phase 4)
```
1. User A taps "Start Session" in chat with User B
   ↓
2. RPC create_session(match_id, User A)
   ↓
3. Function checks: neither user has pending/active session
   ↓
4. INSERT sessions (match_id, initiated_by=A, status='pending')
   ↓
5. INSERT session_participants: (session, A, 'initiator'), (session, B, 'invitee')
   ↓
6. Return session id → client renders session card in chat
```

### Session Accept Flow (Phase 4)
```
1. User B opens chat → sees session request card (pending)
   ↓
2. User B taps "Accept"
   ↓
3. RPC respond_to_session(session_id, User B, 'accept')
   ↓
4. Function verifies: B is invitee, session is pending
   ↓
5. UPDATE sessions SET status='active', accepted_at=NOW()
   ↓
6. Realtime delivers update → card changes to "Session Active"
```

### Session Complete Flow (Phase 4)
```
1. User taps "End Session" on Active Session screen
   ↓
2. RPC complete_session(session_id, user_id)
   ↓
3. Function verifies: user is participant, session is active
   ↓
4. UPDATE sessions SET status='completed', completed_at=NOW()
   ↓
5. Navigate to Session Complete screen
   ↓
6. Realtime delivers update → other user's card changes to "Session Completed"
```

### Auto-Cancel Flow (Phase 4)
```
1. App starts, user is authenticated
   ↓
2. Call RPC auto_cancel_sessions()
   ↓
3. UPDATE all sessions WHERE status='active' AND accepted_at < now - 24h AND not fully locked
   ↓
4. Clear lock timestamps, set completed_ack=false
   ↓
5. Return count of cancelled sessions (logged, not shown to user)
```

---

## SQL Files — Phase 4

| File | Purpose | Status |
|------|---------|--------|
| `supabase/001_profiles_table.sql` | Profiles table + trigger (Phase 1) | ✅ Committed |
| `supabase/002_discovery_tables.sql` | work_intents, swipes, check_match (Phase 2) | ✅ Committed |
| `supabase/003_matching_tables.sql` | matches, messages, create_match, mark_chat_read (Phase 3) | ✅ Committed |
| `supabase/004_sessions_tables.sql` | sessions, session_participants, all session RPCs (Phase 4) | 📋 To be created |

### Run Order

Execute in Supabase SQL Editor in this order:
1. `001_profiles_table.sql`
2. `002_discovery_tables.sql`
3. `003_matching_tables.sql`
4. `004_sessions_tables.sql`

---

## To Be Confirmed

| Item | Question | Impact |
|------|----------|--------|
| Stale pending sessions | Should pending sessions from previous days auto-cancel, or remain pending? | Currently they remain pending. May want a cleanup RPC. |
| Session history | Should users be able to see all past sessions, or only the most recent per match? | Phase 4 only shows inline in chat. History screen deferred. |
| Multiple sessions per match per day | Can users start a new session after completing one with the same match in the same day? | Currently allowed (one-per-user check only covers pending/active). |

---

## Phase 4 Security Notes

1. **All session mutations via SECURITY DEFINER** — No direct INSERT/UPDATE by clients
2. **Multiple pending invites allowed** — `create_session` does not enforce a one-per-user constraint
3. **Role-based access** — Only invitee can accept/decline; only initiator can cancel
4. **Participant verification** — All RPCs verify the calling user is a session participant
5. **RLS restricts reads** — Users can only see sessions for their own matches
6. **Realtime filtered by session id** — Users only subscribe to their own sessions
