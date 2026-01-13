# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RedSquare is a React Native mobile application built with Expo Router, designed for Georgetown University students, faculty, and staff. The app is a social platform for sharing campus events and activities.

## Tech Stack

- **Framework**: React Native with Expo SDK ~54.0.10
- **Router**: Expo Router (file-based routing)
- **Backend**: Supabase (configured in `lib/supabase.ts`)
- **UI**: Custom components with SVG gradients, React Native StyleSheet
- **Fonts**: Google Fonts (Jost family via `@expo-google-fonts/jost`)
- **Image Handling**: expo-image-picker
- **State Management**: React hooks (useState)
- **TypeScript**: Strict mode enabled

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start
# or
npm start

# Platform-specific starts
npm run android    # Start Android emulator
npm run ios        # Start iOS simulator
npm run web        # Start web version

# Code quality
npm run lint       # Run ESLint

# Reset project (moves starter code to app-example)
npm run reset-project
```

## Architecture

### File-based Routing (Expo Router)

The app uses Expo Router with file-based routing. Auth screens live at the root and the main app is in a `(tabs)` group:

- `app/_layout.tsx` - Root layout that loads Jost fonts and configures Stack navigator with no headers and no animations
- `app/index.tsx` - Sign in page (entry point)
- `app/home.tsx` - Redirects to `/bulletin`
- `app/forgotPassword.tsx` - Password reset flow
- `app/signup.tsx` - Account creation
- `app/(tabs)/_layout.tsx` - Bottom tab navigation (Saved, Explore, Create, Profile)
- `app/(tabs)/bulletin.tsx` - Saved events hub
- `app/(tabs)/explore.tsx` - Explore feed
- `app/(tabs)/createPost.tsx` - Create post flow (details + preview)
- `app/(tabs)/profile.tsx` - Profile & settings entry

Navigation is handled via `useRouter()` from `expo-router`:
- `router.push('/path')` - Navigate to new screen
- `router.replace('/path')` - Replace current screen
- `router.back()` - Go back to previous screen

### Shared Components

Shared UI lives in `components/`:

- **GradientText.tsx** - Reusable SVG text component with red gradient (#D74A4A → #9C2C2C → #932A2A)
  - Props: `children` (string), `fontSize` (default 14), `fontFamily` (default Jost_500Medium), `width`, `height`
  - Uses unique gradient IDs per render to avoid navigation conflicts
- **components/auth/AuthLayout.tsx** - Shared auth layout with animated background
- **components/forms/TextField.tsx** - Labeled input with inline errors
- **components/forms/SelectField.tsx** - Button-like picker field
- **components/buttons/PrimaryButton.tsx** - Primary CTA button with loading state
- **components/buttons/SecondaryButton.tsx** - Outline button for secondary actions

### Design System

Tokens live in `styles/tokens.ts` for colors, spacing, type, radii, and shadows.

**Colors:**
- Background: `#fffcf4` (cream/beige)
- Primary Red: `#D74A4A` (Georgetown red)
- Gradient: `#D74A4A` → `#9C2C2C` → `#932A2A`
- Text: `#333` (dark), `#666` (medium gray)
- Error: `#D74A4A`

**Fonts:**
- `Jost_400Regular` - Body text
- `Jost_500Medium` - Labels, medium weight text
- `Jost_600SemiBold` - Headings
- `Jost_700Bold` - Bold text

**Typography Guidelines:**
- All fonts must be loaded in `_layout.tsx` before rendering
- Font loading uses `useFonts()` hook which returns `[fontsLoaded]`
- Render `null` while fonts load

### Backend Integration

Supabase client is configured in `lib/supabase.ts`:
- Uses AsyncStorage for session persistence
- Auto-refresh tokens enabled
- Session URL detection disabled (required for React Native)

**Note:** The Supabase credentials are currently hardcoded in the source. For production, move these to environment variables using `expo-constants` and `app.config.js`.

### Image Assets

All images are stored in `assets/images/`:
- `rslogo.png` - RedSquare logo (110x110)
- `corplogo.png` - Corporate/secondary logo
- `houseicon.png`, `MagnifyingGlass.png`, `plussign.png` - Toolbar icons (40x40)
- `CameraBorder.png` - Camera placeholder border
- `uploadcamera.png` - Upload camera icon (72x72)
- `gumap.png` - Georgetown campus map
- `backarrow.png`, `sendbutton.png` - Action buttons (65x65)
- App icons: `icon.png`, `splash-icon.png`, `favicon.png`

### Authentication Flow

1. User enters Georgetown NetID on sign-in page (`index.tsx`)
2. NetID validation: `/^[a-zA-Z0-9]{2,20}$/`
3. Converts NetID to `{netid}@georgetown.edu` format
4. Authenticates via Supabase Auth and routes to `/bulletin`
5. Password reset flow in `forgotPassword.tsx` (UI only, TODO: implement backend)

### Key Patterns

**Component Structure:**
- Auth screens share a common layout (`AuthLayout`)
- Main app uses Expo Router Tabs (`app/(tabs)/_layout.tsx`)
- Use `View` with `flex: 1` for full-screen layouts
- Content typically uses tokenized spacing from `styles/tokens.ts`

**Image Picker Flow (createPost.tsx):**
1. Request media library permissions with `ImagePicker.requestMediaLibraryPermissionsAsync()`
2. If denied and can't ask again, show alert to open Settings via `Linking.openSettings()`
3. Launch picker with `ImagePicker.launchImageLibraryAsync()`
4. Display selected image or camera placeholder

**State Management:**
- Use `useState` for local component state
- Form fields use controlled inputs with `value` and `onChangeText`

### TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` maps to project root
- Extends `expo/tsconfig.base`

### Platform-Specific Considerations

**iOS:**
- Photo library access requires `NSPhotoLibraryUsageDescription` in `app.json`
- Camera access requires `NSCameraUsageDescription`

**Android:**
- Requires `READ_MEDIA_IMAGES` permission
- Edge-to-edge display enabled
- Predictive back gesture disabled

### Common Issues & Solutions

**Gradient Text Disappearing After Navigation:**
- Fixed by using `React.useId()` to generate unique gradient IDs per component render

**Font Loading:**
- Always check `fontsLoaded` before rendering components
- Return `null` or loading screen while fonts load

**Image Permissions:**
- Handle both granted and denied scenarios
- Provide path to Settings when permissions are permanently denied

### Future Work (TODOs found in code)

- `forgotPassword.tsx:22` - Implement actual password reset function (currently shows success UI only)
- Move Supabase credentials to environment variables
