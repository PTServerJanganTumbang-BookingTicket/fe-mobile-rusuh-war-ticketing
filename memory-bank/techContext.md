# Tech Context — fe-mobile-rusuh-war-ticketing

## Stack

- Expo SDK 58 (58.0.24), React Native 0.88.1, TypeScript, Hermes.
- Nativewind 4.2.7 (Tailwind-style), Reanimated 4.7.1.
- Jest + react-test-renderer + @testing-library/react-native v14+ (async render required).
- Signal UI via sibling source (`../signal-ui-react-shared`), not npm.
- Toolchain: nvm 0.41.0 / Node 26.13.0 / npm 11.20.0 (matches VPS target).

## Verification gates (all must pass before merge)

```bash
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Jest (non-watch)
npm run boundary-check # architecture boundaries
npx expo-doctor        # Expo SDK compatibility (18/20 baseline; 2 pre-existing on main OK)
npx expo export        # build verification
```

Prohibited in routine verification: `npm run dev`-style watch commands,
`expo start` interactive sessions.

## Git/tooling

- Husky: pre-commit (main guard + lint-staged), pre-push (blocks main), commit-msg.
- commitlint: `[GH-<n>][Rosyid] <type>(<scope>): <description>`.
- Branches: `story/GH-<n>-<slug>`, `fix/GH-<n>-<slug>`, `chore/GH-<n>-<slug>` (max 1 day).
- CI: 6 gates on GitHub Actions; squash-merge PRs; `main` protected.

## Security

- Never commit secrets/`.env*`; fake NIK fixtures only (never real NIK).
- Access token memory-only; refresh token SecureStore.
