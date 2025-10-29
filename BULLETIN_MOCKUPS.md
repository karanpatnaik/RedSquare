# Bulletin Page Mockups - Brick Theme

## Concept Overview
A saved posts page with a brick/masonry layout that reflects Georgetown's historic brick architecture. The design uses the RedSquare color palette with a tactile, physical bulletin board feel.

---

## Mockup 1: Classic Brick Masonry Layout

```
┌─────────────────────────────────────┐
│  [←]    📌 My Bulletin              │ ← Header with back arrow + gradient text
│         Saved Posts                 │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │ ← Staggered brick layout
│  │  Event Image │  │ Event Image │ │   (Pinterest/masonry style)
│  │              │  │             │ │
│  │              │  └─────────────┘ │
│  │              │  Event Title     │
│  └──────────────┘  📍 Location     │
│  Event Title       ⏰ Time         │
│  📍 Location       ❤️ 24 Going     │
│  ⏰ Time                            │
│  ❤️ 45 Going      ┌──────────────┐ │
│                   │  Event Image │ │
│  ┌─────────────┐  │              │ │
│  │ Event Image │  │              │ │
│  │             │  │              │ │
│  └─────────────┘  └──────────────┘ │
│  Event Title      Event Title      │
│  📍 Location      📍 Location      │
│  ⏰ Time          ⏰ Time           │
│  ❤️ 18 Going      ❤️ 32 Going      │
│                                     │
│         [Load More Posts]           │
│                                     │
└─────────────────────────────────────┘
```

**Design Notes:**
- 2-column masonry grid with variable height cards
- Each card has rounded corners with subtle brick-red border
- Images maintain aspect ratio (no cropping)
- Background: cream (#fffcf4) with subtle brick texture overlay
- Cards have light shadow to create depth
- Pull-to-refresh at top

---

## Mockup 2: Physical Bulletin Board Style

```
┌─────────────────────────────────────┐
│  [←]    📌 My Bulletin              │
│         12 Saved Events             │ ← Count of saved items
├─────────────────────────────────────┤
│ [All] [This Week] [Social] [Sports] │ ← Filter chips
├─────────────────────────────────────┤
│                                     │
│    ╔═══════════════════════╗       │ ← Cards look like paper
│    ║  📌 (pin icon)        ║       │   pinned to cork board
│    ║  ┌───────────────┐   ║       │
│    ║  │  Event Photo  │   ║       │
│    ║  └───────────────┘   ║       │
│    ║                      ║       │
│    ║  Basketball Tourney  ║       │
│    ║  📍 Yates Field House║       │
│    ║  ⏰ Fri, Oct 25 • 7PM║       │
│    ║  ❤️ 34 Going         ║       │
│    ║                      ║       │
│    ╚═══════════════════════╝       │
│                                     │
│       ╔═══════════════════════╗    │
│       ║  📌                   ║    │
│       ║  ┌───────────────┐   ║    │
│       ║  │  Event Photo  │   ║    │
│       ║  └───────────────┘   ║    │
│       ║                      ║    │
│       ║  Fall Festival      ║    │
│       ║  📍 Red Square      ║    │
│       ║  ⏰ Sat, Oct 26     ║    │
│       ║  ❤️ 156 Going       ║    │
│       ╚═══════════════════════╝    │
│                                     │
└─────────────────────────────────────┘
```

**Design Notes:**
- Cards look like paper notes pinned to board
- Red "pushpin" icon at top of each card
- Slightly rotated cards (1-2° random rotation) for organic feel
- Cork board texture as background
- Filter chips with red active state
- Swipe left on card to remove/unsave

---

## Mockup 3: Minimal Brick Grid

```
┌─────────────────────────────────────┐
│  [←]                           [⋮]  │ ← Menu: Sort, Clear All
│                                     │
│      📌 Saved Events                │ ← Large gradient text
│      Keep track of what matters     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┏━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━┓  │ ← Cards with thick
│  ┃             ┃ ┃             ┃  │   brick-red borders
│  ┃   [Image]   ┃ ┃   [Image]   ┃  │
│  ┃             ┃ ┃             ┃  │
│  ┣━━━━━━━━━━━━━┫ ┣━━━━━━━━━━━━━┫  │
│  ┃ Event Name  ┃ ┃ Event Name  ┃  │
│  ┃ Oct 25      ┃ ┃ Oct 26      ┃  │
│  ┗━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━┛  │
│                                     │
│  ┏━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━┓  │
│  ┃             ┃ ┃             ┃  │
│  ┃   [Image]   ┃ ┃   [Image]   ┃  │
│  ┃             ┃ ┃             ┃  │
│  ┣━━━━━━━━━━━━━┫ ┣━━━━━━━━━━━━━┫  │
│  ┃ Event Name  ┃ ┃ Event Name  ┃  │
│  ┃ Oct 27      ┃ ┃ Oct 28      ┃  │
│  ┗━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━┛  │
│                                     │
│  ┏━━━━━━━━━━━━━┓                   │
│  ┃             ┃    [Empty]        │
│  ┃   [Image]   ┃                   │
│  ┃             ┃   No more posts   │
│  ┣━━━━━━━━━━━━━┫                   │
│  ┃ Event Name  ┃                   │
│  ┃ Oct 29      ┃                   │
│  ┗━━━━━━━━━━━━━┛                   │
│                                     │
└─────────────────────────────────────┘
```

**Design Notes:**
- Clean 2-column grid with equal heights per row
- 4px brick-red borders (#D74A4A) on all cards
- Minimal text - just event name and date
- Tap card to see full details
- Long press to remove from saved
- Empty state shows when scrolled to bottom

---

## Mockup 4: Layered Brick Stack

```
┌─────────────────────────────────────┐
│                                     │
│         📌 My Bulletin              │
│                                     │
│  ╔═════════════════════════════╗   │ ← Top card (most recent)
│ ╔╬═════════════════════════════╬╗  │   appears to stack on
│ ║║  [Featured Event Image]    ║║  │   others below
│ ║║                             ║║  │
│ ║║  Georgetown Fall Fest       ║║  │
│ ║║  📍 Red Square              ║║  │
│ ║║  ⏰ Tomorrow at 2:00 PM     ║║  │
│ ║║  ❤️ 245 Going   [→ Details] ║║  │
│ ╚╬═════════════════════════════╬╝  │
│  ╚═════════════════════════════╝   │
│                                     │
│  ┌───────────────────────────────┐ │ ← Smaller stacked cards
│  │ Basketball Game               │ │   show beneath
│  │ Oct 25 • Yates • 67 Going    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Study Session                 │ │
│  │ Oct 26 • Library • 12 Going  │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Concert @ Kennedy Center      │ │
│  │ Oct 27 • Kennedy • 89 Going  │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ + 8 more saved events         │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Design Notes:**
- Hero card at top with full image and details
- Compact list below showing other saved posts
- Swipe up on hero card to see next post
- Brick-like stacking visual effect
- Tap compact card to expand to hero

---

## Color Palette Reference

**Georgetown Brick Theme:**
- Primary Red: `#D74A4A`
- Dark Red: `#9C2C2C`
- Darker Red: `#932A2A`
- Background Cream: `#fffcf4`
- Border/Shadow: `rgba(215, 74, 74, 0.2)`
- Text Dark: `#333`
- Text Medium: `#666`

**Brick Texture Ideas:**
- Subtle diagonal lines to mimic mortar
- Very light brick pattern overlay (5% opacity)
- Use actual Georgetown Healy Hall brick photo as faded background

---

## Recommended Implementation

I recommend **Mockup 1 (Brick Masonry)** for the following reasons:

1. **Visual Interest**: Masonry layout breaks monotony, encourages scrolling
2. **Efficient Space**: Shows more content above the fold
3. **Modern UX**: Familiar pattern (Pinterest, Instagram Explore)
4. **Image-Forward**: RedSquare is about events - images should be prominent
5. **Georgetown Aesthetic**: Irregular brick pattern mirrors campus architecture

**Additional Features to Consider:**
- Pull-to-refresh with RedSquare logo animation
- Skeleton loading states (brick-shaped placeholders)
- Empty state: "Your bulletin is empty. Start saving events!"
- Quick filter buttons (Today, This Week, Later)
- Share saved posts list with friends
- Bookmark icon state toggle (filled = saved)

Would you like me to implement any of these mockups as actual React Native code?
