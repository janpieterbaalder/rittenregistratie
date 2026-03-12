import './style.css'
import { LOCATIONS, findLocationByName } from './data/locations.js'
import { lookupDistance, calculateTripDistances, autoCalculateDistance } from './utils/distance.js'
import { getTrips, addTrip, deleteTrip, getSavedRoutes, saveSavedRoutes, getSettings, saveSettings, getCustomLocations, initRemoteData, addCustomLocationRemote, deleteLocationRemote, getHiddenLocationNames } from './utils/storage.js'
import { formatDate, formatDateShort, formatMonthYear, todayISO } from './utils/formatters.js'

// State
let currentStops = []
let currentMonth = new Date().getMonth()
let currentYear = new Date().getFullYear()

// All available location names (built-in + custom, minus hidden)
function getAllLocations() {
  const hidden = getHiddenLocationNames()
  const builtIn = LOCATIONS.filter(l => !hidden.has(l.name))
  const custom = getCustomLocations().map(c => ({ ...c, org: c.org || 'custom' }))
  return [...builtIn, ...custom]
}

function getAllLocationNames() {
  return getAllLocations().map(l => l.name)
}

// ==========================================
// Navigation
// ==========================================
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(`view-${btn.dataset.view}`).classList.add('active')

    if (btn.dataset.view === 'list') renderTripList()
    if (btn.dataset.view === 'routes') renderSavedRoutes()
    if (btn.dataset.view === 'settings') loadSettings()
    if (btn.dataset.view === 'data') renderDataView()
  })
})

// Hidden data tab: dubbelklik naast Instellingen
document.querySelector('nav').addEventListener('dblclick', (e) => {
  const settingsBtn = document.querySelector('[data-view="settings"]')
  const rect = settingsBtn.getBoundingClientRect()
  // Check if click is to the right of the settings button
  if (e.clientX > rect.right - 10) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
    document.querySelector('[data-view="data"]').classList.add('active')
    document.getElementById('view-data').classList.add('active')
    renderDataView()
  }
})

// ==========================================
// Trip Form - Stop Management
// ==========================================
const stopsContainer = document.getElementById('stops-container')
const tripDate = document.getElementById('trip-date')
tripDate.value = todayISO()

function initStops() {
  const settings = getSettings()
  currentStops = settings.autoAddHome ? [settings.homeLocation, '', settings.homeLocation] : ['', '']
  renderStops()
}

function renderStops() {
  stopsContainer.innerHTML = ''
  currentStops.forEach((stop, idx) => {
    // Show leg distance between stops
    if (idx > 0) {
      const prev = currentStops[idx - 1]
      const curr = stop
      let distText = ''
      let unknown = false
      if (prev && curr) {
        const d = lookupDistance(prev, curr)
        if (d !== null) {
          distText = `${d} km`
        } else {
          distText = '? km (onbekend)'
          unknown = true
        }
      }
      const legDiv = document.createElement('div')
      legDiv.className = `leg-distance-row${unknown ? ' unknown' : ''}`
      legDiv.textContent = distText
      stopsContainer.appendChild(legDiv)
    }

    const row = document.createElement('div')
    row.className = 'stop-row'
    row.innerHTML = `
      <span class="stop-number">${idx + 1}</span>
      <div class="location-input-wrapper">
        <input type="text" class="location-input" value="${stop}" placeholder="Zoek locatie..." data-idx="${idx}" autocomplete="off">
      </div>
      ${currentStops.length > 2 ? `<button class="remove-stop" data-idx="${idx}">&times;</button>` : ''}
    `
    stopsContainer.appendChild(row)
  })

  // Attach events
  stopsContainer.querySelectorAll('.location-input').forEach(input => {
    input.addEventListener('input', (e) => onLocationInput(e))
    input.addEventListener('focus', (e) => onLocationInput(e))
    input.addEventListener('blur', () => setTimeout(closeAllDropdowns, 200))
    input.addEventListener('keydown', (e) => onLocationKeydown(e))
  })

  stopsContainer.querySelectorAll('.remove-stop').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx)
      currentStops.splice(idx, 1)
      renderStops()
    })
  })

  updateTripSummary()
}

document.getElementById('add-stop-btn').addEventListener('click', () => {
  // Insert before last stop if auto-home
  const settings = getSettings()
  if (settings.autoAddHome && currentStops.length > 0 && currentStops[currentStops.length - 1] === settings.homeLocation) {
    currentStops.splice(currentStops.length - 1, 0, '')
  } else {
    currentStops.push('')
  }
  renderStops()
  // Focus new input
  const inputs = stopsContainer.querySelectorAll('.location-input')
  const newInput = settings.autoAddHome ? inputs[inputs.length - 2] : inputs[inputs.length - 1]
  if (newInput) newInput.focus()
})

function updateTripSummary() {
  const filledStops = currentStops.filter(s => s)
  const summary = document.getElementById('trip-summary')
  const totalEl = document.getElementById('trip-total-km')

  if (filledStops.length >= 2) {
    const { total } = calculateTripDistances(filledStops)
    totalEl.textContent = `${total} km`
    summary.classList.remove('hidden')
  } else {
    summary.classList.add('hidden')
  }
}

// ==========================================
// Auto-lookup unknown distances
// ==========================================
let resolveTimer = null
let resolveRunning = false

function resolveUnknownDistances() {
  clearTimeout(resolveTimer)
  resolveTimer = setTimeout(() => _doResolveUnknownDistances(), 300)
}

async function _doResolveUnknownDistances() {
  if (resolveRunning) return
  resolveRunning = true

  try {
    const filledStops = currentStops.filter(s => s)
    if (filledStops.length < 2) return

    // Collect unique unknown pairs
    const unknownPairs = []
    for (let i = 0; i < filledStops.length - 1; i++) {
      const from = filledStops[i]
      const to = filledStops[i + 1]
      if (from === to) continue
      if (lookupDistance(from, to) !== null) continue
      unknownPairs.push({ from, to })
    }

    if (!unknownPairs.length) return

    // Show loading indicators
    const legRows = stopsContainer.querySelectorAll('.leg-distance-row')
    for (const { to } of unknownPairs) {
      const legIdx = currentStops.indexOf(to)
      const legRow = legRows[legIdx - 1]
      if (legRow) {
        legRow.textContent = 'Afstand opzoeken...'
        legRow.className = 'leg-distance-row loading'
      }
    }

    // Calculate all unknown distances
    for (const { from, to } of unknownPairs) {
      await autoCalculateDistance(from, to)
    }

    // Always re-render to update status (success or failure)
    renderStops()
    updateTripSummary()
  } finally {
    resolveRunning = false
  }
}

// ==========================================
// Location Autocomplete
// ==========================================
let highlightedIdx = -1

function onLocationInput(e) {
  const input = e.target
  const idx = parseInt(input.dataset.idx)
  const query = input.value.toLowerCase().trim()
  currentStops[idx] = input.value

  closeAllDropdowns()
  if (!query) { updateTripSummary(); return }

  const allLocs = getAllLocations()
  // Score and sort: exact start > word start > contains
  const matches = allLocs
    .filter(l => l.name.toLowerCase().includes(query))
    .sort((a, b) => {
      const aLower = a.name.toLowerCase()
      const bLower = b.name.toLowerCase()
      const aStarts = aLower.startsWith(query) ? 0 : 1
      const bStarts = bLower.startsWith(query) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return aLower.localeCompare(bLower)
    })
    .slice(0, 12)

  if (!matches.length) return

  highlightedIdx = -1
  const dropdown = document.createElement('div')
  dropdown.className = 'autocomplete-list'

  matches.forEach((loc, i) => {
    const item = document.createElement('div')
    item.className = 'autocomplete-item'
    const orgLabel = loc.org === 'custom' ? 'Eigen' : loc.org === 'beide' ? 'B+F' : loc.org.charAt(0).toUpperCase() + loc.org.slice(1)
    const badgeClass = `badge-${loc.org}`
    item.innerHTML = `
      <span>${loc.name} <span class="muted" style="font-size:0.75rem">${loc.city || ''}</span></span>
      <span class="org-badge ${badgeClass}">${orgLabel}</span>
    `
    item.addEventListener('mousedown', (e) => {
      e.preventDefault()
      selectLocation(idx, loc.name)
    })
    dropdown.appendChild(item)
  })

  input.closest('.location-input-wrapper').appendChild(dropdown)
}

function onLocationKeydown(e) {
  const wrapper = e.target.closest('.location-input-wrapper')
  const dropdown = wrapper.querySelector('.autocomplete-list')
  if (!dropdown) return

  const items = dropdown.querySelectorAll('.autocomplete-item')
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1)
    items.forEach((it, i) => it.classList.toggle('highlighted', i === highlightedIdx))
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIdx = Math.max(highlightedIdx - 1, 0)
    items.forEach((it, i) => it.classList.toggle('highlighted', i === highlightedIdx))
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightedIdx >= 0 && items[highlightedIdx]) {
      items[highlightedIdx].dispatchEvent(new Event('mousedown'))
    }
  } else if (e.key === 'Escape') {
    closeAllDropdowns()
  }
}

function selectLocation(stopIdx, name) {
  currentStops[stopIdx] = name
  renderStops()
  resolveUnknownDistances()
}

function closeAllDropdowns() {
  document.querySelectorAll('.autocomplete-list').forEach(d => d.remove())
}

// ==========================================
// Save Trip
// ==========================================
document.getElementById('save-trip-btn').addEventListener('click', () => {
  const date = tripDate.value
  const stops = currentStops.filter(s => s)
  if (!date) return alert('Selecteer een datum')
  if (stops.length < 2) return alert('Voeg minimaal 2 stops toe')

  // Verify all locations exist
  const allNames = getAllLocationNames()
  const unknown = stops.filter(s => !allNames.includes(s))
  if (unknown.length) return alert(`Onbekende locatie(s): ${unknown.join(', ')}`)

  const { legs, total } = calculateTripDistances(stops)

  addTrip({ date, stops, legs, total })

  // Reset form
  const settings = getSettings()
  currentStops = settings.autoAddHome ? [settings.homeLocation, '', settings.homeLocation] : ['', '']
  tripDate.value = todayISO()
  renderStops()

  // Show success
  const btn = document.getElementById('save-trip-btn')
  btn.textContent = 'Opgeslagen!'
  btn.style.background = '#059669'
  setTimeout(() => { btn.textContent = 'Rit opslaan'; btn.style.background = '' }, 1500)
})

// ==========================================
// Save Route (modal)
// ==========================================
const modal = document.getElementById('modal-overlay')
const routeNameInput = document.getElementById('route-name')

document.getElementById('save-route-btn').addEventListener('click', () => {
  const stops = currentStops.filter(s => s)
  if (stops.length < 2) return alert('Voeg minimaal 2 stops toe om een route op te slaan')
  modal.classList.remove('hidden')
  routeNameInput.value = ''
  routeNameInput.focus()
})

document.getElementById('modal-cancel').addEventListener('click', () => modal.classList.add('hidden'))
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden') })

document.getElementById('modal-save').addEventListener('click', () => {
  const name = routeNameInput.value.trim()
  if (!name) return alert('Voer een naam in')
  const stops = currentStops.filter(s => s)
  const routes = getSavedRoutes()
  routes.push({ id: Date.now().toString(), name, stops })
  saveSavedRoutes(routes)
  modal.classList.add('hidden')
})

// ==========================================
// Trip List / Month Overview
// ==========================================
function renderTripList() {
  const trips = getTrips()
  const monthTrips = trips.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  // Month title
  const titleDate = new Date(currentYear, currentMonth, 1)
  document.getElementById('month-title').textContent = formatMonthYear(titleDate.toISOString())

  // Summary
  const totalKm = monthTrips.reduce((sum, t) => sum + (t.total || 0), 0)
  document.getElementById('month-summary').innerHTML = `${totalKm} km in ${monthTrips.length} rit${monthTrips.length !== 1 ? 'ten' : ''}`

  // List
  const list = document.getElementById('trips-list')
  if (!monthTrips.length) {
    list.innerHTML = '<p class="muted" style="text-align:center;padding:2rem 0">Geen ritten in deze maand</p>'
    return
  }

  list.innerHTML = monthTrips.map(t => `
    <div class="trip-item">
      <div class="trip-item-header">
        <span class="trip-item-date">${formatDate(t.date)}</span>
        <span class="trip-item-km">${t.total} km</span>
      </div>
      <div class="trip-item-stops">${t.stops.join(' → ')}</div>
      <div class="trip-item-actions">
        <button class="btn-danger btn-sm" onclick="window._deleteTrip('${t.id}')">Verwijderen</button>
      </div>
    </div>
  `).join('')
}

window._deleteTrip = (id) => {
  if (confirm('Weet je zeker dat je deze rit wilt verwijderen?')) {
    deleteTrip(id)
    renderTripList()
  }
}

document.getElementById('prev-month').addEventListener('click', () => {
  currentMonth--
  if (currentMonth < 0) { currentMonth = 11; currentYear-- }
  renderTripList()
})

document.getElementById('next-month').addEventListener('click', () => {
  currentMonth++
  if (currentMonth > 11) { currentMonth = 0; currentYear++ }
  renderTripList()
})

// ==========================================
// Excel Export
// ==========================================
document.getElementById('export-btn').addEventListener('click', async () => {
  const { utils, writeFile } = await import('xlsx')
  const trips = getTrips().filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  if (!trips.length) return alert('Geen ritten om te exporteren')

  const rows = [['Datum', 'Stop 1', 'Stop 2', 'Stop 3', 'Stop 4', 'Stop 5', 'Stop 6', 'Stop 7', 'Stop 8', 'Stop 9', 'Stop 10', 'Totaal km', 'Leg 1 km', 'Leg 2 km', 'Leg 3 km', 'Leg 4 km', 'Leg 5 km', 'Leg 6 km', 'Leg 7 km', 'Leg 8 km', 'Leg 9 km']]

  for (const t of trips) {
    const row = [t.date]
    for (let i = 0; i < 10; i++) row.push(t.stops[i] || '')
    row.push(t.total)
    for (let i = 0; i < 9; i++) row.push(t.legs?.[i] ?? '')
    rows.push(row)
  }

  // Totals row
  const totalKm = trips.reduce((s, t) => s + (t.total || 0), 0)
  const totRow = ['', '', '', '', '', '', '', '', '', 'Totaal', '', totalKm]
  rows.push(totRow)

  const ws = utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, ...Array(10).fill({ wch: 18 }), { wch: 10 }, ...Array(9).fill({ wch: 9 })]

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Ritten')

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  writeFile(wb, `Rittenregistratie ${monthName}.xlsx`)
})

// ==========================================
// Saved Routes
// ==========================================
function renderSavedRoutes() {
  const routes = getSavedRoutes()
  const list = document.getElementById('saved-routes-list')
  const noMsg = document.getElementById('no-routes-msg')

  if (!routes.length) {
    list.innerHTML = ''
    noMsg.classList.remove('hidden')
    return
  }

  noMsg.classList.add('hidden')
  list.innerHTML = routes.map(r => `
    <div class="route-item">
      <div class="route-item-info">
        <div class="route-item-name">${r.name}</div>
        <div class="route-item-stops">${r.stops.join(' → ')}</div>
      </div>
      <div class="route-item-actions">
        <button class="btn-secondary btn-sm" onclick="window._useRoute('${r.id}')">Gebruiken</button>
        <button class="btn-danger btn-sm" onclick="window._deleteRoute('${r.id}')">X</button>
      </div>
    </div>
  `).join('')
}

window._useRoute = (id) => {
  const routes = getSavedRoutes()
  const route = routes.find(r => r.id === id)
  if (!route) return
  currentStops = [...route.stops]
  renderStops()
  // Switch to trip view
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelector('[data-view="trip"]').classList.add('active')
  document.getElementById('view-trip').classList.add('active')
  tripDate.value = todayISO()
}

window._deleteRoute = (id) => {
  if (confirm('Route verwijderen?')) {
    saveSavedRoutes(getSavedRoutes().filter(r => r.id !== id))
    renderSavedRoutes()
  }
}

// ==========================================
// Settings
// ==========================================
function loadSettings() {
  const settings = getSettings()
  document.getElementById('auto-add-home').checked = settings.autoAddHome

  // Render home location picker
  const container = document.getElementById('home-location-picker')
  container.innerHTML = `<input type="text" id="home-loc-input" value="${settings.homeLocation}" placeholder="Zoek locatie...">`
  const input = document.getElementById('home-loc-input')
  input.addEventListener('input', () => {
    const query = input.value.toLowerCase()
    const existing = container.querySelector('.autocomplete-list')
    if (existing) existing.remove()
    if (!query) return

    const matches = getAllLocations().filter(l => l.name.toLowerCase().includes(query)).slice(0, 8)
    if (!matches.length) return

    const dropdown = document.createElement('div')
    dropdown.className = 'autocomplete-list'
    dropdown.style.position = 'relative'
    matches.forEach(loc => {
      const item = document.createElement('div')
      item.className = 'autocomplete-item'
      item.textContent = loc.name
      item.addEventListener('mousedown', (e) => {
        e.preventDefault()
        input.value = loc.name
        dropdown.remove()
      })
      dropdown.appendChild(item)
    })
    container.appendChild(dropdown)
  })

}

document.getElementById('save-settings-btn').addEventListener('click', () => {
  const homeLocation = document.getElementById('home-loc-input')?.value || 'Keet'
  const autoAddHome = document.getElementById('auto-add-home').checked
  saveSettings({ homeLocation, autoAddHome })

  const btn = document.getElementById('save-settings-btn')
  btn.textContent = 'Opgeslagen!'
  setTimeout(() => { btn.textContent = 'Instellingen opslaan' }, 1500)

  // Re-init stops with new home
  initStops()
})

// ==========================================
// Add Custom Location
// ==========================================
document.getElementById('add-location-btn').addEventListener('click', async () => {
  const name = document.getElementById('new-loc-name').value.trim()
  const address = document.getElementById('new-loc-address').value.trim()
  const postcode = document.getElementById('new-loc-postcode').value.trim()
  const city = document.getElementById('new-loc-city').value.trim()
  const org = document.getElementById('new-loc-org').value
  const statusEl = document.getElementById('add-location-status')

  if (!name || !address || !city) return alert('Vul naam, straat en plaats in')

  // Check if name already exists
  if (getAllLocationNames().includes(name)) return alert('Deze locatienaam bestaat al')

  const newLoc = { id: `custom_${Date.now()}`, name, address, postcode, city, org }

  try {
    await addCustomLocationRemote(newLoc)
    statusEl.innerHTML = '<p class="muted">Locatie toegevoegd! Afstanden worden automatisch berekend bij gebruik.</p>'
  } catch (err) {
    statusEl.innerHTML = `<p class="muted" style="color:var(--danger)">Fout: ${err.message}</p>`
  }

  document.getElementById('new-loc-name').value = ''
  document.getElementById('new-loc-address').value = ''
  document.getElementById('new-loc-postcode').value = ''
  document.getElementById('new-loc-city').value = ''

  setTimeout(() => { statusEl.innerHTML = '' }, 5000)
})

// ==========================================
// Data View (verborgen tab)
// ==========================================
function renderDataView() {
  const allLocs = getAllLocations()

  // === Locatielijst ===
  const locContainer = document.getElementById('data-locations-table')
  let locHtml = '<table class="data-loc-table"><thead><tr><th>Naam</th><th>Adres</th><th>Postcode</th><th>Plaats</th><th>Org</th><th></th></tr></thead><tbody>'
  for (const loc of allLocs) {
    const orgLabel = loc.org === 'custom' ? 'Eigen' : loc.org === 'beide' ? 'B+F' : loc.org.charAt(0).toUpperCase() + loc.org.slice(1)
    const isBuiltIn = LOCATIONS.some(l => l.name === loc.name)
    locHtml += `<tr><td><strong>${loc.name}</strong></td><td>${loc.address || ''}</td><td>${loc.postcode || ''}</td><td>${loc.city || ''}</td><td><span class="org-badge badge-${loc.org}">${orgLabel}</span></td><td><button class="loc-delete-btn" data-name="${loc.name}" data-builtin="${isBuiltIn}" title="Verwijder ${loc.name}">&times;</button></td></tr>`
  }
  locHtml += '</tbody></table>'
  locContainer.innerHTML = locHtml

  // Delete button handlers
  locContainer.querySelectorAll('.loc-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.name
      const isBuiltIn = btn.dataset.builtin === 'true'
      const msg = isBuiltIn
        ? `"${name}" is een ingebouwde locatie. Wil je deze verbergen?`
        : `Weet je zeker dat je "${name}" wilt verwijderen? Dit verwijdert ook alle bijbehorende afstanden.`
      if (!confirm(msg)) return
      try {
        await deleteLocationRemote(name, isBuiltIn)
        renderDataView()
      } catch (err) {
        alert(`Fout bij verwijderen: ${err.message}`)
      }
    })
  })

  // === Matrix ===
  renderDataMatrix('')
  document.getElementById('matrix-filter').addEventListener('input', (e) => {
    renderDataMatrix(e.target.value.toLowerCase())
  })
}

function renderDataMatrix(filter) {
  const allLocs = getAllLocations()
  let names = allLocs.map(l => l.name)
  if (filter) {
    names = names.filter(n => n.toLowerCase().includes(filter))
  }

  const container = document.getElementById('data-matrix-table')
  if (!names.length) {
    container.innerHTML = '<p class="muted">Geen locaties gevonden.</p>'
    return
  }

  let html = '<table class="data-matrix"><thead><tr><th class="corner">Van \\ Naar</th>'
  for (const name of names) {
    const short = name.length > 8 ? name.substring(0, 7) + '\u2026' : name
    html += `<th title="${name}">${short}</th>`
  }
  html += '</tr></thead><tbody>'

  for (let i = 0; i < names.length; i++) {
    html += `<tr><th class="rh">${names[i]}</th>`
    for (let j = 0; j < names.length; j++) {
      if (i === j) {
        html += '<td class="self">-</td>'
      } else {
        const d = lookupDistance(names[i], names[j])
        if (d === null || d === undefined) {
          html += `<td class="miss" title="${names[i]} \u2192 ${names[j]}: onbekend">?</td>`
        } else if (d === 0) {
          html += `<td class="zero" title="${names[i]} \u2192 ${names[j]}: 0 km">0</td>`
        } else {
          html += `<td class="val" title="${names[i]} \u2192 ${names[j]}: ${d} km">${d}</td>`
        }
      }
    }
    html += '</tr>'
  }
  html += '</tbody></table>'
  container.innerHTML = html
}

// ==========================================
// Init
// ==========================================
async function init() {
  await initRemoteData()
  initStops()
}
init()
