# Scribe

Scribe is an Expo iOS app for editing prose with dictated instructions. A user
can type directly in the editor, record a command such as "replace Susan with
Janet," review the proposed changes as a word-level diff, and then apply or
reject the edit.

## Build and run on an iPhone

### Prerequisites

- Node.js and npm
- An iPhone running a version supported by Expo SDK 56
- The Expo Go app installed on the iPhone
- The Scribe NestJS and Hocuspocus backend running

Install dependencies and configure the backend connection:

```bash
npm install
cp .env.example .env
```

For an iOS simulator, `.env` can use:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_COLLABORATION_URL=ws://localhost:1234
EXPO_PUBLIC_DOCUMENT_ID=default-document
```

On a physical iPhone, replace `localhost` with the development machine's LAN
IP. `EXPO_PUBLIC_*` values are embedded in the client bundle and must contain
only public connection configuration. The OpenRouter key belongs exclusively
to the backend.

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

https://github.com/user-attachments/assets/32c36ffb-f49c-456d-96b7-40a623d40b80

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
├── constants/           # Public connection config and theme tokens
├── hooks/               # Color scheme and theme access
├── lib/                 # Backend API, Yjs text operations, and diff utility
├── providers/           # Y.Doc and Hocuspocus connection lifecycle
└── store/               # Transient Zustand workflow state
```

### Editor and synchronization model

The editor uses a controlled React Native `TextInput`, but `Y.Text("content")`
is the authoritative document. A Hocuspocus provider synchronizes its `Y.Doc`
with the backend, and a Yjs observer projects the current text into React for
rendering. Zustand stores only transient workflow state.

Local `TextInput` values are reduced to their smallest changed range and
committed as one Yjs insert/delete transaction. Remote Yjs updates pass through
the same observer, so a second client can merge edits without replacing the
whole document or using last-write-wins persistence.

When recording stops, the current document is captured as a snapshot. That
snapshot and the transcription are sent to the backend. The returned document
is compared with the snapshot using `diffWords`, then stored
separately as `pendingEdit`.

This creates a small two-phase commit:

1. **Propose:** preserve the current document and display the edited text as a
   diff.
2. **Resolve:** Apply converts the approved character diff into granular Yjs
   operations; Reject performs no document transaction.

The submitted snapshot is checked when the AI response arrives and again when
Apply is tapped. If local or remote content changed in the meantime, the stale
proposal is discarded instead of overwriting the newer shared document.

### Audio and AI pipeline

`ControlBar` coordinates the linear workflow:

```text
idle -> recording -> processing -> diff review -> apply or reject
```

`expo-audio` records with the high-quality preset. The recording is uploaded as
multipart form data to the NestJS transcription endpoint. The resulting
instruction and current document snapshot are sent to the backend edit
endpoint, which returns a complete proposed document.

`src/lib/api.ts` owns backend endpoint payloads, response validation, timeouts,
and user-facing error normalization. No OpenRouter credentials are present in
the frontend source or example configuration.

### Conflict-free server sync

The app bootstraps a configured document through NestJS, then connects one
`Y.Doc` to the Hocuspocus WebSocket server. Hocuspocus persists Yjs state in the
backend database. Temporary disconnects do not destroy the provider, allowing
in-memory local operations to synchronize after reconnecting.

The backend contract and scaling considerations are documented in
[`docs/nestjs-yjs-backend-handoff.md`](docs/nestjs-yjs-backend-handoff.md).

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
  transcription contract. The final architecture moved all OpenRouter access
  behind the NestJS backend and added Hocuspocus/Yjs synchronization.
