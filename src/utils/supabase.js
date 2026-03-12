// ==========================================
// Supabase REST API wrapper (geen SDK nodig)
// ==========================================

// Vul hier je Supabase project URL en anon key in:
const SUPABASE_URL = 'https://igxnadfwmibrofgxveal.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_i00LWZcRX54idFn2wsnSjQ_2Qt5apST'

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function query(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers })
  if (!res.ok) throw new Error(`Supabase GET ${table}: ${res.status}`)
  return res.json()
}

async function insert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Supabase INSERT ${table}: ${res.status}`)
  return res.json()
}

async function upsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Supabase UPSERT ${table}: ${res.status}`)
  return res.json()
}

async function remove(table, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error(`Supabase DELETE ${table}: ${res.status}`)
  return res.json()
}

// ==========================================
// Custom Locations
// ==========================================

export async function fetchCustomLocations() {
  return query('custom_locations', 'order=created_at.asc')
}

export async function insertCustomLocation(loc) {
  const rows = await insert('custom_locations', loc)
  return rows[0]
}

export async function deleteCustomLocationByName(name) {
  return remove('custom_locations', `name=eq.${encodeURIComponent(name)}`)
}

// ==========================================
// Custom Distances
// ==========================================

export async function fetchCustomDistances() {
  return query('custom_distances', 'order=created_at.asc')
}

export async function upsertCustomDistance(fromName, toName, km) {
  // Upsert both directions
  return upsert('custom_distances', [
    { from_name: fromName, to_name: toName, km },
    { from_name: toName, to_name: fromName, km },
  ])
}

export async function deleteDistancesForLocation(name) {
  // Delete all distances where this location is involved
  await remove('custom_distances', `from_name=eq.${encodeURIComponent(name)}`)
  await remove('custom_distances', `to_name=eq.${encodeURIComponent(name)}`)
}

// ==========================================
// Check of Supabase geconfigureerd is
// ==========================================

export function isConfigured() {
  return !SUPABASE_URL.includes('JOUW_PROJECT') && !SUPABASE_ANON_KEY.includes('JOUW_ANON_KEY')
}
