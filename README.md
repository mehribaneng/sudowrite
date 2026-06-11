# Scribe

Scribe is an Expo iOS app for editing prose with dictated instructions. A user
can type directly in the editor, record a command such as "replace Susan with
Janet," review the proposed changes as a word-level diff, and then apply or
reject the edit.

## Build and run on an iPhone

### Prerequisites

- Node.js and npm
- An iPhone running a version supported by Expo SDK 56
- An [OpenRouter](https://openrouter.ai/) API key
- The Expo Go app installed on the iPhone

Install dependencies and configure the API key:

```bash
npm install
cp .env.example .env
```

Set the key in `.env`:

```bash
EXPO_PUBLIC_OPENROUTER_KEY=your_openrouter_key
```

`EXPO_PUBLIC_*` values are embedded in the client bundle. This is acceptable
for this no-server prototype, but it does not protect the key. A production
version should proxy OpenRouter requests through a trusted backend.

### Run with Expo Go

Connect the Mac and iPhone to the same network, then run:

```bash
npm start
```

Open Expo Go and scan the QR code printed by Expo. Grant microphone permission
when prompted.

If local network discovery is unavailable, start Expo through a tunnel:

```bash
npx expo start --tunnel
```

### Verification

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform ios
```

## Demo

https://github.com/user-attachments/assets/6547a2c1-4901-4341-b3ac-82bdb0bc1bf2

## Product decisions

- **Review before mutation.** AI output is never written directly into the
  document. It first appears in a bottom sheet with red deletions and green
  insertions, keeping the user in control of the final text.
- **A native bottom sheet.** The Expo UI bottom
  sheet keeps the review actions close to the proposed edit, supports native
  drag behavior, and leaves more usable vertical space on an iPhone.
- **One document and one screen.** The prototype focuses on the dictated-edit
  loop rather than navigation, persistence, authentication, or document
  management.
- **Tap once to record and again to stop.** This interaction is explicit and
  avoids unreliable automatic silence detection.
- **Visible transcription.** Showing the interpreted command helps the user
  understand whether speech recognition or prose editing caused an unexpected
  result.
- **Expo UI where it fits.** The sheet, stack layouts, text, and actions use
  native Expo UI components. The diff body remains a React Native text tree
  because it needs mixed inline styles for equal, inserted, and deleted spans.

## Architecture

The app is intentionally small and organized by responsibility:

```text
src/
├── app/                 # Expo Router entry and single screen
├── components/          # Editor, recording controls, status, and diff sheet
├── components/ui/       # Shared themed text and view primitives
├── constants/           # Sample document and theme tokens
├── hooks/               # Color scheme and theme access
├── lib/                 # OpenRouter client, API operations, and diff utility
└── store/               # Single Zustand store
```

### Editor and synchronization model

The editor uses a controlled React Native `TextInput`. Zustand holds the
authoritative in-memory document string, so typing updates the store
immediately and the rendered editor always reflects the same value.

When recording stops, the current document is captured as a snapshot. That
snapshot and the transcription are sent to the editing model. The returned
document is compared with the snapshot using `diffWords`, then stored
separately as `pendingEdit`.

This creates a small two-phase commit:

1. **Propose:** preserve the current document and display the edited text as a
   diff.
2. **Resolve:** Apply atomically replaces the document with
   `pendingEdit.edited`; Reject discards the pending edit without changing the
   document.

The editor is disabled while recording or processing, preventing local typing
from racing with the document snapshot sent to the model. There is no
background synchronization, persistence, collaborative state, or optimistic
server update. The Zustand store is the only source of truth for the current
session.

### Audio and AI pipeline

`ControlBar` coordinates the linear workflow:

```text
idle -> recording -> processing -> diff review -> apply or reject
```

`expo-audio` records with the high-quality preset. `expo-file-system` converts
the recording to base64, and OpenRouter performs transcription with
`openai/whisper-large-v3`. The resulting instruction and document snapshot are
sent to `anthropic/claude-sonnet-4.6`, which is prompted to return only the full
edited document.

Axios is configured once in `src/lib/openrouter.ts`. The shared client owns the
base URL, timeout, JSON headers, and authorization interceptor. `src/lib/api.ts`
owns endpoint payloads, response validation, and user-facing error
normalization.

### Known limitation: conflict-free server sync

The task requested a conflict-free architecture, such as Yjs, with server
persistence. This prototype does not implement that requirement. Given the test task's two-hour limit, the implementation prioritizes the complete recording, transcription, diff review, and Apply/Reject workflow. Adding Yjs superficially while continuing to replace the entire document string
would not provide meaningful conflict-free editing.

## AI-assisted development

Codex was used in Plan Mode to inspect the Expo SDK 56 project, verify the
versioned Expo audio and UI APIs, clarify product decisions, and produce an
implementation plan before code was changed.

Codex then assisted with scaffolding, API integration, state wiring, and
verification. Every changed file was manually reviewed. Types and architecture
were adjusted by hand where the generated structure was too literal or did not
match the project conventions.

Manual review also corrected two important areas:

- **UX flow:** Apply and Reject were moved into the review surface, and the
  initial modal was replaced with a native bottom sheet. Theme transparency and
  Dynamic Type layout issues were found through simulator testing and fixed.
- **API integration:** the original `expo-av` and multipart assumptions were
  updated to Expo SDK 56's `expo-audio` API and OpenRouter's current base64 JSON
  transcription contract. Fetch calls were later consolidated behind a typed
  Axios client with explicit validation and errors.
