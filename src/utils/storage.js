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

export function getSavedRoutes() { return load(KEYS.SAVED_ROUTES, []) }
export function saveSavedRoutes(routes) { save(KEYS.SAVED_ROUTES, routes) }

export function getSettings() {
  return load(KEYS.SETTINGS, { homeLocation: 'Keet', autoAddHome: true })
}
export function saveSettings(settings) { save(KEYS.SETTINGS, settings) }

export function getCustomLocations() { return load(KEYS.CUSTOM_LOCATIONS, []) }
export function saveCustomLocations(locs) { save(KEYS.CUSTOM_LOCATIONS, locs) }

export function getCustomDistances() { return load(KEYS.CUSTOM_DISTANCES, {}) }
export function saveCustomDistances(dists) { save(KEYS.CUSTOM_DISTANCES, dists) }

export function getGeoCache() { return load(KEYS.GEO_CACHE, {}) }
export function saveGeoCache(cache) { save(KEYS.GEO_CACHE, cache) }
