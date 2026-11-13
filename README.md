# Rusuh Booking Tiket — Mobile

Mobile app for **Rusuh Booking Tiket**: browse events, join a live guest queue, select tickets, pay, and view e-tickets. Built with Expo (React Native) and TypeScript, following Clean Architecture.

> **Status: 🚧 In progress** — active development. Core flows work end to end, but some integrations are still deterministic fakes or in flight (see [Status](#status--in-progress) below).

## Tech stack

| Area           | Choice                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Framework      | Expo SDK 58 · React Native 0.88 · React 19 · TypeScript                                               |
| Navigation     | Expo Router (file-based, typed routes)                                                                |
| Styling        | NativeWind v4 (Tailwind CSS)                                                                          |
| Design system  | Signal UI (`signal-ui-react-shared`, resolved from the sibling workspace via a custom Metro resolver) |
| Secure storage | `expo-secure-store`                                                                                   |
| Web content    | `react-native-webview` (payment web flow)                                                             |
| OTA updates    | `expo-updates` + EAS Update (`preview` channel, Expo Go sharing)                                      |
| Testing        | Jest + @testing-library/react-native (65 suites / 1000+ tests)                                        |
| Quality gates  | ESLint 9 + `eslint-plugin-boundaries`, Prettier, Husky + commitlint, GitHub Actions CI                |

## Architecture

```
src/
  app/            # Expo Router routes (file-based navigation)
  core/           # Shared kernel: domain, data, presentation components
  features/       # Feature slices: auth, booking, eticket, events, payment, queue
    <feature>/
      data/           # data sources, repositories, DTOs
      application/    # use cases / hooks
      presentation/   # screens and components
```

Layer rules are machine-enforced (`npm run boundary-check`): presentation may not import data directly — dependencies flow inward through the feature's public barrel.

## How to run

Prerequisites:

- Node `>= 26.13` (`< 27`) and npm
- The [`signal-ui-react-shared`](https://github.com/PTServerJanganTumbang-BookingTicket/signal-ui-react-shared) repo cloned **next to this repo** (same parent directory) — the Metro config watches it (`../signal-ui-react-shared`)

```bash
# 1. install dependencies
npm install

# 2. start the Expo dev server
npx expo start

# then press:
#   i — run on an iOS simulator
#   a — run on an Android emulator
#   or scan the QR code with Expo Go on your phone
```

### Real backend vs. deterministic fakes

Without configuration the app runs on **deterministic fake scenarios** (events, queue, payment), so the full flow works offline. To run against the real backend:

```bash
EXPO_PUBLIC_API_BASE_URL=https://<backend-host> npx expo start
```

When set, the events home uses the real HTTP adapter (API contract v2.27) and the queue screen joins the real guest queue.

## How to download

**Clone it (developers):**

```bash
git clone https://github.com/PTServerJanganTumbang-BookingTicket/fe-mobile-rusuh-war-ticketing.git
cd fe-mobile-rusuh-war-ticketing
npm install
npx expo start
```

The repo is private — you need access to the organization. Clone `signal-ui-react-shared` as a sibling directory first (see [How to run](#how-to-run)).

**Try it on your phone without cloning (Expo Go):**

1. Install **Expo Go** from the App Store / Google Play.
2. Scan this QR code (opens in any browser): `https://qr.expo.dev/eas-update?projectId=0746cde6-7acc-405c-9e8e-ffdc64252959&runtimeVersion=1.0.0&channel=preview`
   - Android: scan inside the Expo Go app
   - iOS: scan with the Camera app
3. Or paste this link in Expo Go → "Enter URL manually":

```
exp://u.expo.dev/0746cde6-7acc-405c-9e8e-ffdc64252959?runtime-version=1.0.0&channel-name=preview
```

The link always serves the **latest published version** — no reinstall needed after updates.

## Publishing an update (maintainers)

```bash
npx eas-cli update --channel preview --message "what changed" --environment production
```

Everyone with the link gets the new version on the next app open. While the link is being shared, do **not** bump `version` in `app.json` or upgrade the Expo SDK — that changes the runtime version and breaks the link.

## Status: 🚧 In progress

**Working (main):** repo bootstrap + CI gates, Signal UI integration, core domain + API client, auth data layer, events home (fake + real adapter v2.27), guest queue (fake + real), ticket selection, payment (fake + web payment flow), e-ticket placeholder, app shell + SafeArea wiring, P0 UI hardening (header component, brand CTA color).

**In flight:** payment real integration (PR open), remaining P0 UI gaps (queue position styling, waiting-room event card, contact email field, PaymentWebView header), EAS Update sharing rollout (link live, real-device testing pending).

See the [GitHub project board](https://github.com/orgs/PTServerJanganTumbang-BookingTicket/projects/2) for the ticket-level status.

## Verification

```bash
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Jest (65 suites / 1000+ tests)
npm run boundary-check # architecture boundaries
npx expo-doctor
npx expo export        # bundle check (also runs in CI)
```

## Commit convention

`[GH-<n>][Rosyid] <type>(<scope>): <description>` — enforced by commitlint; direct commits to `main` are blocked (use a branch + PR). Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

## Further docs

- `AGENTS.md` — agent operating rules for this repo
- `docs/CONTRACT-BASELINE.md` — API contract baseline
- `memory-bank/` — project memory (active context, progress)
