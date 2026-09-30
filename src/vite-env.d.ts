/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_USE_EMULATORS?: string
  readonly VITE_COMMIT_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
