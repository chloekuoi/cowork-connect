# PHASE 6 — Friend Profile View: Implementation Map

**Status:** SCAFFOLD (to be updated after implementation)
**Phase:** 6

> This document is a pre-implementation scaffold. After Codex implements each ticket, update the Status field and Verification column with actual results.

---

## P6-01 — `FriendProfileModal` component

**Status:** NOT STARTED

**Intended Behavior:**
Bottom sheet modal (`presentationStyle="pageSheet"`) that renders a friend's read-only profile. Header row contains a centered drag handle and a `💬` icon absolutely positioned in the top-right corner. Body is a `ScrollView` wrapping `UserProfileView` with `isOwnProfile={false}`. While `loading` is true, the body area shows a centered `ActivityIndicator`. The `💬` icon remains visible during loading so the user can dismiss immediately if desired.

**Expected File Paths:**
- Create: `src/components/friends/FriendProfileModal.tsx`

**Props interface:**
```ts
interface FriendProfileModalProps {
  visible: boolean;
  profile: Profile | null;
  photos: ProfilePhoto[];
  intent: WorkIntent | null;
  loading: boolean;
  onDismiss: () => void;
  onMessage: () => void;
}
```

**Verification:** RUNBOOK Phase 6 — Flow 34 (Open profile modal from Friends tab)

**Known Risks / TODOs:**
- If `profile` is null after fetch completes (deleted account edge case), modal will show spinner indefinitely. Consider adding error state.
- Test on Android: `presentationStyle="pageSheet"` is iOS-only; on Android, `Modal` renders full-screen. Verify UX is acceptable or add Android-specific adjustments.

---

## P6-02 — `FriendCard` split tap zones

**Status:** NOT STARTED

**Intended Behavior:**
Inner `TouchableOpacity` wrapping only the avatar `<View>`. When `onProfilePress` is provided and user taps the avatar, `onProfilePress` fires. When user taps anywhere else on the card (name, meta text, availability dot, card body), the outer `onPress` (chat) fires. When `onProfilePress` is not provided, the inner touchable is `disabled={true}` so the outer press still fires on avatar tap.

**Expected File Paths:**
- Modify: `src/components/friends/FriendCard.tsx`

**Verification:** RUNBOOK Phase 6 — Flow 35 (Verify card tap zones)

**Known Risks / TODOs:**
- React Native nested `TouchableOpacity` event propagation: inner press must NOT bubble to outer. This works correctly on iOS; verify on Android emulator.
- Avatar is 40×40pt — within the 44pt minimum touch target guideline when combined with padding. No size change needed.

---

## P6-03 — `FriendsScreen` wiring

**Status:** NOT STARTED

**Intended Behavior:**
Three new state fields track the target friend, loading state, and fetched data. `handleOpenProfile(friend)` opens the modal immediately (spinner visible), then calls `getFullProfile` and `getTodayIntent` in parallel via `Promise.all`. On resolution, sets `profileData` and clears loading. `FriendProfileModal` is rendered at the bottom of the JSX tree outside the `ScrollView`. When `onMessage` fires, modal closes and `openChat(profileModalFriend)` is called.

**Expected File Paths:**
- Modify: `src/screens/friends/FriendsScreen.tsx`

**New Imports Required:**
- `getFullProfile` from `../../services/profileService`
- `getTodayIntent` from `../../services/discoveryService`
- `FriendProfileModal` from `../../components/friends/FriendProfileModal`
- `Profile`, `ProfilePhoto`, `WorkIntent` from `../../types`

**Verification:** RUNBOOK Phase 6 — Flows 34–36

**Known Risks / TODOs:**
- Race condition: if user taps two different friend avatars quickly, the second fetch resolves and overwrites `profileData` while the first modal is open. For MVP this is acceptable (latest data wins). Post-MVP: add request cancellation or a request ID guard.
- `getTodayIntent` may return null if the friend has no intent today — `UserProfileView` handles null gracefully (hides the Today's Focus card on non-own profiles).

---

## TypeScript

All new and modified files must pass `npx tsc --noEmit` with zero errors before marking any ticket complete.
