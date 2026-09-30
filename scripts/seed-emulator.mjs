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
      : { stringValue: String(v) }
const fields = (data) => ({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, value(v)])) })

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

const badges = {
  'first-steps': { name: 'First steps', description: 'Completed the first challenge.', emoji: '\u{1F463}', color: '#2f9e6f' },
  helper: { name: 'Helper', description: 'Helped someone else.', emoji: '\u{1F91D}', color: '#3a7bd5' },
  star: { name: 'Star', description: 'Outstanding effort.', emoji: '⭐', color: '#f5b700' },
}
for (const [id, badge] of Object.entries(badges)) {
  await put(`badges/${id}`, { ...badge, createdAt: at, updatedAt: at })
}

const users = {
  ada: { name: 'Ada', badgeIds: ['first-steps', 'star'] },
  bo: { name: 'Bo', badgeIds: ['helper'] },
  cleo: { name: 'Cleo', badgeIds: [] },
}
for (const [id, user] of Object.entries(users)) {
  await put(`users/${id}`, { ...user, createdAt: at, updatedAt: at })
}

console.log(`Seeded the emulator: accounts ${SUPERUSER_EMAIL}, ${ADMIN_EMAIL}, ${STRANGER_EMAIL}; 3 badges, 3 users.`)
