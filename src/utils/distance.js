import { getDistance as matrixDistance } from '../data/matrix.js'
import { getCustomDistances, saveCustomDistances, getGeoCache, saveGeoCache, getCustomLocations } from './storage.js'
import { findLocationByName } from '../data/locations.js'

// Track in-flight lookups to avoid duplicate requests
const pendingLookups = new Map()

export function lookupDistance(from, to) {
  if (!from || !to) return null
  if (from === to) return 0

  // 1. Try main matrix
  const d = matrixDistance(from, to)
  if (d !== null && d !== undefined) return d

  // 2. Try custom distances (auto-calculated + manual)
  const custom = getCustomDistances()
  const k1 = `${from}|${to}`
  const k2 = `${to}|${from}`
  if (custom[k1] !== undefined) return custom[k1]
  if (custom[k2] !== undefined) return custom[k2]

  return null
}

export function saveCustomDistance(from, to, km) {
  const custom = getCustomDistances()
  custom[`${from}|${to}`] = km
  custom[`${to}|${from}`] = km
  saveCustomDistances(custom)
}

export function calculateTripDistances(stops) {
  const legs = []
  let total = 0
  for (let i = 0; i < stops.length - 1; i++) {
    const d = lookupDistance(stops[i], stops[i + 1])
    legs.push(d)
    if (d !== null) total += d
  }
  return { legs, total }
}

// ==========================================
// Auto-lookup: Nominatim geocoding + OSRM routing (gratis, geen key nodig)
// ==========================================

// Nominatim max 1 request/seconde
let lastNominatimCall = 0

async function nominatimSearch(query) {
  // Rate limit: wacht minimaal 1100ms tussen requests
  const now = Date.now()
  const wait = Math.max(0, 1100 - (now - lastNominatimCall))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastNominatimCall = Date.now()

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=nl&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Rittenregistratie/1.0 (baalderborg-groep)' }
  })
  return res.json()
}

async function geocodeLocation(name) {
  // Check cache first
  const cache = getGeoCache()
  if (cache[name]) return cache[name]

  // Find location in built-in locations OR custom locations
  let loc = findLocationByName(name)
  if (!loc) {
    const custom = getCustomLocations()
    loc = custom.find(c => c.name.toLowerCase().trim() === name.toLowerCase().trim())
  }
  if (!loc) return null

  // Build search queries based on available address info
  const queries = []
  if (loc.address && loc.city) {
    queries.push(`${loc.address}, ${loc.city}, Netherlands`)
  }
  if (loc.address && loc.postcode) {
    queries.push(`${loc.address}, ${loc.postcode} ${loc.city || ''}, Netherlands`)
  }
  if (loc.address) {
    queries.push(`${loc.address}, Netherlands`)
  }
  if (loc.postcode) {
    queries.push(`${loc.postcode}, ${loc.city || ''}, Netherlands`)
  }

  for (const query of queries) {
    try {
      const data = await nominatimSearch(query)
      if (data.length) {
        const coords = { lon: parseFloat(data[0].lon), lat: parseFloat(data[0].lat) }
        cache[name] = coords
        saveGeoCache(cache)
        return coords
      }
    } catch {
      // Try next query
    }
  }

  return null
}

async function osrmRouteDistance(fromCoords, toCoords) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== 'Ok') return null
  return Math.round(data.routes[0].distance / 1000)
}

/**
 * Zoek automatisch de afstand op tussen twee locaties via Nominatim + OSRM.
 * Slaat het resultaat op in custom distances zodat het de volgende keer direct beschikbaar is.
 * Returns: km (number) of null bij fout.
 */
export async function autoCalculateDistance(from, to) {
  if (!from || !to || from === to) return null

  // Already known?
  const existing = lookupDistance(from, to)
  if (existing !== null) return existing

  // Avoid duplicate in-flight requests
  const pairKey = [from, to].sort().join('|')
  if (pendingLookups.has(pairKey)) {
    return pendingLookups.get(pairKey)
  }

  const promise = (async () => {
    try {
      // Geocode both locations (uses cache)
      const [coordsFrom, coordsTo] = await Promise.all([
        geocodeLocation(from),
        geocodeLocation(to)
      ])

      if (!coordsFrom || !coordsTo) return null

      // Calculate route distance via OSRM
      const km = await osrmRouteDistance(coordsFrom, coordsTo)
      if (km === null) return null

      // Save to custom distances
      saveCustomDistance(from, to, km)

      return km
    } catch {
      return null
    } finally {
      pendingLookups.delete(pairKey)
    }
  })()

  pendingLookups.set(pairKey, promise)
  return promise
}
