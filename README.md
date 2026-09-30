# BadgeUp

BadgeUp web app. For now it shows a "Hello, world!" page; features come next.

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

- **`/`** (public, no login): every user and the badges they have earned, plus all badges.
- **`/admin`**: sign in with Google. What you can do depends on your role:

| Role | Can |
| ---- | --- |
| **Superuser** (one) | everything an admin can, plus add and remove admins |
| **Admin** | create, edit and delete badges; add and delete users; give badges to users |
| Anyone else | read-only public page (a signed-in non-admin sees "No admin access") |

"Users" are the people who receive badges; they do not log in.

## Database (Cloud Firestore)

Firestore in **europe-north1**, project `badgeup-2d0ee`. Collections:

| Collection | Content | Read | Write |
| ---------- | ------- | ---- | ----- |
| `badges` | name, description, emoji, colour | anyone | admins |
| `users` | name, `badgeIds` | anyone | admins |
| `staff/{email}` | `role`: `superuser` or `admin` | admins | superuser (admins only) |

Access is enforced by [`firestore.rules`](firestore.rules); anything not listed is locked. Admins
are identified by their Google email (verified), stored in lower case as the document id in
`staff`. The superuser can never be created or removed from the app.

**Creating the superuser** (once, in the Firebase console): Firestore Database, then add a
document in collection `staff` whose **document ID** is the superuser's Google email in lower case,
with one field `role` = `superuser` (string).

The Firebase config in `src/firebase.ts` is public by design.

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
