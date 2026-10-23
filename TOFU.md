# signal on Tofu

signal is ryohey's browser MIDI editor and sequencer: a piano roll, a multitrack arrange view, tempo and
controller editing, MIDI keyboard input and recording, SoundFont playback, and MIDI/WAV/MP3 export. This copy
runs entirely in the visitor's browser, with no account, no server and no database. Its name, artwork and
favicon are upstream's.

## How Tofu runs it

| | |
|---|---|
| Framework preset | `vite` |
| Shape | pnpm workspace: the editor is `app/`, built together with `packages/*` from the root `pnpm-lock.yaml`. It is not a single-package npm Vite app. |
| Toolchain | Node.js 24 (`engines`), pnpm 10.34.5 (`packageManager`) |
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm build`: Turbo builds the workspace, Vite builds `app/` with `app/vite.tofu.config.mts`, Workbox writes the service worker, and the result is copied to the root `dist/` |
| Output directory | `dist` at the repository root; the entry page `dist/index.html` is served at `/` |
| Dev server | `pnpm --dir app dev` (port 3000) serves the same entry page and SoundFonts |
| Environment variables | none |
| Database | none |

`vercel.json` states the same install command, build command and output directory, and sends the old
`/edit` and `/edit.html` addresses to the editor.

## What we changed, and why

- **The editor is the site root, without hosted telemetry.** `app/index.html` is upstream's `edit.html`
  without its Google Analytics tag, and `app/src/tofu.tsx` is upstream's `index.tsx` without Sentry, with the
  offline service worker covering `/`. `app/vite.tofu.config.mts` builds only this page: upstream's sign-in and
  community pages, and the public copies of `edit.html`, `auth.html` and `community.html`, are not published.
  The `build` and `dev` scripts in `app/package.json` use this configuration; upstream's `vite.config.mts` is
  unchanged (run `pnpm --dir app exec vite` for upstream's development setup with Firebase emulators).
- **No Firebase project is needed.** `app/src/firebase/firebase.ts` skips Firebase when no Firebase
  configuration is present, and `Navigation.tsx`, `FileMenuButton.tsx`, `RootView.tsx` and `OnInit.tsx` then
  hide sign-in, cloud files, publishing, account settings and the cloud-backed `?open=` link loader. The
  standalone configuration never passes Firebase settings, so every copy runs in this local mode: songs are
  opened from and saved to files on the person's computer. Upstream's own builds behave as before when they
  provide the configuration.
- **SoundFonts come from the app's own address.** `app/src/stores/RootStore.ts` and
  `packages/core/src/repositories/SoundFontRepository.ts` load `/soundfonts/A320U_drums.sf2` and
  `/soundfonts/A320U.sf2` instead of jsDelivr. The build publishes the copies already in
  `electron/assets/soundfonts/`, byte-identical to the files upstream's web build fetches (git blobs
  `1c8669c4` and `f162249c` in both places).
- **Upstream's Vercel proxy is replaced.** Upstream's `vercel.json` proxied `/` and other paths to upstream's
  own website; ours builds and serves this repository.
- **Licence files ship with the app.** The build publishes `/LICENSE`, `/TOFU.md`,
  `/soundfonts/A320U-license.txt` and `/COPYING.soundfonts`, the GNU GPL v2 text, added because the SoundFont
  notice points to a copy at a system path.

Upstream files we modified: `app/package.json`, `app/src/firebase/firebase.ts`,
`app/src/components/Navigation/Navigation.tsx`, `app/src/components/Navigation/FileMenuButton.tsx`,
`app/src/components/RootView/RootView.tsx`, `app/src/components/OnInit/OnInit.tsx`,
`app/src/stores/RootStore.ts`, `packages/core/src/repositories/SoundFontRepository.ts` and `vercel.json`. Their
MIT licence asks for no modification notice. Files we added: `TOFU.md`, `COPYING.soundfonts`, `app/index.html`,
`app/src/tofu.tsx` and `app/vite.tofu.config.mts`.

## Before offering it to people

- On first load, Chrome and Edge ask whether the site may use MIDI devices. The "Initializing..." box stays
  until the person answers; Allow and Block both continue, and Block only means no external MIDI devices.
  Upstream behaves the same.
- Sound plays after a click or key press, as browsers require.
- The first visit downloads a 9.7 MB SoundFont; the service worker keeps it for later visits.
- Songs live in the files the person saves (File menu, or export to MIDI, WAV or MP3). An autosave recovery
  copy sits in the browser's local storage and imported SoundFonts in its IndexedDB; neither is a backup, and
  neither moves between devices. There is no sign-in, cloud saving or community publishing.
- The only third-party requests are Google Fonts (Inter and Roboto Mono), as upstream, with no key. The Help
  and Discord links are upstream's.
- It needs WebGL and works best in a desktop browser.

## Upstream and licence

- Upstream: https://github.com/ryohey/signal, branch `main`, commit `dc5e0313c1b1fd279c3f65b505f177532bd113ab`.
- This copy: branch `tofu` of https://github.com/tofu-gallery/signal; the gallery pins tag `pin/2026-10-23`.
- Code: MIT, Copyright (c) 2016 ryohey (`LICENSE`, unchanged).
- Factory SoundFonts `A320U.sf2` and `A320U_drums.sf2`: Copyright 2005 Milton Paredes, GNU GPL v2
  (`electron/assets/soundfonts/A320U-license.txt`, unchanged), distributed unmodified in their editable SF2 form.
- Dependencies keep their own licences, including the Apache-2.0 SpessaSynth synthesizer.

## Verified locally (2026-10-23)

With Node.js 24.22.1 and pnpm 10.34.5, `pnpm install --frozen-lockfile` and `pnpm build` succeed;
`python3 -m http.server --directory dist` answers `/` and `/soundfonts/A320U.sf2` with HTTP 200; and in a
browser the editor initializes from its own address and plays.
