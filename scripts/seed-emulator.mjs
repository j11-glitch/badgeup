// Fills the LOCAL Firestore emulator with example data for `npm run local`.
// Talks only to 127.0.0.1:8080 and the "demo-badgeup" project, never the real database.
const HOST = 'http://127.0.0.1:8080'
const PROJECT = 'demo-badgeup'
const BASE = `${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`
// "Bearer owner" is the emulator's admin access (bypasses the rules); it has no effect on real projects.
const HEADERS = { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }

export const SUPERUSER_EMAIL = 'superuser@badgeup.test'
export const ADMIN_EMAIL = 'admin@badgeup.test'
export const STRANGER_EMAIL = 'stranger@badgeup.test'
// Test-only password for the emulator accounts (must match LOCAL_TEST_PASSWORD in the app).
const LOCAL_TEST_PASSWORD = 'badgeup-local-test'
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-badgeup/accounts'

const now = new Date().toISOString()
const value = (v) =>
  Array.isArray(v)
    ? { arrayValue: { values: v.map(value) } }
    : v instanceof Date
      ? { timestampValue: v.toISOString() }
      : Number.isInteger(v)
        ? { integerValue: String(v) }
        : typeof v === 'object'
          ? { mapValue: { fields: mapFields(v) } }
          : { stringValue: String(v) }
const mapFields = (data) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, value(v)]))
const fields = (data) => ({ fields: mapFields(data) })

async function put(path, data) {
  const response = await fetch(`${BASE}/${path}`, { method: 'PATCH', headers: HEADERS, body: JSON.stringify(fields(data)) })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${await response.text()}`)
}

// Local test accounts with verified emails (the rules require a verified email).
for (const email of [SUPERUSER_EMAIL, ADMIN_EMAIL, STRANGER_EMAIL]) {
  const response = await fetch(AUTH, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email, password: LOCAL_TEST_PASSWORD, emailVerified: true, displayName: email.split('@')[0] }),
  })
  const body = await response.text()
  // Running the seed again is fine: existing accounts are kept.
  if (!response.ok && !body.includes('EMAIL_EXISTS')) throw new Error(`account ${email}: HTTP ${response.status} ${body}`)
}

const at = new Date(now)
await put(`staff/${SUPERUSER_EMAIL}`, { role: 'superuser' })
await put(`staff/${ADMIN_EMAIL}`, { role: 'admin', addedBy: SUPERUSER_EMAIL, addedAt: at })

const DAY_MS = 24 * 60 * 60 * 1000
const pad = (n) => String(n).padStart(2, '0')
// Local calendar day `offset` days before today, as the app's "YYYY-MM-DD" day id.
const dayId = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const daysAgo = (n) => new Date(Date.now() - n * DAY_MS)
const MANUAL = ['firstStep', 'gettingStarted', 'betaTester', 'helpful', 'teamPlayer', 'mentor',
  'collaborator', 'dedicated', 'earlyBird', 'explorer', 'creator',
  'patient', 'toothStar', 'outdoors', 'screenSmart']
const TASKS = [
  { id: 'matte', title: 'Matte' },
  { id: 'klarinett', title: 'Klarinett\u00f8velse' },
  { id: 'lesbok', title: 'Les bok' },
  { id: 'mattemagi', title: 'Mattemagi' },
  { id: 'skole', title: 'Skoleoppgaver' },
]
const ids = TASKS.map((t) => t.id)

// ada: 35 days in a row (Big Streak, Bronze), today still open; 4 manual badges, 2 diamonds.
// bo: 8 days in a row including today; every manual badge since 3 days ago (Milestone).
// cleo: missed yesterday; every manual badge for 10 days (Master).
const children = {
  ada: {
    name: 'Ada',
    manual: Object.fromEntries(MANUAL.slice(0, 4).map((id) => [id, daysAgo(12)])),
    diamonds: 2,
    complete: Array.from({ length: 35 }, (_, i) => i + 1),
    partialToday: true,
  },
  bo: {
    name: 'Bo',
    manual: Object.fromEntries(MANUAL.map((id) => [id, daysAgo(3)])),
    diamonds: 0,
    complete: Array.from({ length: 8 }, (_, i) => i),
  },
  cleo: {
    name: 'Cleo',
    manual: Object.fromEntries(MANUAL.map((id) => [id, daysAgo(10)])),
    diamonds: 1,
    complete: [2, 3, 4],
  },
}
for (const [id, child] of Object.entries(children)) {
  await put(`users/${id}`, {
    name: child.name,
    tasks: TASKS,
    manual: child.manual,
    diamonds: child.diamonds,
    createdAt: at,
    updatedAt: at,
  })
  for (const offset of child.complete) {
    await put(`users/${id}/days/${dayId(offset)}`, { required: ids, done: ids, updatedAt: at })
  }
  if (child.partialToday) {
    await put(`users/${id}/days/${dayId(0)}`, { required: ids, done: ids.slice(0, 2), updatedAt: at })
  }
}

console.log(`Seeded the emulator: accounts ${SUPERUSER_EMAIL}, ${ADMIN_EMAIL}, ${STRANGER_EMAIL}; 3 children with history.`)
