# BadgeUp

BadgeUp motivates children with badges. Each child has daily tasks they tick off themselves;
doing all of them day after day earns streak badges and levels. Grown-ups also give badges by
hand for good habits.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

| Script           | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `npm run dev`    | Start the dev server                                |
| `npm run build`  | Type-check and build for production (`dist/`)       |
| `npm run deploy` | Build and deploy to Firebase Hosting                |

## Pages and roles

- **`/`** (public, no login): every child with their streak, today's progress and the badges
  they have.
- **`/child/{id}`** (public, no login): one child's page. The child ticks off today's tasks here
  and sees every badge (earned ones glow, the rest are dim with how far there is to go).
- **`/admin`**: sign in with Google. What you can do depends on your role:

| Role | Can |
| ---- | --- |
| **Superuser** (one) | everything an admin can, plus add and remove admins |
| **Admin** | add and delete children; edit their daily tasks; give and take manual badges and Founder diamonds |
| Anyone else | the public page (a signed-in non-admin sees "No admin access") |

Children are stored as "users"; they do not log in.

## Badge rules

All badges are fixed and defined in [`src/domain/catalog.ts`](src/domain/catalog.ts); the rules
are in [`src/domain/progress.ts`](src/domain/progress.ts) (unit-tested). A day is complete when
every task the child had that day is ticked off. Days use the device's local date.

The app is in Norwegian; all text, including the badge names, is in
[`src/i18n/nb.ts`](src/i18n/nb.ts).

**Task badges** (automatic; "oppgavemerker"):

| Badge | Rule |
| ----- | ---- |
| Dagens helt | all tasks done today |
| Ukesflamme | all tasks done 7 days in a row |
| Månedsbål | all tasks done 30 days in a row |
| Bronse, Sølv, Gull, Platina, Legende | 7, 30, 90, 180, 365 days in a row (1 week, 1 month, 3 months, 6 months, 1 year) |

An unfinished today does not break the run yet. A missed day resets everything: Ukesflamme,
Månedsbål and the levels.

**Manual badges** (given and taken away by an admin; "voksenmerker"):

| Badge | For |
| ----- | --- |
| Første steg | started using BadgeUp |
| Lytteøre | listens and does it |
| Matglad | eats well |
| Hjertehjelper | helpful to parents |
| Fredsmegler | no conflicts |
| Skolestjerne | does school tasks |
| Hjelpende hånd | helps others |
| Treningsglad | exercise and sport |
| Morgenfugl | sleeps well, wakes up on time |
| Bokorm | reads extra books |
| Skjønnskriver | good handwriting |
| Tålmodig | waits their turn without nagging |
| Tannstjerne | brushes teeth morning and evening |
| Friluftsliv | outdoors in fresh air every day |
| Skjermsmart | turns off the screen when agreed |

- **Merkesamler**: has every manual badge (all 15).
- **Mester**: kept Merkesamler for 7 days, counted from the last badge given. Taking any manual
  badge away loses both; giving it back starts the week again.
- **Diamant**: diamonds an admin can give several of (0 to 999).

The badge ids stored in Firestore (`firstStep`, `teamPlayer`, ...) are fixed; only the display
names live in `nb.ts`, so names can change without touching data.

**Icons**: [`assets/badges-source.webp`](assets/badges-source.webp) is the badge sheet; the
BadgeUp logo (`assets/logo-source.webp`) and Matglad (`assets/matglad-source.webp`) have their
own pictures, as do Tålmodig, Tannstjerne, Friluftsliv, Skjermsmart, Treningsglad, Bokorm, Lytteøre and Morgenfugl (`assets/*-source.webp`).
`python3 scripts/extract-badge-icons.py` (needs Pillow) cuts every icon out with a
transparent background into `public/badges/`, and makes the favicon and home-screen icons.

## Database (Cloud Firestore)

Firestore in **europe-north1**, project `badgeup-2d0ee`. Collections:

| Collection | Content | Read | Write |
| ---------- | ------- | ---- | ----- |
| `users` | name, `tasks` (id, title), `manual` (badge id to time given), `diamonds` | anyone | admins |
| `users/{id}/days/{YYYY-MM-DD}` | `required` (the day's task ids), `done` | anyone | anyone for a date near now; admins any date, and delete |
| `staff/{email}` | `role`: `superuser` or `admin` | admins | superuser (admins only) |

Access is enforced by [`firestore.rules`](firestore.rules); anything not listed is locked. Admins
are identified by their Google email (verified), stored in lower case as the document id in
`staff`. The superuser can never be created or removed from the app.

Because children tick off tasks without logging in, anyone with the link can tick them. The
rules keep that narrow: only the `days` of an existing child, only dates within about a day of
now (no filling in old days), and only task ids from that day's list. The old `badges`
collection from the first version is locked and no longer used.

**Creating the superuser** (once, in the Firebase console): Firestore Database, then add a
document in collection `staff` whose **document ID** is the superuser's Google email in lower case,
with one field `role` = `superuser` (string).

### Firebase web config

`src/firebase.ts` reads the API key and app id from build-time variables instead of the code:

- **Locally:** `.env.local` (ignored by Git). Copy `.env.example` and fill in the values from the
  Firebase console (*Project settings, Your apps, BadgeUp*). `npm run local` needs no values.
- **GitHub Actions:** repository secrets `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_APP_ID`.
  Upload them from your `.env.local` with `gh secret set -f .env.local -R j11-glitch/badgeup`.
  The deploy workflows stop with an error if they are missing.

These values still end up in the built JavaScript (the browser needs them); access to data is
protected by `firestore.rules`.

## Try it locally (emulators)

```bash
npm run local
```

This starts the Firestore and Auth **emulators** (project `demo-badgeup`, never the real
database), fills them with example data (`scripts/seed-emulator.mjs`) and starts the app on
http://localhost:5178. On `/admin`, test mode shows buttons to sign in as the local test
accounts: **superuser**, **admin**, or **stranger** (no access). Stop with Ctrl+C; the data is
reset on the next start.

| Script                 | What it does                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run local`        | Emulators + example data + app (safe local testing)               |
| `npm test`             | Unit tests                                                        |
| `npm run test:rules`   | Security-rule tests in the Firestore emulator (needs Java)        |
| `npm run deploy:rules` | Deploy `firestore.rules` and indexes to the real project          |

The GitHub Actions deploy only publishes Hosting. **Rule changes are deployed with
`npm run deploy:rules`**, after `npm run test:rules` passes.

## Deployment (Firebase Hosting)

The site is hosted on Firebase Hosting (`firebase.json`: serves `dist/`, rewrites all paths
to `index.html`, long cache for hashed assets). The Firebase CLI runs through `npx`, so no
global install is needed.

One-time setup on a machine:

```bash
npx firebase-tools login
```

Then deploy:

```bash
npm run deploy
```

The Firebase project is `badgeup-2d0ee` (set in `.firebaserc`); the site is live at
https://badgeup-2d0ee.web.app.

### Automatic deploys (GitHub Actions)

- **Merge to `main`** → `.github/workflows/firebase-hosting-merge.yml` builds and deploys to
  the live site.
- **Pull request** → `.github/workflows/firebase-hosting-pull-request.yml` deploys a temporary
  preview (expires after 7 days) and comments the preview URL on the PR.

Both use the `FIREBASE_SERVICE_ACCOUNT_BADGEUP_2D0EE` repository secret (a service account
created by `firebase init hosting:github`). The page footer shows the commit a deploy was
built from.

## CI

`.github/workflows/ci.yml` builds every pull request and every push to `main`.
