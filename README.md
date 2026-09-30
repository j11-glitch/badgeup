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
