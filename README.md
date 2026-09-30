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

## CI

`.github/workflows/ci.yml` builds every pull request and every push to `main`.
