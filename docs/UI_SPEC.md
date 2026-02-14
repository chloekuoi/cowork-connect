# UI Specification (As-Built)

**Last Updated:** 2026-02-06 (Phase 2)

---

## Screens

### 1. DiscoverScreen (State Machine)

**File:** `src/screens/discover/DiscoverScreen.tsx`

Renders one of 5 states based on conditions:

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Location loading OR data fetching | Centered spinner + "Finding co-workers nearby..." |
| `needs_location` | Location permission denied/error | Title + explanation + "Enable Location" button |
| `needs_intent` | No intent for today | Renders IntentScreen |
| `discovering` | Has intent + cards available | Header + CardStack |
| `empty` | Has intent + no cards | Magnifying glass emoji + "No one nearby" + Refresh button |

**Layout (discovering state):**
```
┌─────────────────────────┐
│ SafeAreaView            │
│ ┌─────────────────────┐ │
│ │ Header              │ │
│ │ "Discover"          │ │
│ │ "3 people nearby"   │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │    CardStack        │ │
│ │                     │ │
│ │                     │ │
│ └─────────────────────┘ │
│      [X]     [♥]        │
└─────────────────────────┘
```

---

### 2. IntentScreen

**File:** `src/screens/discover/IntentScreen.tsx`

**Purpose:** Form for setting today's work intent

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView            │
│ ┌─────────────────────┐ │
│ │ "Set Your Intent"   │ │
│ │ subtitle            │ │
│ └─────────────────────┘ │
│                         │
│ What are you working on?│
│ ┌─────────────────────┐ │
│ │ TextInput (3 lines) │ │
│ └─────────────────────┘ │
│                         │
│ Work style              │
│ [Deep focus] [Happy...] │
│ [Pomodoro fan][Flexible]│
│                         │
│ Location preference     │
│ [Cafe] [Library]        │
│ [Video Call] [Anywhere] │
│                         │
│ Spot name (conditional) │
│ ┌─────────────────────┐ │
│ │ TextInput           │ │
│ └─────────────────────┘ │
│                         │
│ Available               │
│ "14:00 - 18:00 today"   │
│                         │
│ [Start Discovering]     │
└─────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Task description | TextInput (multiline, 3 lines, min 100px) | Yes | Empty |
| Work style | Tag selection (single) | Yes | "Flexible" |
| Location type | Tag selection (single) | Yes | "Anywhere" |
| Spot name | TextInput (single line, 48px) | No | Empty |
| Availability | Display only (read-only Text) | Auto | Current hour + 4 hours |

**Conditional Logic:**
- "Spot name" field only shows when Location type is "Cafe" or "Library"
- Availability auto-calculated, not user-editable
- Button shows loading spinner during submission

---

## Components

### Button

**File:** `src/components/common/Button.tsx`

**Variants:**

| Variant | Background | Text Color | Border |
|---------|------------|------------|--------|
| `primary` | `#A8B5A2` (sage) | `#FFFFFF` | None |
| `secondary` | `#E8DCD0` (cream) | `#2D3A2D` | 1px `#A8B5A2` |
| `ghost` | Transparent | `#A8B5A2` | None |

**Props:**
- `title`: string
- `onPress`: () => void
- `variant`: 'primary' | 'secondary' | 'ghost' (default: 'primary')
- `disabled`: boolean (0.5 opacity when true)
- `loading`: boolean (shows ActivityIndicator)
- `style`: ViewStyle (optional)
- `textStyle`: TextStyle (optional)

**Sizing:**
- Min height: 44px (touch target)
- Horizontal padding: 24px
- Vertical padding: 12px
- Border radius: 12px
- Font: 16px, weight 600

---

### Tag

**File:** `src/components/common/Tag.tsx`

**States:**

| State | Background | Border | Text |
|-------|------------|--------|------|
| Unselected | `#FFFFFF` | 1.5px `#E8DCD0` | `#2D3A2D` |
| Selected | `#A8B5A2` | 1.5px `#A8B5A2` | `#FFFFFF` |

**Sizes:**

| Size | Padding H | Padding V | Font |
|------|-----------|-----------|------|
| `sm` | 8px | 4px | 12px |
| `md` | 16px | 8px | 14px |

**Props:**
- `label`: string
- `selected`: boolean (default: false)
- `onPress`: () => void (optional — static display if omitted)
- `size`: 'sm' | 'md' (default: 'md')
- `style`: ViewStyle (optional)

---

### SwipeCard

**File:** `src/components/discover/SwipeCard.tsx`

**Dimensions:**
- Width: `SCREEN_WIDTH - 32px`
- Height: `width × 1.3` (aspect ratio)
- Border radius: 24px
- Shadow: 0 4px 12px rgba(0,0,0,0.15)

**Layout:**
```
┌─────────────────────────┐
│                         │
│   Photo / Initials      │  55% height
│                         │
│ ┌─────────────────────┐ │
│ │ Name          1.2km │ │  Overlay (rgba 0.3)
│ │ Work type           │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ WORKING ON              │  45% height
│ Task description...     │
│                         │
│ [Deep focus] [Cafe]     │
│                         │
│ Coffee House  14:00-18  │
└─────────────────────────┘
```

**Photo Area (55% height):**
- If `photo_url` exists: expo-image with `contentFit="cover"`
- If no photo: `#D4DCD1` background with initials
  - Initials: 64px, weight 700, color `#6F8268`
  - Shows first letters of first/last name, max 2 chars
  - Falls back to "?" if no name
- Overlay: `rgba(0,0,0,0.3)` solid (no gradient)

**Details Section (45% height):**
- Padding: 16px all sides
- "WORKING ON" label: 12px uppercase, `#968D82`, letter-spacing 0.5
- Task: 16px weight 500, max 2 lines with numberOfLines={2}
- Tags row: Two `sm` size tags, selected state, 8px gap
- Meta row: flexDirection row, justifyContent space-between
  - Location name (left, if exists)
  - Availability "HH:MM - HH:MM" (right)

---

### CardStack

**File:** `src/components/discover/CardStack.tsx`

**Structure:**
- Current card: Top layer, gesture-enabled
- Next card: Behind, scale 0.95, zIndex -1
- Only 2 cards rendered at once

**Gesture Thresholds:**
- Position threshold: 30% of screen width
- Velocity threshold: 800

**Animations (react-native-reanimated):**

| Animation | Values | Easing |
|-----------|--------|--------|
| Card rotation | -15° to +15° based on translateX | interpolate, CLAMP |
| LIKE stamp opacity | 0 to 1 as translateX → threshold | interpolate, CLAMP |
| NOPE stamp opacity | 0 to 1 as translateX → -threshold | interpolate, CLAMP |
| Next card scale | 0.95 to 1.0 based on abs(translateX) | interpolate, CLAMP |
| Swipe exit | 1.5× screen width | withTiming, 300ms |
| Snap back | Spring to 0 | withSpring, damping 15 |

**Stamp Styling:**
- Position: absolute, top 50px
- LIKE: left 20px, rotated -15°, green border 4px
- NOPE: right 20px, rotated +15°, red border 4px
- Text: 32px, weight 800, letter-spacing 2

---

### SwipeButtons

**File:** `src/components/discover/SwipeButtons.tsx`

**Layout:**
```
        [X]          [♥]
        64px         64px
        gap: 32px
```

**Button Styling:**

| Button | Size | Background | Border | Icon |
|--------|------|------------|--------|------|
| X (Nope) | 64×64px | `#FFFFFF` | 2px `#B57070` | "✕" 28px `#B57070` |
| Heart (Like) | 64×64px | `#FFFFFF` | 2px `#6B9B6B` | "♥" 28px `#6B9B6B` |

- Border radius: 32px (circular)
- Shadow: 0 2px 8px rgba(0,0,0,0.15)
- Container margin-top: 24px from card stack

---

## Interactions

### Intent Form Submission

1. User taps "Start Discovering"
2. **Validation:** If task empty → `Alert.alert('Missing info', '...')`
3. **Loading:** Button shows ActivityIndicator, disabled
4. **Save:** Calls `upsertIntent()` with form data + coordinates
5. **Success:** Calls `onIntentSet()` → parent reloads discovery data
6. **Error:** `Alert.alert('Error', 'Failed to save...')`

### Card Swiping

**Gesture Flow:**
1. Pan starts → `translateX` and `translateY` update
2. Card rotates, stamps fade in based on direction
3. Pan ends:
   - If `|translateX| > 30%` OR `|velocityX| > 800` → complete swipe
   - Otherwise → spring back to center

**Swipe Completion:**
1. Card animates to `±1.5 × screenWidth` (300ms)
2. `onSwipe(card, direction)` called
3. `currentIndex` increments
4. `translateX/Y` reset to 0
5. If `currentIndex >= cards.length` → `onEmpty()` called

**Match Detection:**
1. After recording right swipe, `check_match` RPC is called
2. If returns true → `Alert.alert("It's a Match!", ...)`

### Location Permission

1. `useLocation` hook mounts → `requestForegroundPermissionsAsync()`
2. **Granted:** `getCurrentPositionAsync()` → state updates with coordinates
3. **Denied:** `error` state set → `needs_location` UI shown
4. **Retry:** User taps "Enable Location" → `refresh()` called → re-requests

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Location permission denied | Shows "Location Required" with retry button |
| Location fetch times out | Treated as error, shows needs_location state |
| No intent for today | Shows IntentScreen automatically |
| Intent exists, 0 nearby users | Shows empty state with magnifying glass emoji |
| All cards swiped | Transitions to empty state via `onEmpty()` |
| Network error on swipe | `console.error`, UI continues (no user alert) |
| Match detected | Native Alert: "It's a Match!" with "Awesome!" button |
| Task text > 2 lines | Truncated with `numberOfLines={2}` |
| No profile photo | Shows initials on sage background |
| No profile name | Shows "Anonymous" |
| Availability would exceed midnight | Capped at 23:00 (`Math.min(fromHour + 4, 23)`) |
| Empty task on submit | Alert prevents submission |
| User not logged in | Alert "You must be logged in" (shouldn't happen in normal flow) |

---

## Known UI Bugs / Compromises

### 1. No True Gradient on Card Photo
**Issue:** React Native doesn't support CSS `background-image: linear-gradient()`.
**Compromise:** Using solid semi-transparent overlay (`rgba(0,0,0,0.3)`) instead.
**Impact:** Photo overlay is uniform rather than fading from transparent to dark.
**Fix:** Install `expo-linear-gradient` and use `<LinearGradient>` component.

### 2. Availability Not User-Editable
**Issue:** No time picker implemented.
**Compromise:** Auto-set to current hour + 4 hours, displayed as read-only text.
**Impact:** Users cannot customize their availability window.
**Fix:** Add time picker modal or inline time selection.

### 3. No Undo on Swipe
**Issue:** Accidental swipes cannot be reversed.
**Compromise:** None implemented.
**Impact:** Users who accidentally swipe left lose that potential match for the day.
**Fix:** Add "Undo" button or swipe-back gesture.

### 4. Stamps Use Text, Not Icons
**Issue:** "LIKE" and "NOPE" are text stamps with borders.
**Compromise:** Styled text instead of checkmark/X iconography.
**Impact:** More text-heavy than typical swipe apps (Tinder uses icons).
**Fix:** Replace with icon assets or SF Symbols.

### 5. Match Alert Uses Native Alert
**Issue:** Match notification is basic `Alert.alert()`.
**Compromise:** No custom modal, animation, or profile preview.
**Impact:** Lacks celebratory feel, no way to immediately message.
**Fix:** Create custom MatchModal component with confetti animation.

### 6. Cards Not Paginated
**Issue:** All cards loaded in single fetch.
**Compromise:** `fetchDiscoveryCards()` returns full array.
**Impact:** May be slow with many users; memory usage scales with count.
**Fix:** Implement cursor-based pagination, fetch 10 at a time.

### 7. Distance Calculated Client-Side
**Issue:** Haversine formula runs in JavaScript.
**Compromise:** Fetches ALL intents for today, then filters by distance.
**Impact:** Inefficient for large datasets; unnecessary data transfer.
**Fix:** Use PostGIS `ST_DWithin()` in Supabase query.

### 8. Button Row May Overlap Safe Area
**Issue:** Swipe buttons use fixed margin from cards.
**Compromise:** No dynamic adjustment for short screens.
**Impact:** On iPhone SE or similar, buttons may feel cramped.
**Fix:** Use flex layout with min spacing, or hide buttons on very small screens.

### 9. Only 2 Cards Rendered
**Issue:** `CardStack` only renders current + next card.
**Compromise:** Third card not pre-rendered.
**Impact:** No visible "depth" to the stack like Tinder shows.
**Fix:** Render 3 cards with progressive scale (1.0, 0.95, 0.9).

---

## Typography Summary

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Screen title | 28px | 700 | `#2D3A2D` |
| Screen subtitle | 16px | 400 | `#756C62` |
| Form label | 16px | 600 | `#2D3A2D` |
| Form input | 16px | 400 | `#2D3A2D` |
| Form placeholder | 16px | 400 | `#968D82` |
| Card name | 24px | 700 | `#FFFFFF` |
| Card work type | 14px | 400 | `rgba(255,255,255,0.8)` |
| Card section label | 12px | 500 | `#968D82` (uppercase) |
| Card task | 16px | 500 | `#2D3A2D` |
| Card meta | 13px | 400 | `#756C62` |
| Stamp text | 32px | 800 | `#6B9B6B` / `#B57070` |
| Tag (sm) | 12px | 500 | varies |
| Tag (md) | 14px | 500 | varies |
| Button | 16px | 600 | varies |
| Empty state title | 24px | 600 | `#2D3A2D` |
| Empty state text | 16px | 400 | `#756C62` |
| Loading text | 16px | 400 | `#756C62` |

---

## Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| `theme.primary` | `#A8B5A2` | Buttons, selected tags, icons |
| `theme.accent` | `#5C6B57` | Important actions |
| `theme.background` | `#F7F5F2` | Screen backgrounds |
| `theme.surface` | `#FFFFFF` | Cards, inputs |
| `theme.highlight` | `#E8DCD0` | Secondary backgrounds, borders |
| `theme.text` | `#2D3A2D` | Primary text |
| `theme.textSecondary` | `#756C62` | Secondary text |
| `theme.textMuted` | `#968D82` | Placeholders, labels |
| `colors.swipeRight` | `#6B9B6B` | Like button, LIKE stamp |
| `colors.swipeLeft` | `#B57070` | Nope button, NOPE stamp |

---
---

# Phase 3: Matching & Messaging

**Added:** 2026-02-07

---

## Screens

### 3. MatchesListScreen

**File:** `src/screens/matches/MatchesListScreen.tsx`

**Purpose:** Display all matches with last message preview, navigate to chat

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView            │
│ ┌─────────────────────┐ │
│ │ "Matches"           │ │  Screen title
│ │ "X conversations"   │ │  Subtitle with count
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ MatchCard           │ │  FlatList
│ │ ─────────────────── │ │  Separator line
│ │ MatchCard           │ │
│ │ ─────────────────── │ │
│ │ MatchCard           │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Initial fetch in progress | Centered spinner + "Loading matches..." |
| `empty` | No matches exist | Centered illustration + "No matches yet" + "Keep swiping to find co-workers!" |
| `list` | Has matches | FlatList of MatchCard components |

**Interactions:**
- Tap a MatchCard → navigate to ChatScreen with `matchId` and `otherUser` params
- Pull-to-refresh → refetch matches list
- Screen focus → refetch matches list (React Navigation `useFocusEffect`)

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| 0 matches | Empty state with encouragement text |
| Match with no messages | MatchCard shows "Say hello!" as preview |
| New match appears while viewing list | Visible on next pull-to-refresh or tab focus |
| Network error on fetch | Show last loaded data, no error toast for MVP |

---

### 4. ChatScreen

**File:** `src/screens/matches/ChatScreen.tsx`

**Purpose:** Real-time 1:1 messaging between matched users

**Route Params:**
- `matchId`: string (UUID of the match)
- `otherUser`: `{ id, name, photo_url }` (other user's profile subset)

**Layout:**
```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │ ← Back   Alex Chen  │ │  Header with name + back button
│ └─────────────────────┘ │
│                         │
│     ┌──────────────┐   │
│     │ Hey! Want to  │   │  Received bubble (left, cream)
│     │ work at Blue  │   │
│     │ Bottle today? │   │
│     └──────────────┘   │
│                         │
│   ┌──────────────┐     │
│   │ Yes! I'll be  │     │  Sent bubble (right, sage)
│   │ there at 2pm  │     │
│   └──────────────┘     │
│                         │
│ ┌─────────────────────┐ │
│ │ [Type a message...]│↑│ │  Input bar + send button
│ └─────────────────────┘ │
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Fetching messages | Centered spinner |
| `empty` | No messages yet | Centered "Start the conversation!" + wave emoji |
| `chatting` | Has messages | Message list + input bar |

**Interactions:**
- Type in input → enables send button
- Tap send → inserts message, clears input, scrolls to bottom
- New message arrives via Realtime → appends to list, scrolls to bottom
- Back button → returns to MatchesListScreen
- Screen mount → calls `markChatRead` to clear unread
- New incoming message while on screen → calls `markChatRead`

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Empty input | Send button is disabled (opacity 0.4) |
| Very long message | TextInput grows up to 4 lines, then scrolls internally |
| Send fails (network) | Message stays in input, `Alert.alert('Failed to send')` |
| Other user sends while typing | New message appears above, does not disrupt typing |
| Keyboard open | KeyboardAvoidingView pushes input bar above keyboard |
| 100+ messages | FlatList (inverted) handles scrolling, no pagination for MVP |

---

## Components

### MatchModal

**File:** `src/components/matches/MatchModal.tsx`

**Purpose:** Celebratory overlay shown when a mutual match is detected

**Props:**
- `visible`: boolean
- `currentUser`: Profile (logged-in user)
- `matchedUser`: Profile (the other person)
- `matchId`: string
- `onSendMessage`: (matchId: string, matchedUser: Profile) => void
- `onDismiss`: () => void

**Layout:**
```
┌─────────────────────────┐
│ ████████████████████████ │  Semi-transparent overlay
│ ██                    ██ │  rgba(0,0,0,0.6)
│ ██   ┌────┐ ┌────┐   ██ │
│ ██   │You │ │Them│   ██ │  Two circular photos, 80px
│ ██   └────┘ └────┘   ██ │  16px gap between
│ ██                    ██ │
│ ██  It's a Match! 🎉  ██ │  28px, weight 700, white
│ ██                    ██ │
│ ██  You and Alex both ██ │  16px, weight 400, white 0.8
│ ██  want to co-work!  ██ │
│ ██                    ██ │
│ ██ [  Send Message  ] ██ │  Primary button (white bg, sage text)
│ ██                    ██ │
│ ██   Keep Swiping     ██ │  Ghost button (white text)
│ ██                    ██ │
│ ████████████████████████ │
└─────────────────────────┘
```

**Photo Circles:**
- Size: 80 x 80px
- Border radius: 40px (circular)
- Border: 3px white
- If no photo_url: show initials on `#D4DCD1` background
- Current user on left, matched user on right

**Button Styling:**
- "Send Message": white background, `#5C6B57` text, weight 600, full width, 48px height, borderRadius 12px
- "Keep Swiping": transparent, white text, weight 500, no border

**Animation:**
- Modal appears with fade-in (opacity 0 → 1, 300ms)
- Content card scales in (0.8 → 1.0, spring)

---

### MatchCard

**File:** `src/components/matches/MatchCard.tsx`

**Purpose:** Single row in the matches list showing a match with message preview

**Props:**
- `matchPreview`: MatchPreview
- `onPress`: () => void

**Layout:**
```
┌─────────────────────────────────────┐
│ ┌────┐  Alex Chen         2m ago   │  Row height: 72px
│ │photo│  Hey! Want to work at...   │  Padding: 16px horizontal
│ └────┘                        ●    │  Unread dot (right)
└─────────────────────────────────────┘
```

**Photo:**
- Size: 48 x 48px
- Border radius: 24px (circular)
- If no photo_url: initials on `#D4DCD1` background
- Initials: 18px, weight 600, color `#6F8268`

**Text Layout:**
- Name: 16px, weight 600, color `#2D3A2D`. Bold (weight 700) when unread.
- Message preview: 14px, weight 400, color `#756C62`. numberOfLines={1}. Shows "Say hello!" in italic if no messages.
- Timestamp: 13px, weight 400, color `#968D82`. Top-right aligned.

**Unread Indicator:**
- Green dot: 10px diameter, `#6B9B6B`
- Positioned right side, vertically centered
- Only visible when `unread_count > 0`

**Separator:**
- 1px line, color `#E2DDD6`
- Left inset: 80px (aligned past the photo)

**Touch:**
- Minimum height: 72px (exceeds 44pt touch target)
- Touchable feedback: opacity reduction on press

---

### MessageBubble

**File:** `src/components/matches/MessageBubble.tsx`

**Purpose:** Individual message in the chat

**Props:**
- `message`: Message
- `isMine`: boolean

**Layout — Sent (isMine = true):**
```
                    ┌──────────────┐
                    │ Message text │  Right-aligned
                    │              │  Background: #A8B5A2 (sage)
                    └──────────────┘  Text: #FFFFFF
                              12:34   Timestamp below, right
```

**Layout — Received (isMine = false):**
```
┌──────────────┐
│ Message text │                      Left-aligned
│              │                      Background: #E8DCD0 (cream)
└──────────────┘                      Text: #2D3A2D
12:34                                 Timestamp below, left
```

**Bubble Styling:**
- Max width: 75% of screen width
- Padding: 12px horizontal, 8px vertical
- Border radius: 16px
- Sent: bottom-right radius 4px (chat tail effect)
- Received: bottom-left radius 4px (chat tail effect)

**Timestamp:**
- Format: "HH:MM" (24-hour)
- Size: 11px, weight 400
- Color: `#968D82`
- Margin-top: 4px from bubble
- Aligned to same side as bubble

**Spacing:**
- Vertical gap between messages: 8px
- Same-sender consecutive: 4px gap (tighter)
- Different-sender: 12px gap (wider, visual grouping)

---

### ChatInputBar

**File:** `src/components/matches/ChatInputBar.tsx`

**Purpose:** Text input and send button at bottom of chat

**Props:**
- `onSend`: (content: string) => void
- `disabled`: boolean (optional, default false)

**Layout:**
```
┌─────────────────────────────────────┐
│ ┌────────────────────────────┐ ┌──┐ │
│ │ Type a message...          │ │ ↑│ │  Input + circular send button
│ └────────────────────────────┘ └──┘ │
└─────────────────────────────────────┘
```

**Input Styling:**
- Background: `#EFEBE6` (neutral.100)
- Border radius: 24px (pill)
- Padding: 12px horizontal, 10px vertical
- Font: 16px, weight 400, color `#2D3A2D`
- Placeholder: "Type a message..." color `#968D82`
- Min height: 40px
- Max height: 100px (4 lines, then scrolls)
- Multiline: true

**Send Button:**
- Size: 40 x 40px
- Border radius: 20px (circular)
- Background: `#A8B5A2` (sage) when enabled
- Background: `#D4DCD1` (sage.200) when disabled
- Icon: "↑" arrow, 20px, white, weight 700
- Margin-left: 8px from input
- Disabled when input is empty (trimmed)

**Container:**
- Background: `#FFFFFF`
- Border-top: 1px `#E2DDD6`
- Padding: 8px horizontal, 8px vertical
- Safe area bottom padding (for devices with home indicator)

---

## Phase 3 Typography Additions

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Match modal title | 28px | 700 | `#FFFFFF` |
| Match modal subtitle | 16px | 400 | `rgba(255,255,255,0.8)` |
| Match modal button | 16px | 600 | `#5C6B57` |
| Match modal ghost button | 16px | 500 | `#FFFFFF` |
| Matches screen title | 28px | 700 | `#2D3A2D` |
| Matches screen subtitle | 16px | 400 | `#756C62` |
| Match card name | 16px | 600 | `#2D3A2D` |
| Match card name (unread) | 16px | 700 | `#2D3A2D` |
| Match card message preview | 14px | 400 | `#756C62` |
| Match card timestamp | 13px | 400 | `#968D82` |
| Chat header name | 18px | 600 | `#2D3A2D` |
| Message text (sent) | 16px | 400 | `#FFFFFF` |
| Message text (received) | 16px | 400 | `#2D3A2D` |
| Message timestamp | 11px | 400 | `#968D82` |
| Chat input text | 16px | 400 | `#2D3A2D` |
| Chat input placeholder | 16px | 400 | `#968D82` |
| Chat empty state | 18px | 500 | `#756C62` |
| Matches empty state title | 24px | 600 | `#2D3A2D` |
| Matches empty state text | 16px | 400 | `#756C62` |

---
---

# Phase 4: Sessions

**Added:** 2026-02-08

---

## Screens

### 5. ActiveSessionScreen

**File:** `src/screens/session/ActiveSessionScreen.tsx`

**Purpose:** Dedicated view of the current active session with co-worker info and manual end option

**Route Params:**
- `sessionId`: string (UUID of the session)
- `otherUser`: `{ id, name, photo_url }` (co-worker's profile subset)

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView             │
│ ┌─────────────────────┐  │
│ │ ← Back              │  │  Header with back button
│ │ "Active Session"    │  │
│ └─────────────────────┘  │
│                          │
│        ┌────────┐        │
│        │  photo │        │  80x80px, circular
│        │   or   │        │
│        │initials│        │
│        └────────┘        │
│                          │
│      [Co-worker Name]    │  20px, weight 600, #2D3A2D
│      [Work type]         │  14px, weight 400, #756C62
│                          │
│ ┌──────────────────────┐ │
│ │ Session Details      │ │  Card, white bg, 16px padding
│ │                      │ │  Border radius 16px
│ │ Status    ● Active   │ │  Green dot + "Active"
│ │ Started   2:00 PM    │ │  accepted_at formatted
│ │ Date      Today      │ │  session_date
│ └──────────────────────┘ │
│                          │
│ [    End Session     ]   │  Primary button, full width
│                          │
│ Session will auto-       │  13px, #968D82, centered
│ complete at end of day   │
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Fetching session data | Centered spinner |
| `active` | Session is active | Full layout as above |
| `not_found` | Session not found or already completed | "Session not found" + back button |

**Interactions:**
- "End Session" button → calls `completeSession()` → navigates to SessionComplete screen
- Back button → returns to ChatScreen
- "End Session" shows loading spinner during API call

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Session completed by other user while viewing | Realtime update navigates to SessionComplete |
| Session auto-completed while viewing | Same as above |
| Network error on end session | Alert with error, stays on screen |

---

### 6. SessionCompleteScreen

**File:** `src/screens/session/SessionCompleteScreen.tsx`

**Purpose:** Summary view after a session ends

**Route Params:**
- `sessionId`: string (UUID of the session)
- `otherUser`: `{ id, name, photo_url }` (co-worker's profile subset)

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView             │
│                          │
│        ┌────────┐        │
│        │  photo │        │  80x80px, circular
│        │   or   │        │
│        │initials│        │
│        └────────┘        │
│                          │
│   "Session Complete!"    │  24px, weight 700, #2D3A2D
│                          │
│   You co-worked with     │  16px, weight 400, #756C62
│   [Name] today           │
│                          │
│ ┌──────────────────────┐ │
│ │ Date     Feb 8, 2026 │ │  Card, white bg, 16px padding
│ │ Duration ~4 hours    │ │  Approx (accepted_at → completed_at)
│ └──────────────────────┘ │
│                          │
│ [   Back to Chat    ]    │  Primary button, full width
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Fetching session data | Centered spinner |
| `complete` | Session data loaded | Full layout as above |

**Interactions:**
- "Back to Chat" → pops back to ChatScreen

**Duration Calculation:**
- If `accepted_at` and `completed_at` both exist: `completed_at - accepted_at` formatted as hours/minutes
- If `completed_at` is missing (edge case): show "—"
- Round to nearest 15 minutes for display (e.g., "~2 hours", "~45 minutes")

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Auto-completed session (completed_at = end of day) | Duration calculated from accepted_at to end of session_date |
| Session date was yesterday | Shows actual date, not "today" |
| Very short session (< 5 min) | Shows "< 5 minutes" |

---

## Components

### SessionRequestCard

**File:** `src/components/session/SessionRequestCard.tsx`

**Purpose:** Inline card rendered in the chat timeline showing session status and actions

**Props:**
- `session`: Session
- `currentUserId`: string
- `onAccept`: (sessionId: string) => void
- `onDecline`: (sessionId: string) => void
- `onCancel`: (sessionId: string) => void
- `onViewSession`: (sessionId: string) => void
- `onViewSummary`: (sessionId: string) => void

**Card Base Styling:**
- Width: 100% of chat content area (no left/right alignment)
- Background: `#F7F5F2` (app background)
- Border: 1.5px `#E8DCD0` (cream)
- Border radius: 16px
- Padding: 16px
- Margin: 12px vertical (same as different-sender message gap)
- Centered horizontally in chat

**Status Variants:**

#### Pending — Invitee View
```
┌─────────────────────────┐
│ 📋  Session Request      │  Label: 13px, weight 600, #5C6B57
│                          │
│ [Name] wants to          │  14px, weight 400, #2D3A2D
│ co-work with you today   │
│                          │
│  [Accept]    [Decline]   │  Side by side, 12px gap
└─────────────────────────┘
```
- "Accept" button: primary variant (sage bg, white text)
- "Decline" button: ghost variant (#B57070 text)

#### Pending — Initiator View
```
┌─────────────────────────┐
│ 📋  Session Request      │
│                          │
│ You invited [Name]       │
│ to co-work today         │
│                          │
│ Waiting for response...  │  14px, italic, #968D82
│                          │
│       [Cancel]           │  Ghost variant, centered
└─────────────────────────┘
```

#### Active
```
┌─────────────────────────┐
│ ✅  Session Active       │  Label: 13px, weight 600, #6B9B6B
│                          │
│ Co-working with [Name]   │
│ Started at [time]        │  14px, #756C62
│                          │
│    [View Session]        │  Secondary button, centered
└─────────────────────────┘
```
- Border color changes to `#6B9B6B` (success green) with 1.5px

#### Declined
```
┌─────────────────────────┐
│ ✗  Session Declined      │  Label: 13px, weight 600, #B57070
│                          │
│ [Name] can't co-work     │  14px, #756C62
│ right now                │
└─────────────────────────┘
```
- Opacity: 0.7 (dimmed)
- No action buttons

#### Completed
```
┌─────────────────────────┐
│ ✅  Session Completed    │  Label: 13px, weight 600, #6B9B6B
│                          │
│ Co-worked with [Name]    │
│ [date]                   │  14px, #756C62
│                          │
│   [View Summary]         │  Ghost button, centered
└─────────────────────────┘
```

#### Cancelled
```
┌─────────────────────────┐
│ ✗  Session Cancelled     │  Label: 13px, weight 600, #968D82
│                          │
│ Session request was      │  14px, #968D82
│ cancelled                │
└─────────────────────────┘
```
- Opacity: 0.7 (dimmed)
- No action buttons

**Button Sizing:**
- Accept/Decline/Cancel: min height 40px, horizontal padding 20px, font 14px weight 600
- View Session/View Summary: min height 36px, font 14px weight 500

---

### StartSessionButton (Chat Header)

**File:** `src/components/session/StartSessionButton.tsx`

**Purpose:** Button in the chat header for initiating a session

**Props:**
- `onPress`: () => void
- `disabled`: boolean
- `hidden`: boolean

**Layout:**
```
[▶ Start Session]
```

**Styling:**
- Background: `#E8DCD0` (cream) when enabled
- Background: `#E2DDD6` (neutral.200) when disabled
- Text: 13px, weight 600, `#5C6B57` when enabled, `#B5ADA3` when disabled
- Icon: "▶" or play icon, 12px, same color as text
- Padding: 6px horizontal, 4px vertical
- Border radius: 8px
- Min touch target: 44px height (achieved via hit slop)

**States:**

| State | Condition | Appearance |
|-------|-----------|------------|
| `visible` | No active/pending session for this match | Normal styling, tappable |
| `disabled` | User has active/pending session in another match | Dimmed styling, not tappable |
| `hidden` | Active/pending session exists for THIS match | Not rendered |

---

## Phase 4 Interactions

### Start Session Flow

1. User A taps "Start Session" in chat header
2. Button shows brief loading state
3. `createSession(matchId, userId)` called
4. If success: session card appears in chat timeline (pending — initiator view)
5. If error (other user has active session): `Alert.alert('Cannot start session', 'One of you already has an active session')`
6. "Start Session" button becomes hidden (session exists for this match)

### Accept Session Flow

1. User B opens chat → sees session request card (pending — invitee view)
2. User B taps "Accept"
3. Button shows loading state (both buttons disabled)
4. `respondToSession(sessionId, userId, 'accept')` called
5. Card updates to "Session Active" state via Realtime or immediate state update
6. "Start Session" button hidden in all User B's other chats

### Decline Session Flow

1. User B taps "Decline" on session request card
2. `respondToSession(sessionId, userId, 'decline')` called
3. Card updates to "Session Declined" state
4. "Start Session" button becomes visible again in chat header

### Cancel Session Flow

1. User A (initiator) taps "Cancel" on their pending session card
2. `cancelSession(sessionId, userId)` called
3. Card updates to "Session Cancelled" state
4. "Start Session" button becomes visible again

### End Session Flow

1. User navigates to Active Session screen (via "View Session" on card)
2. Taps "End Session"
3. `completeSession(sessionId, userId)` called
4. Navigates to Session Complete screen with summary
5. Session card in chat updates to "Session Completed" state

### Auto-Complete Flow

1. App starts (user is authenticated)
2. `autoCompleteStaleSessions()` called silently
3. Any sessions with status='active' AND session_date < today → set to 'completed'
4. Next time user opens relevant chat, card shows "Session Completed"

---

## Phase 4 Edge Cases

| Scenario | Behavior |
|----------|----------|
| User A starts session, User B is offline | Card waits in pending state. User B sees it when they next open the chat. |
| Both users try to start session simultaneously | One succeeds, the other gets "already has active session" error. Race condition handled by database constraint. |
| User A starts session, then User A cancels, then starts again | Allowed. Cancelled sessions don't count toward the one-per-user limit. |
| Session still pending at end of day | Auto-complete only affects 'active' sessions. Pending sessions from previous days remain pending (stale). Initiator can cancel. |
| User A has active session with User B, tries to start session with User C | Blocked. One active/pending session per user across all matches. |
| User deletes account while session is active | ON DELETE CASCADE removes session and participants. |
| Chat has multiple historical sessions | All session cards render inline at their respective timestamps. Only the most recent pending/active session is "live." |
| Network error on accept/decline | Alert with error, card stays in pending state. User can retry. |
| View Session for a session that was just completed | Screen detects completed status, redirects to Session Complete screen. |

---

## Phase 4 Typography Additions

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Active Session header | 28px | 700 | `#2D3A2D` |
| Session co-worker name | 20px | 600 | `#2D3A2D` |
| Session co-worker subtitle | 14px | 400 | `#756C62` |
| Session detail label | 14px | 500 | `#968D82` |
| Session detail value | 14px | 500 | `#2D3A2D` |
| Session auto-complete hint | 13px | 400 | `#968D82` |
| Session Complete heading | 24px | 700 | `#2D3A2D` |
| Session Complete subtitle | 16px | 400 | `#756C62` |
| Session card label | 13px | 600 | varies by status |
| Session card body text | 14px | 400 | `#2D3A2D` |
| Session card secondary text | 14px | 400 | `#756C62` |
| Session card italic text | 14px | 400 italic | `#968D82` |
| Start Session button text | 13px | 600 | `#5C6B57` |

---

## Phase 3 Interactions

### Match Detection & Modal

1. User swipes right → `recordSwipe` called
2. If `check_match` returns true → `create_match` RPC called
3. MatchModal shown with `visible = true`
4. User taps "Send Message" → `onSendMessage(matchId, matchedUser)` called
5. DiscoverScreen navigates to `Matches` tab → `Chat` screen with params
6. OR user taps "Keep Swiping" → `onDismiss()` → modal hides, discovery continues

### Chat Send Flow

1. User types message in ChatInputBar
2. Send button enables (input not empty after trim)
3. User taps send
4. Message inserted to `messages` table via `sendMessage()`
5. Input clears
6. Message appears in list (optimistic: append immediately, or wait for insert response)
7. FlatList scrolls to bottom

### Chat Receive Flow (Real-time)

1. ChatScreen mounts → subscribes to `messages` table INSERT events for this `match_id`
2. Other user sends message → Supabase Realtime delivers event
3. New message appended to local messages array
4. FlatList scrolls to bottom
5. `markChatRead` called to update unread state

### Unread Badge Flow

1. MainTabs mounts → fetch unread count via `getUnreadCount(userId)`
2. Set `tabBarBadge` on Matches tab
3. On Matches tab focus → re-fetch unread count
4. After opening chat → `markChatRead` called → badge count decreases on next focus

---

## Phase 3 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Match already exists (re-swipe) | `create_match` returns existing match ID, no duplicate |
| User opens chat with 0 messages | Shows "Start the conversation!" empty state |
| Send message fails | Alert with error, message stays in input field |
| Real-time subscription disconnects | Messages still load on manual refresh or re-mount |
| Very long message text | Bubble wraps text, no max character limit for MVP |
| Both users send at same time | Both messages appear, ordered by `created_at` |
| User deletes account | ON DELETE CASCADE removes matches and messages |
| Match modal while card stack empty | Modal shows, "Keep Swiping" transitions to empty state |
| Navigate to chat from modal | Switches to Matches tab, pushes Chat screen onto stack |
| Back from chat | Returns to MatchesList, unread count refreshes |
