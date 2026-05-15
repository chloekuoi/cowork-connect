# Design Spec: Onboarding Photo Screen

**Date:** 2026-05-15
**Status:** Approved

---

## Overview

Add a dedicated photo upload screen to the cinematic onboarding flow, placed immediately after the Identity screen (name + profile photo circle). The screen presents a 3+2 grid of 5 photo slots with the same prompts used in Edit Profile. Photos are optional — the screen is always skippable.

---

## Screen: PhotoScreen

### Placement
Step 2 in the flow, right after IdentityScreen. Total steps increase from 9 to 10.

**Updated flow:**

| Step | Screen |
|------|--------|
| 0 | Hook |
| 1 | Identity — name + photo circle (slot 0) |
| 2 | **Photos (new)** |
| 3 | Birthday |
| 4 | Building |
| 5 | About (role) |
| 6 | Looking For |
| 7 | Notifications |
| 8 | Contact Sync |
| 9 | Success |

### Layout
- Follows the cinematic onboarding aesthetic: cream background (`t.bg`), dark green text, serif fonts, lower-anchor layout (wordmark at top, `spacer: flex:1` pushes content down)
- TypewriterText question: `"put a face to the name."` with `startDelay={300}`
- **3+2 photo grid**: two rows — top row has 3 equal slots, bottom row has 2 equal slots + an invisible spacer (so the last row is left-aligned, not stretched)
- `ProgressBar` at bottom, always has `onNext` (photos optional), `nextLabel="skip"`
- `"skip for now"` text link sits between the grid and the ProgressBar, calls `onNext` directly

### Photo slots

| Position | Prompt | Subtitle |
|----------|--------|----------|
| 0 | Hi, I'm a real person 👋 | Not a stock photo, promise |
| 1 | Proof I touch grass sometimes | Hobbies, activities, general humanness |
| 2 | What my camera roll actually looks like | Candid is an understatement |
| 3 | Currently building something... | Still figuring it out, send help |
| 4 | Add photo 5 | *(none)* |

- Slot 0 has a green dashed border (`t.accentDark`) to distinguish it as primary; all other slots use the muted cream style
- Slot 0 is pre-populated if the user already picked a photo on IdentityScreen (shows the image instead of the prompt)
- Tapping a filled slot re-opens the image picker (replaces the photo)
- Tapping an empty slot opens the image picker
- Uses `expo-image-picker` via the existing `pickImage()` helper from `photoService`
- No delete action on this screen — users can manage photos in Edit Profile after onboarding

### Implementation note
`PhotoScreen` is a **custom component** using onboarding theming (`onboardingTheme`). It does not reuse the existing `PhotoSlots` component, which is styled for the main-app theme.

---

## State changes

### `OnboardingState` (CinematicOnboardingFlow.tsx)

Replace:
```ts
photoUri: string | null;
```
With:
```ts
photoUris: (string | null)[];   // index = position (0–4)
```

`INITIAL_STATE` initialises as:
```ts
photoUris: [null, null, null, null, null],
```

### IdentityScreen.tsx

The photo circle reads and writes `photoUris[0]`:

```ts
// Read
const photoUri = state.photoUris[0];

// Write
setState(s => {
  const next = [...s.photoUris];
  next[0] = result.assets[0].uri;
  return { ...s, photoUris: next };
});
```

### PhotoScreen.tsx

Each slot reads `state.photoUris[position]` and writes using the same array-copy pattern as above.

---

## Upload changes (onboardingService.ts)

Replace the single `uploadPhoto(userId, state.photoUri, 0)` call with a loop over all slots:

```ts
await Promise.allSettled(
  state.photoUris.map((uri, position) =>
    uri ? uploadPhoto(userId, uri, position) : Promise.resolve()
  )
);
```

`Promise.allSettled` ensures one failed upload does not block the others or the overall onboarding completion.

---

## Files to create / modify

| File | Change |
|------|--------|
| `src/screens/auth/onboarding/screens/PhotoScreen.tsx` | **Create** — 3+2 grid, prompts, TypewriterText |
| `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx` | `photoUri` → `photoUris[]`, TOTAL_STEPS 9→10, import + wire PhotoScreen as case 2, shift cases 3–9 |
| `src/screens/auth/onboarding/screens/IdentityScreen.tsx` | Circle reads/writes `photoUris[0]` instead of `photoUri` |
| `src/screens/auth/onboarding/onboardingService.ts` | Upload loop over `photoUris` using `Promise.allSettled` |

---

## Out of scope

- Deleting or reordering photos within the onboarding flow (available in Edit Profile)
- Camera capture (library picker only, consistent with existing IdentityScreen behaviour)
- Showing upload progress during the photo step (uploads happen at completion in SuccessScreen)
