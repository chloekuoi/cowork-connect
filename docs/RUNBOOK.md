# CoWork Connect — Runbook

## Quick Start

### Install
```bash
npm install
```

### Run
```bash
npx expo start
```

Then press:
- `i` — Open iOS Simulator
- `a` — Open Android Emulator
- `w` — Open in web browser

### Clear Cache (if issues)
```bash
npx expo start --clear
```

---

## Environment Variables

Currently hardcoded in `lib/supabase.ts`. For production, move to env vars:

| Variable | Description | Where Used |
|----------|-------------|------------|
| `SUPABASE_URL` | Supabase project URL | `lib/supabase.ts` |
| `SUPABASE_ANON_KEY` | Supabase publishable anon key | `lib/supabase.ts` |

### Future (not yet implemented)
| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SENTRY_DSN` | Error tracking |
| `EXPO_PUBLIC_MIXPANEL_TOKEN` | Analytics |

---

## Database Setup

Before testing, run the SQL migrations in Supabase SQL Editor:

1. `supabase/001_profiles_table.sql` — Profiles table + signup trigger
2. `supabase/002_discovery_tables.sql` — Discovery tables (work_intents, swipes)

---

## Test Flows

### 1. Create Account

**Preconditions:** Fresh app install or signed out

**Steps:**
1. Open app
2. See Welcome screen with "Find your people" tagline
3. Tap "Get Started"
4. Enter email address
5. Enter password (min 6 characters)
6. Tap "Create Account"

**Success Criteria:**
- [ ] No error alerts
- [ ] Redirected to Onboarding screen (Step 1: "What's your name?")
- [ ] Check Supabase: `auth.users` table has new row with email
- [ ] Check Supabase: `profiles` table has new row (may be empty until onboarding)

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| "User already registered" | Email exists | Use different email or login |
| "Invalid email" | Malformed email | Check email format |
| "Password too short" | < 6 chars | Use longer password |
| Network error | No connection | Check wifi/cellular |

---

### 2. Complete Onboarding

**Preconditions:** Signed up, on Onboarding screen

**Steps:**
1. **Step 1 — Name**
   - Enter your name (e.g., "Alex Chen")
   - Tap "Continue"

2. **Step 2 — Work Type**
   - Select one option (e.g., "Freelancer")
   - Tap "Continue"

3. **Step 3 — Interests**
   - Select 1+ interests (e.g., "Deep Focus", "Pomodoro")
   - Tap "Get Started"

**Success Criteria:**
- [ ] Progress dots advance with each step
- [ ] Can go back with "Back" button
- [ ] After "Get Started", redirected to main app (Discover tab)
- [ ] Check Supabase: `profiles` table row has:
  - `name` = entered name
  - `work_type` = selected type
  - `interests` = array of selected interests
  - `onboarding_complete` = true

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| "Name required" alert | Empty name field | Enter a name |
| "Work type required" | No selection in step 2 | Tap an option |
| "Failed to save profile" | Database error | Check Supabase logs |
| Stuck on loading | Network timeout | Check connection, retry |

---

### 3. Create Intent

**Preconditions:** Logged in, onboarding complete, on Discover tab

**Steps:**
1. Grant location permission when prompted
2. See "Set Your Intent" form
3. Enter task description (e.g., "Writing blog posts about productivity")
4. Select work style (e.g., "Deep focus")
5. Select location type (e.g., "Cafe")
6. Optionally enter spot name (e.g., "Blue Bottle Coffee")
7. Select start and end times
8. Tap "Find Co-Workers"

**Success Criteria:**
- [ ] Location permission granted (or "Enable Location" screen if denied)
- [ ] Form accepts input without errors
- [ ] After submit, transitions to either:
  - Card stack (if other users nearby), OR
  - Empty state ("No one nearby")
- [ ] Check Supabase: `work_intents` table has new row with:
  - `user_id` = your user ID
  - `task_description` = entered text
  - `work_style` = selected style
  - `location_type` = selected type
  - `intent_date` = today's date
  - `latitude` / `longitude` = your coordinates

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| "Location Required" screen | Permission denied | Tap "Enable Location", grant in iOS Settings |
| "Missing info" alert | Empty task description | Enter a task |
| "Failed to save" | Database error | Check Supabase RLS policies |
| Spinner never stops | Network issue | Check connection |

---

### 4. See Discovery Feed

**Preconditions:** Intent created for today, other users have intents nearby

**Steps:**
1. After creating intent, feed loads automatically
2. See header: "Discover" + "Working on: [your task]"
3. See card stack with top card visible
4. Card shows: name, distance, task, work style, location type

**Success Criteria:**
- [ ] Header shows "Working on: [your task]"
- [ ] Top card displays:
  - Profile photo OR initials placeholder
  - Name (or "Anonymous")
  - Distance in km or m (with "away")
  - Task description
  - Two tags (work style + location)
- [ ] Next two cards visible behind (slightly smaller, offset)

**To Create Test Data:**
1. Create second user account
2. Complete onboarding
3. Create intent with nearby coordinates (within 50km)
4. Switch back to first account
5. Pull to refresh or reopen Discover tab

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| "No one nearby" | No other users with intents | Create test data (see above) |
| Cards show wrong distance | Test user too far | Use coordinates within 50km |
| Blank cards | Missing profile data | Check `profiles` table has name |

---

### 5. Swipe Left / Right

**Preconditions:** Discovery feed showing with cards

**Steps — Gesture Swipe:**
1. Touch and drag card horizontally
2. See card rotate and stamp appear:
   - Right drag → green "LIKE" stamp
   - Left drag → red "NOPE" stamp
3. Release past threshold → card flies off
4. Release before threshold → card springs back

**Steps — Button Swipe:**
1. Tap X button (left side) → swipe left
2. Tap OK button (right side) → swipe right

**Success Criteria:**
- [ ] Card rotates while dragging (max ±15°)
- [ ] LIKE/NOPE stamps fade in based on direction
- [ ] Swiping past 30% screen width completes swipe
- [ ] Card animates off screen smoothly
- [ ] Next card scales up to replace it
- [ ] Check Supabase: `swipes` table has new row with:
  - `swiper_id` = your user ID
  - `swiped_id` = swiped user's ID
  - `direction` = "right" or "left"
  - `swipe_date` = today

**Match Detection:**
1. User A swipes right on User B
2. User B swipes right on User A
3. User B sees: Alert "It's a Match!"

**To Test Match:**
1. With User A: swipe right on User B
2. Log out, log in as User B
3. Find User A in feed, swipe right
4. **Expected:** Alert appears: "It's a Match! You and [name] both want to co-work today!"

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| Card doesn't move | Gesture not registering | Ensure GestureHandlerRootView wraps app |
| No snap back | Animation broken | Check reanimated babel plugin |
| Swipe not recorded | Database error | Check Supabase `swipes` RLS policies |
| No match alert | RPC not created | Run `check_match` function SQL |
| Match alert for every swipe | Mutual swipe exists | Expected if both swiped right |

---

### 6. Messaging

**Status:** NOT IMPLEMENTED (Phase 3)

**Placeholder Behavior:**
- Matches tab exists but shows placeholder content
- No chat functionality yet
- No way to communicate after matching

**Coming in Phase 3:**
- Match list with last message preview
- 1:1 chat thread
- Push notifications for new messages
- Typing indicators

---

## Quick Verification Checklist

Run through this after any major changes:

```
[ ] App launches without crash
[ ] Welcome screen renders
[ ] Can create account
[ ] Onboarding completes
[ ] Main tabs appear
[ ] Discover tab requests location
[ ] Intent form works
[ ] Cards display (with test data)
[ ] Swipe gestures work
[ ] Swipe buttons work
[ ] Swipes recorded in database
[ ] Match detection works
```

---

## Debugging Tips

### Check Logs
```bash
# Metro bundler logs
npx expo start

# Simulator logs
# Xcode → Window → Devices and Simulators → Open Console
```

### Check Database
1. Go to Supabase Dashboard
2. Table Editor → Select table
3. Verify rows exist with correct data

### Check RLS Policies
1. Supabase → Authentication → Policies
2. Ensure policies allow your operations
3. Test with SQL Editor using `auth.uid()`

### Reset Local State
```bash
# Clear AsyncStorage (sign out)
# Delete app from simulator
# Reinstall
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Bundler cache issues | Run `npx expo start --clear` |
| Gesture handler not working | Check `babel.config.js` has reanimated plugin |
| Location not working | Check iOS Settings → Privacy → Location Services |
| Database operations fail | Check Supabase RLS policies |
| Match not triggering | Verify `check_match` RPC exists in Supabase |

---

## Simulator Locations

For testing with specific coordinates:

**iOS Simulator:**
1. Features → Location → Custom Location
2. Enter lat/long

**Test Coordinates (San Francisco):**
- User A: 37.7749, -122.4194 (Downtown)
- User B: 37.7849, -122.4094 (~1.5km away)
- User C: 37.8049, -122.4294 (~3.5km away)

---

## Support

- **GitHub Issues:** https://github.com/anthropics/claude-code/issues
- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev

---
---

# Phase 3: Matching & Messaging — Verification Flows

**Added:** 2026-02-07

---

## Database Setup (Phase 3)

Before testing Phase 3, run the SQL migration in Supabase SQL Editor:

3. `supabase/003_matching_tables.sql` — matches table, messages table, create_match, mark_chat_read

After running, verify:
1. Go to Table Editor → verify `matches` and `messages` tables exist
2. Go to Authentication → Policies → verify RLS policies on both tables
3. Go to Database → Functions → verify `create_match` and `mark_chat_read` exist
4. Go to Database → Replication → verify `messages` table has Realtime enabled

---

### 7. Verify Phase 3 Database

**Preconditions:** SQL migration `003_matching_tables.sql` executed

**Steps:**
1. Open Supabase SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. **Expected:** `matches` and `messages` listed alongside existing tables
4. Run: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';`
5. **Expected:** `create_match` and `mark_chat_read` listed alongside `check_match` and `handle_new_user`
6. Run: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('matches', 'messages');`
7. **Expected:** RLS policies listed for both tables
8. Test create_match function:
   ```sql
   -- Use two existing user IDs from profiles table
   SELECT create_match('USER_A_UUID'::uuid, 'USER_B_UUID'::uuid);
   ```
9. **Expected:** Returns a UUID (the match ID)
10. Run the same call again
11. **Expected:** Returns the same UUID (idempotent)
12. Check matches table: `SELECT * FROM matches;`
13. **Expected:** One row with ordered user IDs

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "function create_match does not exist" | SQL not run | Execute `003_matching_tables.sql` |
| "permission denied for table matches" | RLS blocking | Verify SECURITY DEFINER on functions |
| Realtime not working | Not enabled | Dashboard → Database → Replication → enable `messages` |

---

### 8. Match Creation via Swipe

**Preconditions:** Both users have accounts, Phase 3 database set up, both users have today's intents

**Steps:**
1. Login as User A
2. Navigate to Discover tab, set intent
3. Swipe right on User B
4. Check Supabase `swipes` table
5. **Expected:** Row with swiper_id=A, swiped_id=B, direction='right'
6. Check Supabase `matches` table
7. **Expected:** No match row yet (only one-sided swipe)
8. Logout, login as User B
9. Navigate to Discover tab, set intent
10. Swipe right on User A
11. Check Supabase `swipes` table
12. **Expected:** Row with swiper_id=B, swiped_id=A, direction='right'
13. Check Supabase `matches` table
14. **Expected:** New row with user1_id=LEAST(A,B), user2_id=GREATEST(A,B)

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No match row after mutual swipe | `create_match` not called in recordSwipe | Check discoveryService.ts update |
| Duplicate match rows | User ordering not working | Check `create_match` function uses LEAST/GREATEST |
| Match row but no modal | Modal not integrated | Check DiscoverScreen uses MatchModal |

---

### 9. Match Modal

**Preconditions:** Mutual right swipe scenario (User B triggers the match)

**Steps:**
1. As User B, swipe right on User A (who already swiped right on B)
2. **Expected:** Match modal appears (NOT native Alert)
3. Verify modal shows:
   - Both users' photos or initials
   - "It's a Match!" heading
   - Subtitle with both names
   - "Send Message" button
   - "Keep Swiping" text
4. Tap "Keep Swiping"
5. **Expected:** Modal dismisses, discovery continues (next card or empty state)
6. Trigger another match (or repeat with different users)
7. Tap "Send Message"
8. **Expected:** Navigates to Matches tab → Chat screen with the matched user

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Native Alert instead of modal | MatchModal not integrated | Check DiscoverScreen renders MatchModal |
| Modal shows but no photos | Profile data not passed | Check matchedUser prop has photo_url/name |
| "Send Message" does nothing | Navigation not set up | Check cross-tab navigation to Matches → Chat |
| Modal behind card stack | zIndex issue | Ensure modal overlay has highest zIndex |

---

### 10. Chat — Send and Receive Messages

**Preconditions:** Two users matched, Chat screen accessible

**Steps:**
1. As User A, navigate to Matches tab
2. Tap on the match with User B
3. **Expected:** Chat screen opens with User B's name in header
4. **Expected:** Empty state: "Start the conversation!" (no messages yet)
5. Type "Hey! Want to work at Blue Bottle today?"
6. **Expected:** Send button becomes active (not grayed out)
7. Tap send
8. **Expected:**
   - Message appears right-aligned in sage green bubble
   - Input field clears
   - Timestamp shows below message
9. Check Supabase `messages` table
10. **Expected:** Row with match_id, sender_id=A, content="Hey!..."
11. Keep chat open on User A's device
12. On User B's device, open the same chat
13. **Expected:** User A's message is visible (left-aligned, cream bubble)
14. As User B, type and send: "Yes! I'll be there at 2pm"
15. **Expected on User B:** Message appears right-aligned sage
16. **Expected on User A:** Message appears in real time (left-aligned cream) without manual refresh

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Start the conversation!" never goes away | Messages not fetching | Check fetchMessages query |
| Message sent but not visible | FlatList not updating | Check state management |
| Other user's message not appearing | Realtime not working | Check Supabase Realtime enabled on messages table |
| Send button always disabled | Trim logic too strict | Check input value trimming |
| Keyboard covers input | KeyboardAvoidingView missing | Wrap chat in KeyboardAvoidingView |

---

### 11. Matches List

**Preconditions:** At least one match exists with messages

**Steps:**
1. Login as User A
2. Navigate to Matches tab
3. **Expected:** Loading spinner briefly, then match list appears
4. Verify match card shows:
   - User B's photo or initials (circular)
   - User B's name
   - Last message text (truncated to 1 line)
   - Relative timestamp (e.g., "2m ago")
5. If User B sent a message that User A hasn't read:
   - **Expected:** Green unread dot visible
   - **Expected:** Name text is bold
6. Tap the match card
7. **Expected:** Chat screen opens with User B's messages
8. Press back
9. **Expected:** Returns to matches list
10. Pull down to refresh
11. **Expected:** List refreshes (loading indicator briefly)

**With No Matches:**
1. Login with a fresh user (no matches)
2. Navigate to Matches tab
3. **Expected:** Empty state: "No matches yet" with encouragement text

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank list | fetchMatches query failing | Check Supabase query joins |
| No last message showing | Last message query not working | Check messaging service |
| "Say hello!" not showing | No fallback for empty messages | Check MatchCard conditional |
| Pull-to-refresh not working | onRefresh not wired | Check FlatList props |

---

### 12. Unread Message Badge

**Preconditions:** Two matched users, messages sent

**Steps:**
1. As User A, send a message to User B in chat
2. Close the chat (go back to matches list or switch tabs)
3. Login as User B
4. Look at the bottom tab bar
5. **Expected:** Matches tab shows a red badge with "1" (or the unread count)
6. Tap the Matches tab
7. **Expected:** Badge still shows (haven't read yet)
8. Open the chat with User A
9. **Expected:** Messages visible, chat marked as read
10. Go back to Matches tab or switch away and back
11. **Expected:** Badge disappears (or count decremented)
12. Have User A send another message
13. Next time User B focuses the Matches tab
14. **Expected:** Badge shows "1" again

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No badge ever | getUnreadCount not called | Check MainTabs badge logic |
| Badge shows wrong count | last_read_at not updating | Check mark_chat_read RPC |
| Badge doesn't clear | markChatRead not called on chat open | Check ChatScreen useEffect |
| Badge shows on fresh account | Query returning wrong count | Check unread count query logic |

---

## Updated Quick Verification Checklist

Run through this after Phase 3 implementation:

```
Phase 1+2 (existing):
[ ] App launches without crash
[ ] Welcome screen renders
[ ] Can create account
[ ] Onboarding completes
[ ] Main tabs appear
[ ] Discover tab requests location
[ ] Intent form works
[ ] Cards display (with test data)
[ ] Swipe gestures work
[ ] Swipe buttons work
[ ] Swipes recorded in database

Phase 3 (new):
[ ] Mutual right swipe creates match row in database
[ ] Match modal appears (not native Alert)
[ ] Match modal shows both users' info
[ ] "Send Message" navigates to chat
[ ] "Keep Swiping" dismisses modal
[ ] Matches list shows matches with previews
[ ] Matches list empty state works
[ ] Chat screen opens from match card
[ ] Can send a message
[ ] Message appears in database
[ ] Message appears for other user in real time
[ ] Unread badge shows on Matches tab
[ ] Unread badge clears after reading
[ ] Pull-to-refresh works on matches list
[ ] Back navigation from chat works
```

---

## Phase 3 Debugging Tips

### Check Realtime
1. Supabase Dashboard → Database → Replication
2. Verify `messages` table is listed under "Source"
3. If not listed, enable it and restart the app

### Check Match Functions
```sql
-- Test create_match directly
SELECT create_match('USER_A_UUID'::uuid, 'USER_B_UUID'::uuid);

-- Test mark_chat_read directly
SELECT mark_chat_read('MATCH_UUID'::uuid, 'USER_UUID'::uuid);

-- Check unread messages for a user
SELECT m.id, m.content, m.created_at, m.sender_id
FROM messages m
JOIN matches mt ON m.match_id = mt.id
WHERE (mt.user1_id = 'USER_UUID' AND m.created_at > mt.user1_last_read_at AND m.sender_id != 'USER_UUID')
   OR (mt.user2_id = 'USER_UUID' AND m.created_at > mt.user2_last_read_at AND m.sender_id != 'USER_UUID');
```

### Common Phase 3 Issues

| Issue | Solution |
|-------|----------|
| Realtime not delivering messages | Enable Realtime on `messages` table in Supabase Dashboard |
| "function create_match does not exist" | Run `supabase/003_matching_tables.sql` |
| Messages visible to wrong users | Check RLS policies on `messages` table |
| Chat opens but shows wrong messages | Verify `match_id` filter on message query |
| Badge count wrong after reading | Check `mark_chat_read` updates correct column (user1 vs user2) |
| Navigation crash from modal | Check MatchesStack navigator has correct screen names |

---
---

# Phase 4: Sessions — Verification Flows

**Added:** 2026-02-08

---

## Database Setup (Phase 4)

Before testing Phase 4, run the SQL migration in Supabase SQL Editor:

4. `supabase/004_sessions_tables.sql` — sessions table, session_participants table, all session RPC functions

After running, verify:
1. Go to Table Editor → verify `sessions` and `session_participants` tables exist
2. Go to Authentication → Policies → verify RLS policies on both tables
3. Go to Database → Functions → verify `create_session`, `respond_to_session`, `complete_session`, `cancel_session`, `auto_complete_sessions` exist
4. Go to Database → Replication → verify `sessions` table has Realtime enabled

---

### 13. Verify Phase 4 Database

**Preconditions:** SQL migration `004_sessions_tables.sql` executed

**Steps:**
1. Open Supabase SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. **Expected:** `sessions` and `session_participants` listed alongside existing tables
4. Run: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';`
5. **Expected:** `create_session`, `respond_to_session`, `complete_session`, `cancel_session`, `auto_complete_sessions` listed
6. Run: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('sessions', 'session_participants');`
7. **Expected:** RLS policies listed for both tables
8. Test create_session function (use two user IDs from an existing match):
   ```sql
   -- First, find a match
   SELECT id, user1_id, user2_id FROM matches LIMIT 1;
   -- Then create a session (use match_id and user1_id from above)
   SELECT create_session('MATCH_UUID'::uuid, 'USER1_UUID'::uuid);
   ```
9. **Expected:** Returns a UUID (the session ID)
10. Check sessions table: `SELECT * FROM sessions;`
11. **Expected:** One row with status='pending', initiated_by=USER1
12. Check session_participants: `SELECT * FROM session_participants;`
13. **Expected:** Two rows — one 'initiator', one 'invitee'
14. Try creating another session for the same user:
    ```sql
    SELECT create_session('MATCH_UUID'::uuid, 'USER1_UUID'::uuid);
    ```
15. **Expected:** Error — "User already has an active or pending session"
16. Test respond_to_session:
    ```sql
    SELECT respond_to_session('SESSION_UUID'::uuid, 'USER2_UUID'::uuid, 'accept');
    ```
17. **Expected:** Session status changes to 'active', accepted_at is set
18. Test complete_session:
    ```sql
    SELECT complete_session('SESSION_UUID'::uuid, 'USER1_UUID'::uuid);
    ```
19. **Expected:** Session status changes to 'completed', completed_at is set

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "function create_session does not exist" | SQL not run | Execute `004_sessions_tables.sql` |
| "permission denied for table sessions" | RLS blocking | Verify SECURITY DEFINER on functions |
| Realtime not working for sessions | Not enabled | Dashboard → Database → Replication → enable `sessions` |
| "User already has an active or pending session" | Previous test data | Clean up: `DELETE FROM sessions;` |

---

### 14. Send Cowork Invite from Chat

**Preconditions:** Two matched users (User A and User B) with chat available

**Steps:**
1. Login as User A
2. Navigate to Matches tab → open chat with User B
3. Verify "Send Cowork Invite" button is visible in the chat header
4. Tap "Send Cowork Invite"
5. **Expected:** Invite card appears inline with date selector (today + next 6 days)
6. Select a date and send invite
7. **Expected:** Card shows waiting state + Cancel button for initiator
8. Check Supabase `sessions` table
9. **Expected:** Row with match_id, initiated_by=User A, status='pending', scheduled_date set
10. Check `session_participants` table
11. **Expected:** Two rows — User A as 'initiator', User B as 'invitee'
12. Navigate to a different match's chat (if available)
13. **Expected:** "Send Cowork Invite" is still available (multiple pending invites allowed)

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No "Send Cowork Invite" button | Component not added to ChatScreen | Check header rendering |
| Invite card missing date selector | UI not updated | Check invite card component |
| Card doesn't appear | Session not fetched after creation | Check fetchSessionsForMatch call |
| Error creating invite | RPC updated incorrectly | Check create_session RPC |

---

### 15. Accept and Decline Invite

**Preconditions:** User A has sent an invite to User B (pending session exists)

**Accept Flow:**
1. Login as User B
2. Navigate to Matches tab → open chat with User A
3. **Expected:** Invite card visible with "Accept" and "Decline"
4. Tap "Accept"
5. **Expected:** System message bubble: "You can now plan coworking details with xxx 😀"
6. **Expected:** Dual-lock card appears with "Locked in 🔒 | Locked in 🔒"
7. Check Supabase `sessions` table
8. **Expected:** status='active', accepted_at set

**Decline Flow:**
1. Start a new invite (User A invites User B again)
2. Login as User B, open chat with User A
3. Tap "Decline"
4. **Expected:** Card updates to "Session Declined" (dimmed)
5. Check Supabase: status='declined'

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Accept button does nothing | respondToSession not called | Check onAccept handler |
| Card doesn't update after accept | Realtime not subscribed or state not refreshed | Check session subscription |
| "Session not found or not pending" error | Session already responded to | Check session status in DB |
| Initiator can accept own session | Role check missing | Verify respond_to_session checks initiated_by |

---

### 16. Dual-Lock Confirmation

**Preconditions:** An active session between User A and User B (accepted)

**Steps:**
1. In chat, find the dual-lock card
2. User A taps their "Locked in 🔒" (right side)
3. **Expected:** User B sees left side marked as locked
4. User B taps their "Locked in 🔒" (right side)
5. **Expected:** Card remains for ~3 seconds, then disappears
6. **Expected:** "🔒❤️" toast appears
7. Check Supabase: status='completed', completed_ack=true
8. Check Supabase: locked_by_initiator_at and locked_by_invitee_at are set

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "View Session" doesn't navigate | Navigation not set up | Check MatchesStack has ActiveSession screen |
| Active Session screen blank | Route params not passed | Check sessionId and otherUser params |
| "End Session" error | completeSession RPC issue | Check function exists and user is participant |
| Duration shows wrong value | Calculation error | Check accepted_at and completed_at difference |
| "Back to Chat" navigates wrong | Navigation stack issue | Check popToTop or navigate behavior |

---

### 17. Cancel Invite

**Preconditions:** User A has a pending session with User B

**Steps:**
1. Login as User A
2. Open chat with User B
3. Find the pending session card (initiator view)
4. **Expected:** "Cancel" button visible
5. Tap "Cancel"
6. **Expected:** Card updates to "Session Cancelled" (dimmed)
7. Check Supabase: status='cancelled'
8. **Expected:** "Send Cowork Invite" button available again in chat header
9. Login as User B
10. Open chat with User A
11. **Expected:** Session card shows "Session Cancelled" (no action buttons)

**Invitee Cannot Cancel:**
1. Create a new pending session (User A invites User B)
2. Login as User B, view the session card
3. **Expected:** No "Cancel" button visible — only "Accept" and "Decline"

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Cancel button visible for invitee | Role check missing in component | Check currentUserId vs initiated_by |
| "Session not found or not pending" | Session already accepted/declined | Check status before cancel |
| Card doesn't update | State not refreshed | Check Realtime subscription or manual refetch |

---

### 18. Auto-Cancel Stale Sessions

**Preconditions:** An active session exists with accepted_at older than 24 hours and not fully locked

**Setup (via Supabase SQL Editor):**
```sql
-- Create a session and manually set its date to yesterday
UPDATE sessions
SET status = 'active',
    accepted_at = NOW() - INTERVAL '1 day',
    locked_by_initiator_at = NULL,
    locked_by_invitee_at = NULL
WHERE id = 'SESSION_UUID';
```

**Steps:**
1. Close and reopen the app (or login fresh)
2. **Expected:** Auto-cancel runs silently on app load
3. Check Supabase `sessions` table
4. **Expected:** Session status changed to 'cancelled', completed_ack=false
5. **Expected:** Lock timestamps cleared
6. Open the affected chat on User A and User B
7. **Expected:** Toast appears for 3 seconds: "Missed this one 💔"

**Alternative Manual Test:**
```sql
-- Call the RPC directly
SELECT auto_cancel_sessions();
-- Expected: Returns number of sessions cancelled (e.g., 1)
```

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Stale session still active | auto_cancel_sessions not called on app load | Check AuthContext or root navigator |
| Function returns 0 | accepted_at not older than 24h | Verify accepted_at < NOW() - INTERVAL '24 hours' |
| App crashes on load | Auto-complete error not caught | Ensure fire-and-forget with try/catch |

---

### 19. Multiple Pending Invites

**Preconditions:** User A has matches with both User B and User C

**Steps:**
1. Login as User A
2. Open chat with User B
3. Tap "Send Cowork Invite" → invite created (pending)
4. Navigate back, open chat with User C
5. **Expected:** "Send Cowork Invite" is still available
6. Send invite to User C
7. **Expected:** Both invites remain pending in respective chats

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Invite blocked | Old one-per-user constraint still enforced | Update create_session RPC |

---

## Updated Quick Verification Checklist

Run through this after Phase 4 implementation:

```
Phase 1+2 (existing):
[ ] App launches without crash
[ ] Welcome screen renders
[ ] Can create account
[ ] Onboarding completes
[ ] Main tabs appear
[ ] Discover tab requests location
[ ] Intent form works
[ ] Cards display (with test data)
[ ] Swipe gestures work
[ ] Swipe buttons work
[ ] Swipes recorded in database

Phase 3 (existing):
[ ] Mutual right swipe creates match row in database
[ ] Match modal appears (not native Alert)
[ ] Match modal shows both users' info
[ ] "Send Message" navigates to chat
[ ] "Keep Swiping" dismisses modal
[ ] Matches list shows matches with previews
[ ] Chat screen opens from match card
[ ] Can send and receive messages in real time
[ ] Unread badge shows and clears correctly

Phase 4 (new):
[ ] "Send Cowork Invite" button visible in chat header
[ ] Invite card includes date selection (today + next 6 days)
[ ] Invite card shows correct state for initiator (waiting + cancel)
[ ] Invite card shows correct state for invitee (accept + decline)
[ ] Accepting shows system message with emoji
[ ] Dual-lock card appears after acceptance
[ ] Each user lock updates the opposite side
[ ] Both locks → "🔒❤️" toast and session completed
[ ] Declining changes card to "Session Declined"
[ ] Cancelling changes card to "Session Cancelled"
[ ] Multiple pending invites across matches are allowed
[ ] Stale accepted sessions auto-cancel after 24h
[ ] Session data persists in database correctly
```

---

## Phase 4 Debugging Tips

### Check Session Functions
```sql
-- Test create_session directly (use real match and user IDs)
SELECT create_session('MATCH_UUID'::uuid, 'USER_UUID'::uuid);

-- Test respond_to_session
SELECT respond_to_session('SESSION_UUID'::uuid, 'INVITEE_UUID'::uuid, 'accept');

-- Test complete_session
SELECT complete_session('SESSION_UUID'::uuid, 'USER_UUID'::uuid);

-- Test cancel_session
SELECT cancel_session('SESSION_UUID'::uuid, 'INITIATOR_UUID'::uuid);

-- Test auto_complete
SELECT auto_complete_sessions();

-- Check all sessions
SELECT s.id, s.status, s.session_date, s.initiated_by, s.accepted_at, s.completed_at,
       p1.name as initiator_name
FROM sessions s
JOIN profiles p1 ON s.initiated_by = p1.id
ORDER BY s.created_at DESC;

-- Check session participants
SELECT sp.session_id, sp.role, p.name
FROM session_participants sp
JOIN profiles p ON sp.user_id = p.id;

-- Check one-per-user constraint
SELECT sp.user_id, p.name, s.status, s.session_date
FROM session_participants sp
JOIN sessions s ON sp.session_id = s.id
JOIN profiles p ON sp.user_id = p.id
WHERE s.status IN ('pending', 'active');
```

### Common Phase 4 Issues

| Issue | Solution |
|-------|----------|
| "function create_session does not exist" | Run `supabase/004_sessions_tables.sql` |
| Realtime not delivering session updates | Enable Realtime on `sessions` table in Dashboard |
| Session card not updating in chat | Check Realtime subscription on session id |
| "Start Session" always disabled | Check fetchActiveSession query — may return stale data |
| Session card at wrong position in chat | Check created_at sorting in timeline merge |
| Duration shows negative or NaN | Check accepted_at and completed_at are both non-null |
| Auto-complete not running | Check AuthContext calls autoCompleteStaleSessions after auth |
