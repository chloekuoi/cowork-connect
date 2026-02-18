# Phase 5: Friends & Polish + Profile Redesign — Implementation Map (Scaffold)

**Status:** PENDING IMPLEMENTATION
**Created:** 2026-02-15

> This document will be updated by Codex after implementation.

---

## P5-01: Database — friendships Table, phone_number Column, RPCs

### Intended Behavior
- `friendships` table stores manual friend request records with requester, recipient, status lifecycle
- `profiles.phone_number` column added (nullable TEXT) for friend search
- `send_friend_request` RPC checks both directions for existing friendships, handles mutual pending (auto-accept + match creation), and inserts new pending requests
- `respond_to_friend_request` RPC accepts/declines pending requests (recipient only); on accept, creates match row via `create_match`
- `get_pending_requests_count` RPC returns count of pending incoming requests
- RLS restricts reads to own friendships (requester or recipient)
- Realtime enabled on `friendships` table

### Expected File Paths
- `supabase/006_friendships_table.sql` (created)

### Verification
- RUNBOOK: Phase 5 Flow 20 — Database setup verification

### Known Risks / TODOs
- Realtime must be explicitly enabled in Supabase Dashboard for the `friendships` table
- `respond_to_friend_request` calls `create_match` internally — verify SECURITY DEFINER can invoke another SECURITY DEFINER function
- The mutual pending auto-accept path in `send_friend_request` must be tested carefully (race condition edge case)
- No phone number format validation at database level

---

## P5-02: Phase 5 TypeScript Types

### Intended Behavior
- `FriendshipStatus` union type: 'pending' | 'accepted' | 'declined'
- `Friendship` type mirrors `friendships` table schema
- `FriendListItem` type for unified friend display: id, name, photo_url, match_id, has_intent_today, task_description
- `UserSearchResult` type: profile fields + relationship_status
- `RelationshipStatus` union type: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'declined'

### Expected File Paths
- `src/types/index.ts` (modified — append new types)

### Verification
- `npx tsc --noEmit` passes with no errors

### Known Risks / TODOs
- `FriendListItem` needs `match_id` for chat navigation — ensure it's populated for both swipe-matches and manual friends

---

## P5-03: Friends Service Layer

### Intended Behavior
- `searchUsers(query, currentUserId)` queries profiles by username, email, phone_number using ILIKE; excludes self; max 20 results
- `sendFriendRequest(requesterId, recipientId)` calls `send_friend_request` RPC, returns friendship id or error
- `respondToFriendRequest(friendshipId, userId, response)` calls `respond_to_friend_request` RPC
- `fetchFriends(userId)` queries all matches (unified friends list), joins profiles and today's work_intents for availability
- `fetchPendingRequests(userId)` queries friendships WHERE recipient_id = userId AND status = 'pending', joins requester profile
- `getPendingRequestsCount(userId)` calls `get_pending_requests_count` RPC
- `getRelationshipStatuses(currentUserId, userIds)` checks matches and friendships tables to determine status per user
- `updatePhoneNumber(userId, phoneNumber)` updates profiles.phone_number

### Expected File Paths
- `src/services/friendsService.ts` (created)

### Verification
- RUNBOOK: Phase 5 Flows 21–25
- Console log verification of all function returns

### Known Risks / TODOs
- `fetchFriends` requires joining matches → profiles → work_intents — may need optimization for large friend lists
- `getRelationshipStatuses` queries both matches and friendships for a list of user IDs — potential N+1 issue, consider batch query
- Error messages from RPC exceptions need to be parsed into user-friendly strings

---

## P5-04: Create ProfileStack Navigator

### Intended Behavior
- Stack navigator with 3 screens: Profile (initial), Friends, AddFriend
- `ProfileStackParamList` defines route params (all undefined for Phase 5)
- MainTabs Profile tab renders ProfileStack instead of ProfileScreen directly
- Stack headers hidden; each screen manages its own header
- Default React Navigation stack transition animations

### Expected File Paths
- `src/navigation/ProfileStack.tsx` (created)
- `src/navigation/MainTabs.tsx` (modified — import ProfileStack)

### Verification
- Navigate Profile → Friends → AddFriend → back → back
- Verify back button behavior on each screen
- Verify three tabs remain unchanged

### Known Risks / TODOs
- React Navigation 7 requires `id` prop — ensure ProfileStack has unique id
- Tab bar should remain visible when on Friends or AddFriend screens (default behavior for nested stack in tab)
- Cross-tab navigation from Friends → Chat (Matches tab) needs to work

---

## P5-05: Build Add Friend Screen

### Intended Behavior
- Search input with pill shape, placeholder "Search by username, email, or phone"
- Debounced search (300ms, min 3 characters)
- Results show as FlatList of UserSearchResultCard components
- Each result shows photo/initials, name, username, and relationship-aware action button
- Action button states: "Add" (none), "Requested" (pending_sent), "Accept" (pending_received), "Friends ✓" (friends), "Declined" (declined)
- States: initial (prompt), searching (spinner), results (list), no_results (empty state)

### Expected File Paths
- `src/screens/profile/AddFriendScreen.tsx` (created)
- `src/components/friends/UserSearchResultCard.tsx` (created)

### Verification
- RUNBOOK: Phase 5 Flow 21 — Search and send friend request

### Known Risks / TODOs
- Debounce implementation: use `setTimeout` with cleanup, or a hook like `useDebouncedValue`
- Relationship status determination requires fetching matches + friendships after each search — may feel slow
- Optimistic "Requested" update must revert on error

---

## P5-06: Build Friends Screen

### Intended Behavior
- SectionList with two conditional sections: "Pending Requests" and "Your Friends"
- Pending section shows when pending request count > 0; each item has Accept/Decline buttons
- Friends section shows unified list (all matches) with availability indicator
- Available friends: green dot + task description (truncated, 1 line)
- Not available friends: "Not available today" in muted italic text
- Tap friend → navigate to ChatScreen with matchId + otherUser params
- "+" header button → navigate to AddFriendScreen
- Pull-to-refresh, refresh on focus (useFocusEffect)

### Expected File Paths
- `src/screens/profile/FriendsScreen.tsx` (created)
- `src/components/friends/FriendRequestCard.tsx` (created)
- `src/components/friends/FriendCard.tsx` (created)

### Verification
- RUNBOOK: Phase 5 Flows 22–25

### Known Risks / TODOs
- Cross-tab navigation from Friends (Profile tab) to Chat (Matches tab) — need to use `navigation.navigate('Matches', { screen: 'Chat', params })` pattern
- SectionList with conditional sections: need to handle empty sections gracefully
- Availability data requires fetching work_intents for all friends — batch query needed
- Accept action must also update the friends list (move card from pending to friends section)

---

## P5-07: Update Profile Screen + Pending Requests Badge

### Intended Behavior
- Profile screen gains two new tappable rows: "Phone Number" and "My Friends"
- Phone Number row: shows current value or "Add phone number" placeholder; tap opens edit input; saves to profiles.phone_number
- My Friends row: shows friend count; tap navigates to FriendsScreen
- MainTabs Profile tab shows numeric badge when pending friend request count > 0
- Badge updates on tab focus (same pattern as Matches tab unread badge)

### Expected File Paths
- `src/screens/profile/ProfileScreen.tsx` (modified — add rows)
- `src/navigation/MainTabs.tsx` (modified — add Profile tab badge)

### Verification
- RUNBOOK: Phase 5 Flow 23 — Pending requests badge
- Visual verification of Profile screen rows

### Known Risks / TODOs
- Phone number edit: `Alert.prompt` is iOS-only. For cross-platform, may need a modal with TextInput instead.
- Badge fetch pattern: reuse the `useFocusEffect` approach from Matches tab
- Friend count requires calling `fetchFriends` or a separate count query — consider a dedicated count to avoid loading all friends just for the number

---

## P5-08: Polish — Loading States, Error Handling, Empty States

### Intended Behavior
- Loading spinners on FriendsScreen and AddFriendScreen during data fetch
- Error alerts for failed operations (search, send request, accept, decline, save phone number)
- Empty states with Digital Matcha styling for Friends screen ("No friends yet") and search ("No users found")
- Pull-to-refresh visual feedback (RefreshControl) on Friends screen
- Haptic feedback on friend request sent and accepted (if expo-haptics installed)
- Smooth default navigation transitions between ProfileStack screens

### Expected File Paths
- `src/screens/profile/FriendsScreen.tsx` (modified — loading/error/empty states)
- `src/screens/profile/AddFriendScreen.tsx` (modified — loading/error/empty states)
- `src/screens/profile/ProfileScreen.tsx` (modified — error handling for phone save)

### Verification
- RUNBOOK: Phase 5 Flow 26 — Polish verification
- Visual inspection of all states

### Known Risks / TODOs
- expo-haptics may or may not already be installed — check before using
- Empty state illustrations: use emoji + text (consistent with existing patterns), no custom assets needed
- Error messages from RPCs need parsing — Supabase wraps RPC errors in a generic format

---

---

## P5-09: Database & Storage — profile_photos Table, Profile Columns, Avatars Bucket

### Intended Behavior
- `profiles` table gains nullable TEXT columns: `tagline`, `currently_working_on`, `work`, `school`
- `profile_photos` table stores photos with position-based ordering (0-4)
- `UNIQUE(user_id, position)` prevents duplicate positions
- RLS: anyone SELECT, owner INSERT/UPDATE/DELETE on `profile_photos`
- `avatars` storage bucket created (public, 5MB limit, jpeg/png/webp)
- Storage RLS: public read, owner-only write to `{userId}/` folder

### Expected File Paths
- `supabase/007_profile_photos.sql` (created)

### Verification
- RUNBOOK: Phase 5 Profile Redesign Flow 27 — Database setup verification

### Known Risks / TODOs
- `avatars` bucket must be created via Supabase Dashboard or SQL (INSERT INTO storage.buckets)
- Storage policies may need to be applied via Dashboard if SQL doesn't work for storage.objects
- Photo file naming uses position-based convention — overwriting on re-upload is intentional

---

## P5-10: Profile Redesign TypeScript Types

### Intended Behavior
- `ProfilePhoto` type: `{ id, user_id, photo_url, position, created_at }`
- `Profile` type gains nullable fields: `tagline`, `currently_working_on`, `work`, `school`

### Expected File Paths
- `src/types/index.ts` (modified — add ProfilePhoto type, extend Profile)

### Verification
- `npx tsc --noEmit` passes with no errors

### Known Risks / TODOs
- Must not break existing type imports that depend on the current Profile shape
- New fields are all nullable to maintain backward compatibility with existing profiles

---

## P5-11: Photo Service

### Intended Behavior
- `pickImage()` launches expo-image-picker (library, square crop, 0.8 quality)
- `uploadPhoto(userId, imageUri, position)` uploads to Supabase Storage `avatars/{userId}/{position}.jpg`, upserts `profile_photos` row, syncs `profiles.photo_url` if position=0
- `deletePhoto(userId, position)` removes from storage + DB, promotes next photo if deleting primary
- `getPhotos(userId)` fetches all photos ordered by position
- `setPrimaryPhoto(userId, fromPosition)` swaps positions, updates `profiles.photo_url`

### Expected File Paths
- `src/services/photoService.ts` (created)

### Verification
- Console log verification of all function returns
- Upload a photo, verify it appears in Supabase Storage and profile_photos table
- Delete a photo, verify it's removed from both storage and DB

### Known Risks / TODOs
- `expo-image-picker` must be installed via `npx expo install expo-image-picker`
- Supabase Storage upload may need `Content-Type` header for correct MIME type
- Photo promotion on primary delete: must update `profiles.photo_url` to the new position 0 photo
- Race condition: user uploads multiple photos quickly — upsert handles gracefully via UNIQUE constraint

---

## P5-12: Profile Service

### Intended Behavior
- `updateProfile(userId, fields)` updates profiles table with any subset of text fields
- `getFullProfile(userId)` parallel fetch of profile + photos

### Expected File Paths
- `src/services/profileService.ts` (created)

### Verification
- Update profile fields, verify changes persist in Supabase
- `getFullProfile` returns both profile data and photos array

### Known Risks / TODOs
- Must not conflict with existing `AuthContext.refreshProfile()` which selects `*` from profiles
- `getFullProfile` should handle the case where a user has 0 photos gracefully (return empty array)

---

## P5-13: PhotoSlots Component + Onboarding Step 4

### Intended Behavior
- Reusable `PhotoSlots` component: large primary slot + 4 smaller slots in 2x2 grid
- Empty slots show dashed border + prompt text
- Filled slots show photo via expo-image
- Onboarding gains Step 4: photo upload (1 required to proceed)
- `totalSteps` changes from 3 to 4
- "Get Started" button disabled until at least 1 photo uploaded

### Expected File Paths
- `src/components/profile/PhotoSlots.tsx` (created)
- `src/screens/auth/OnboardingScreen.tsx` (modified — add Step 4)

### Verification
- RUNBOOK: Phase 5 Profile Redesign Flow 28 — New user onboarding with photo
- Visual verification of PhotoSlots grid layout

### Known Risks / TODOs
- Onboarding step count change affects progress dots rendering
- Photo upload during onboarding: user_id must be available (user is authenticated but profile may not have all fields yet)
- If upload fails during onboarding, user should be able to retry without losing previous steps' data

---

## P5-14: ProfileStack + ProfileScreen Redesign

### Intended Behavior
- ProfileStack gains `EditProfile` screen (4 screens total: Profile, Friends, AddFriend, EditProfile)
- ProfileScreen rewritten with ScrollView layout: lead photo, thumbnails, name, tagline, currently working on, work/school, work type, edit profile button, phone number, my friends, sign out
- `useFocusEffect` refreshes profile data via `getFullProfile()`
- Migration banner shown when user has no photos

### Expected File Paths
- `src/navigation/ProfileStack.tsx` (modified — add EditProfile screen)
- `src/screens/profile/ProfileScreen.tsx` (rewritten)

### Verification
- RUNBOOK: Phase 5 Profile Redesign Flow 29 — Profile screen visual verification
- Navigate Profile → EditProfile → back, verify data refreshes

### Known Risks / TODOs
- ProfileScreen rewrite must preserve existing P5-07 functionality (Phone Number row, My Friends row, badge)
- Lead photo fallback must match existing initials pattern (consistent with SwipeCard, MatchCard)
- `getFullProfile` call on every focus could feel slow — consider caching or conditional refresh

---

## P5-15: EditProfileScreen

### Intended Behavior
- Header: Cancel (left) / Save (right)
- PhotoSlots grid (editable=true, action sheet: Change/Remove/Set Primary)
- TextInputs: Name, Tagline, Currently Working On, Work, School
- Work type single-select pills
- Photos upload/delete immediately (not on save)
- Save updates text fields via `updateProfile()`, then `refreshProfile()` + `goBack()`

### Expected File Paths
- `src/screens/profile/EditProfileScreen.tsx` (created)

### Verification
- RUNBOOK: Phase 5 Profile Redesign Flow 30 — Edit profile flow
- Modify all fields, save, verify persistence
- Upload and delete photos, verify immediate effect

### Known Risks / TODOs
- Action sheet: may need `@react-native-community/action-sheet` or native `ActionSheetIOS` (iOS-only for MVP)
- Photos uploaded during edit persist even if Cancel is tapped — this is intentional behavior
- Work type pills must match onboarding options exactly

---

## P5-16: SwipeCard Tagline Update

### Intended Behavior
- Tagline displays below work_type in SwipeCard photo overlay
- 13px, white, italic, numberOfLines={1}
- Graceful null handling (nothing renders if tagline is null/empty)

### Expected File Paths
- `src/components/discover/SwipeCard.tsx` (modified — add tagline line)

### Verification
- Visual verification on Discover tab
- Cards without tagline look unchanged

### Known Risks / TODOs
- Must not change existing overlay layout significantly
- Long taglines truncated with numberOfLines={1}

---

## P5-17: Verify Avatar Components

### Intended Behavior
- MatchCard shows user's primary photo when `profiles.photo_url` is populated
- MatchModal shows both users' photos when `profiles.photo_url` is populated
- `fetch_match_previews` RPC returns photo_url in results

### Expected File Paths
- No code changes expected — verification only
- `src/components/matches/MatchCard.tsx` (verify)
- `src/components/matches/MatchModal.tsx` (verify)

### Verification
- Upload a photo via EditProfile, verify it appears in MatchCard and MatchModal
- Verify `fetch_match_previews` includes photo_url

### Known Risks / TODOs
- These components already handle photo_url — should work automatically once photo_url is populated
- If components reference an old photo URL after deletion, expo-image will show empty/broken state

---

## Quick Verification Checklist

```bash
# 1. TypeScript compiles
npx tsc --noEmit

# 2. App starts
npm start
# Press 'i' for iOS

# 3. Database ready (run in Supabase SQL Editor)
# Contents of supabase/006_friendships_table.sql
# Contents of supabase/007_profile_photos.sql
```

### Friends End-to-End Test Flow
1. Login as User A, navigate to Profile
2. Add phone number → verify it saves
3. Tap "My Friends" → verify Friends screen (empty state)
4. Tap "+" → Add Friend screen
5. Search for User B by email → verify result with "Add" button
6. Tap "Add" → verify button changes to "Requested"
7. Login as User B, check Profile tab badge → verify "1"
8. Navigate to My Friends → verify pending request from User A
9. Tap "Accept" → verify User A moves to friends list with availability
10. Tap User A → verify chat opens
11. Login as User A → verify User B in friends list
12. Test decline: send request to User C, User C declines → card disappears
13. Test mutual auto-accept: User D requests User E, User E requests User D → both friends

### Profile Redesign End-to-End Test Flow
1. Create new account → complete onboarding with 4 steps (name → work type → interests → photo)
2. Verify photo uploads to Supabase Storage and profile_photos table
3. Navigate to Profile screen → verify lead photo, name displayed
4. Tap "Edit Profile" → verify PhotoSlots and text fields populated
5. Change tagline, currently working on, work, school → Save
6. Verify changes persist on Profile screen
7. Add/remove photos in EditProfile → verify immediate upload/delete
8. Navigate to Discover → verify SwipeCard shows photo and tagline
9. Navigate to Matches → verify MatchCard shows photo
10. Login as existing user without photos → verify migration banner on Profile screen
