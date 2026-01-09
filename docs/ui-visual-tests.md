# UI Visual Regression Checklist

Goal: confirm the design system and auth UX updates render consistently on three core screens.

## Screens
- Sign In
- Sign Up
- Forgot Password
- Create Post
- Explore
- Bulletin

## Setup
1. Run the app: `npx expo start`
2. Use the same device or simulator size for every capture.
3. Capture baseline screenshots before changes, then compare after changes.
4. Run style lint: `npm run lint:styles`

## States to capture
Sign In:
- Default state
- Inline validation errors (empty NetID, empty password)
- Loading state (tap Sign In with valid inputs)

Sign Up:
- Default state
- Inline validation errors (empty fields, invalid password, mismatch confirm)
- Loading state (tap Create Account with valid inputs)
- Success state (after account created)

Forgot Password:
- Default state
- Inline validation errors (empty or invalid NetID)
- Loading state (tap Send Reset Link with valid input)
- Success state (after email sent)

Create Post:
- Default state (no images)
- Image picker (add multiple images, reorder, set cover, remove)
- Date/time picker (set, dismiss, reset)
- Location suggestions (type and select)
- Preview step (valid inputs)
- Submit with missing fields (validation state)

Explore:
- Skeleton loading state
- Filters (When + Club) change results
- Save/unsave affordance
- Empty state (filters that yield no results)

Bulletin:
- Saved hero card (with image and without)
- Filter chips (Upcoming/All/Past)
- Empty bulletin state
- Unsave action updates list

Navigation:
- Tabs render correctly (Saved, Explore, Create, Profile)
- Active tab styling switches on tap
- Keyboard hides tab bar during form entry

## Pass criteria
- Typography and colors match tokens in `styles/tokens.ts`
- Buttons and inputs align and remain readable on small screens
- Keyboard does not obscure inputs or primary actions
