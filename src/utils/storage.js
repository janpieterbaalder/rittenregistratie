import {
  fetchCustomLocations, insertCustomLocation, deleteCustomLocationByName,
  fetchCustomDistances, upsertCustomDistance, deleteDistancesForLocation,
  isConfigured
} from './supabase.js'

// ==========================================
// localStorage helpers (voor trips, routes, settings, geocache)
// ==========================================

const KEYS = {
  TRIPS: 'rr_trips',
  SAVED_ROUTES: 'rr_saved_routes',
  SETTINGS: 'rr_settings',
  CUSTOM_LOCATIONS: 'rr_custom_locations',
  CUSTOM_DISTANCES: 'rr_custom_distances',
  GEO_CACHE: 'rr_geo_cache',
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// Trips (lokaal)
export function getTrips() { return load(KEYS.TRIPS, []) }
export function saveTrips(trips) { save(KEYS.TRIPS, trips) }
export function addTrip(trip) {
  const trips = getTrips()
  trip.id = Date.now().toString()
  trips.push(trip)
  saveTrips(trips)
  return trip
}
export function deleteTrip(id) {
  saveTrips(getTrips().filter(t => t.id !== id))
}

// Routes (lokaal)
export function getSavedRoutes() { return load(KEYS.SAVED_ROUTES, []) }
export function saveSavedRoutes(routes) { save(KEYS.SAVED_ROUTES, routes) }

// Settings (lokaal)
export function getSettings() {
  return load(KEYS.SETTINGS, { homeLocation: 'Keet', autoAddHome: true })
}
export function saveSettings(settings) { save(KEYS.SETTINGS, settings) }

// Geocache (lokaal)
export function getGeoCache() { return load(KEYS.GEO_CACHE, {}) }
export function saveGeoCache(cache) { save(KEYS.GEO_CACHE, cache) }

// ==========================================
// In-memory caches (gevuld vanuit Supabase)
// ==========================================

let _customLocations = []
let _customDistances = {}
let _remoteReady = false

export function getCustomLocations() { return _customLocations }
export function getCustomDistances() { return _customDistances }
export function isRemoteReady() { return _remoteReady }

// ==========================================
// Init: haal remote data op + migreer localStorage
// ==========================================

export async function initRemoteData() {
  if (!isConfigured()) {
    // Supabase niet geconfigureerd: val terug op localStorage
    _customLocations = load(KEYS.CUSTOM_LOCATIONS, [])
    _customDistances = load(KEYS.CUSTOM_DISTANCES, {})
    _remoteReady = false
    console.warn('Supabase niet geconfigureerd – localStorage modus')
    return
  }

  try {
    // Migreer localStorage data naar Supabase (eenmalig)
    await _migrateLocalStorage()

    // Haal alle remote data op
    const [locs, dists] = await Promise.all([
      fetchCustomLocations(),
      fetchCustomDistances(),
    ])

    _customLocations = locs.map(l => ({
      id: l.id,
      name: l.name,
      address: l.address || '',
      postcode: l.postcode || '',
      city: l.city || '',
      org: l.org || 'overig',
    }))

    _customDistances = {}
    for (const d of dists) {
      _customDistances[`${d.from_name}|${d.to_name}`] = d.km
    }

    _remoteReady = true
  } catch (err) {
    console.error('Fout bij laden remote data:', err)
    // Fallback naar localStorage
    _customLocations = load(KEYS.CUSTOM_LOCATIONS, [])
    _customDistances = load(KEYS.CUSTOM_DISTANCES, {})
    _remoteReady = false
  }
}

async function _migrateLocalStorage() {
  // Migreer custom locaties
  const localLocs = load(KEYS.CUSTOM_LOCATIONS, null)
  if (localLocs && localLocs.length > 0) {
    for (const loc of localLocs) {
      try {
        await insertCustomLocation({
          id: loc.id,
          name: loc.name,
          address: loc.address || '',
          postcode: loc.postcode || '',
          city: loc.city || '',
          org: loc.org || 'overig',
        })
      } catch {
        // Locatie bestaat mogelijk al in Supabase, negeren
      }
    }
    localStorage.removeItem(KEYS.CUSTOM_LOCATIONS)
    console.log(`Gemigreerd: ${localLocs.length} custom locaties`)
  }

  // Migreer custom afstanden
  const localDists = load(KEYS.CUSTOM_DISTANCES, null)
  if (localDists && Object.keys(localDists).length > 0) {
    const pairs = new Set()
    for (const key of Object.keys(localDists)) {
      const [from, to] = key.split('|')
      const sortedKey = [from, to].sort().join('|')
      if (pairs.has(sortedKey)) continue
      pairs.add(sortedKey)
      try {
        await upsertCustomDistance(from, to, localDists[key])
      } catch {
        // Negeren bij duplicaten
      }
    }
    localStorage.removeItem(KEYS.CUSTOM_DISTANCES)
    console.log(`Gemigreerd: ${pairs.size} custom afstanden`)
  }
}

// ==========================================
// Remote write operaties (update cache + Supabase)
// ==========================================

export async function addCustomLocationRemote(loc) {
  if (_remoteReady) {
    await insertCustomLocation(loc)
  } else {
    // Fallback localStorage
    const local = load(KEYS.CUSTOM_LOCATIONS, [])
    local.push(loc)
    save(KEYS.CUSTOM_LOCATIONS, local)
  }
  _customLocations.push(loc)
}

export async function deleteLocationRemote(name) {
  // Verwijder custom locatie uit Supabase
  if (_remoteReady) {
    await deleteCustomLocationByName(name)
    // Verwijder ook alle bijbehorende custom afstanden
    await deleteDistancesForLocation(name)
  } else {
    const local = load(KEYS.CUSTOM_LOCATIONS, [])
    save(KEYS.CUSTOM_LOCATIONS, local.filter(l => l.name !== name))
  }
  _customLocations = _customLocations.filter(l => l.name !== name)
  // Update lokale distance cache
  const keysToRemove = Object.keys(_customDistances).filter(k => k.includes(name))
  for (const k of keysToRemove) delete _customDistances[k]
}

export async function saveCustomDistanceRemote(from, to, km) {
  _customDistances[`${from}|${to}`] = km
  _customDistances[`${to}|${from}`] = km

  if (_remoteReady) {
    try {
      await upsertCustomDistance(from, to, km)
    } catch (err) {
      console.error('Fout bij opslaan afstand:', err)
    }
  } else {
    save(KEYS.CUSTOM_DISTANCES, _customDistances)
  }
}
