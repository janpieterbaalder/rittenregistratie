// Alle locaties met adres en organisatie
// org: 'baalderborg' | 'frion' | 'beide' | 'overig'
export const LOCATIONS = [
  // === BAALDERBORG LOCATIES ===
  // Hardenberg cluster
  { id: 'keet', name: 'Keet', address: 'Vlasakkerkamp 19', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'hoogenweg', name: 'Hoogenweg', address: 'Hoogenweg 5', postcode: '7793 HN', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'vlasakkerkamp', name: 'Vlasakkerkamp', address: 'Vlasakkerkamp 2', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'spindel', name: 'Spindel', address: 'Vlasakkerkamp 12b', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'oldenburg', name: 'Oldenburg', address: 'Vlasakkerkamp 10', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'niehof', name: 'Niehof', address: 'Vlasakkerkamp 14', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'holte', name: 'Holte', address: 'Vlasakkerkamp 15', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'baaldergroen', name: 'Baaldergroen', address: 'Roeterskamp 5', postcode: '7772 MC', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'pijlkruid', name: 'Pijlkruid', address: 'Pijlkruid 2', postcode: '7772 NP', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'hofvanpepijn', name: 'Hof van Pepijn', address: 'Pepijnpad 1', postcode: '7772 MR', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'roots', name: 'Roots', address: 'Bruchterweg 180', postcode: '7772 BL', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'koppeling', name: 'Koppeling', address: 'Molensteen 3', postcode: '7773 NM', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'grasklokje80', name: 'Grasklokje 80', address: 'Grasklokje 80', postcode: '7772 NR', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'grasklokje45', name: 'Grasklokje 45', address: 'Grasklokje 45', postcode: '7772 NR', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'blanckvoortallee', name: 'Blanckvoortallee', address: 'Blanckvoortallee 8', postcode: '7773 AH', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'wanne', name: 'Wanne', address: 'Parkweg 3', postcode: '7772 XK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'gilde', name: 'Gilde', address: 'Stationsstraat 1', postcode: '7772 AA', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'ziekenhuishardenberg', name: 'Ziekenhuis Hardenberg', address: 'Doctor Deelenlaan 5', postcode: '7772 BG', city: 'Hardenberg', org: 'overig' },

  // Ommen / Dedemsvaart cluster
  { id: 'vlinder', name: 'Vlinder', address: 'Van Reeuwijkstraat 50', postcode: '7731 EH', city: 'Ommen', org: 'baalderborg' },
  { id: 'elzenhoek', name: 'De Elzenhoek', address: 'Van Reeuwijkstraat 50', postcode: '7731 EH', city: 'Ommen', org: 'baalderborg' },
  { id: 'hazelaar', name: 'Hazelaar', address: 'Chevalleraustraat 60', postcode: '7731 DA', city: 'Ommen', org: 'baalderborg' },
  { id: 'linde', name: 'Linde', address: 'Chevalleraustraat 60', postcode: '7731 DA', city: 'Ommen', org: 'baalderborg' },
  { id: 'esrand', name: 'Esrand', address: 'Chevalleraustraat 60', postcode: '7731 DA', city: 'Ommen', org: 'baalderborg' },
  { id: 'alteveer', name: 'Alteveer', address: 'Balkerweg 79', postcode: '7731 PJ', city: 'Ommen', org: 'baalderborg' },
  { id: 'heiendennen', name: 'Hei en Dennen', address: 'Dante 55', postcode: '7731 JJ', city: 'Ommen', org: 'baalderborg' },
  { id: 'mulert', name: 'Mulert', address: 'Mulertpad 10', postcode: '7731 PZ', city: 'Ommen', org: 'baalderborg' },
  { id: 'gerarddoustraat', name: 'Gerard Doustraat', address: 'Gerard Doustraat 2', postcode: '7731 KG', city: 'Ommen', org: 'baalderborg' },
  { id: 'dante', name: 'Dante', address: 'Dante 53', postcode: '7731 JJ', city: 'Ommen', org: 'baalderborg' },
  { id: 'vandedemmarke', name: 'Van Dedem Marke', address: 'De Tjalk 49', postcode: '7701 LR', city: 'Dedemsvaart', org: 'baalderborg' },

  // Nijverdal cluster
  { id: 'nicolaasbeetsstraat', name: 'Nicolaas Beetsstraat', address: 'Nicolaas Beetsstraat 4', postcode: '7442 TL', city: 'Nijverdal', org: 'baalderborg' },
  { id: 'jeruzalemweg', name: 'Jeruzalemweg', address: 'Jeruzalemweg 36', postcode: '7443 TG', city: 'Nijverdal', org: 'baalderborg' },
  { id: 'onsstraatje', name: 'Ons Straatje', address: 'Jeruzalemweg 35', postcode: '7443 TG', city: 'Nijverdal', org: 'baalderborg' },
  { id: 'dahliastraat', name: 'Dahliastraat', address: 'Dahliastraat 2', postcode: '7442 LB', city: 'Nijverdal', org: 'baalderborg' },

  // Rijssen cluster
  { id: 'mauritshof', name: 'Mauritshof', address: 'Zeven Peggenweg 9', postcode: '7461 VA', city: 'Rijssen', org: 'baalderborg' },
  { id: 'fluitekruid', name: 'Fluitekruid', address: 'Fluitekruid 4', postcode: '7463 EE', city: 'Rijssen', org: 'baalderborg' },
  { id: 'punt', name: 'Punt', address: 'H.J. van Opstallstraat 4', postcode: '7462 DM', city: 'Rijssen', org: 'baalderborg' },

  // Overige Baalderborg locaties
  { id: 'bremstraat', name: 'Bremstraat', address: 'Bremstraat 2', postcode: '7676 BS', city: 'Westerhaar', org: 'baalderborg' },
  { id: 'spoor12', name: 'Spoort 12', address: 'Stationslaan 12', postcode: '7681 DL', city: 'Vroomshoop', org: 'baalderborg' },
  { id: 'koekange', name: 'Koekange', address: 'Koekanger dwarsdijk 2', postcode: '7958 ST', city: 'Koekange', org: 'baalderborg' },
  { id: 'waal', name: 'Waal', address: 'Het Waal 214', postcode: '7823 NB', city: 'Emmen', org: 'baalderborg' },
  { id: 'tyehof', name: 'Tyehof', address: 'De Tye 1', postcode: '7683 AS', city: 'Den Ham', org: 'baalderborg' },
  { id: 'nieuwewever', name: 'Nieuwe Wever', address: 'Kalanderij 1', postcode: '7776 XW', city: 'Slagharen', org: 'baalderborg' },
  { id: 'muldershoek', name: 'Muldershoek', address: 'Stationsweg 65', postcode: '7691 AP', city: 'Bergentheim', org: 'baalderborg' },
  { id: 'stegerveld', name: 'Stegerveld', address: 'Coevorderweg 35e', postcode: '7737 PE', city: 'Stegeren', org: 'baalderborg' },
  { id: 'lutten', name: 'Lutten', address: 'Gramsbergerweg 10', postcode: '7775 AB', city: 'Lutten', org: 'baalderborg' },

  // === GEDEELDE LOCATIES (Baalderborg + Frion) ===
  { id: 'ijsselbolder', name: 'Ijsselbolder', address: 'Commissarislaan 35', postcode: '8016 BE', city: 'Zwolle', org: 'beide' },
  { id: 'erasmuslaan', name: 'Erasmuslaan', address: 'Erasmuslaan 44', postcode: '8024 PT', city: 'Zwolle', org: 'beide' },
  { id: 'frankhuizerallee', name: 'Frankhuizerallee', address: 'Frankhuizerallee 70', postcode: '8043 JG', city: 'Zwolle', org: 'beide' },
  { id: 'govertflinckstraat', name: 'Govert Flinckstraat', address: 'Govert Flinckstraat 31', postcode: '8021 ET', city: 'Zwolle', org: 'beide' },
  { id: 'franshalsstraat', name: 'Frans Halsstraat', address: 'Frans Halsstraat 26', postcode: '8331 KG', city: 'Steenwijk', org: 'beide' },
  { id: 'werkeren', name: 'Werkeren', address: 'Werkeren 1', postcode: '8024 AA', city: 'Zwolle', org: 'beide' },

  // === OVERIGE ===
  { id: 'isala', name: 'Isala', address: 'Dr. Van Heesweg 2', postcode: '8025 AB', city: 'Zwolle', org: 'overig' },
  { id: 'sheerenloo', name: "'s Heeren Loo Ermelo", address: 'Zandlaan 2', postcode: '3851 EH', city: 'Ermelo', org: 'overig' },

  // === FRION-ONLY LOCATIES ===
  { id: 'frion_prunuspark', name: 'Prunuspark', address: 'Prunuspark 35', postcode: '8024 AN', city: 'Zwolle', org: 'frion' },
  { id: 'frion_bachlaan', name: 'Bachlaan', address: 'Bachlaan 4', postcode: '8031 HK', city: 'Zwolle', org: 'frion' },
  { id: 'frion_beulakerwiede', name: 'Beulakerwiede', address: 'Beulakerwiede 25', postcode: '8032 DA', city: 'Zwolle', org: 'frion' },
  { id: 'frion_nicolaihof', name: 'Nicolaihof', address: 'Thorbeckegracht 42', postcode: '8011 WK', city: 'Zwolle', org: 'frion' },
  { id: 'frion_schumannlaan', name: 'Schumannlaan', address: 'Schumannlaan 2', postcode: '8031 JN', city: 'Zwolle', org: 'frion' },
  { id: 'frion_ternatestraat', name: 'Ternatestraat', address: 'Ternatestraat 7', postcode: '8022 BW', city: 'Zwolle', org: 'frion' },
  { id: 'frion_staatsmanlaan', name: 'Staatsmanlaan', address: 'Staatsmanlaan 131', postcode: '8032 CK', city: 'Zwolle', org: 'frion' },
  { id: 'frion_wismarstraat', name: 'Wismarstraat', address: 'Wismarstraat 2', postcode: '8017 EK', city: 'Zwolle', org: 'frion' },
  { id: 'frion_stadshoeve', name: 'De Stadshoeve', address: 'Schuurmanstraat 10', postcode: '8011 KG', city: 'Zwolle', org: 'frion' },
  { id: 'frion_schellerhoeve', name: 'De Schellerhoeve', address: 'Schellerpad 2', postcode: '8017 AK', city: 'Zwolle', org: 'frion' },
  { id: 'frion_oldpark', name: 'Oldpark', address: 'Oldeneelallee 2', postcode: '8017 JN', city: 'Zwolle', org: 'frion' },
  { id: 'frion_anjelierstraat', name: 'Anjelierstraat', address: 'Anjelierstraat 2', postcode: '8331 HM', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_onnastraat', name: 'Onnastraat', address: 'Onnastraat 2', postcode: '8331 HV', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_vangoghstraat', name: 'Van Goghstraat', address: 'Van Goghstraat 1', postcode: '8331 KJ', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_tgoor', name: "'t Goor", address: "'t Goor 1", postcode: '8336 MG', city: 'Baars', org: 'frion' },
  { id: 'frion_slinger', name: 'Dagcentrum De Slinger', address: 'Tukseweg 132', postcode: '8331 LH', city: 'Steenwijk', org: 'frion' },
]

// Lookup by name (case-insensitive, trimmed)
const locationByName = new Map()
LOCATIONS.forEach(loc => {
  locationByName.set(loc.name.toLowerCase().trim(), loc)
})

export function findLocationByName(name) {
  return locationByName.get(name.toLowerCase().trim()) || null
}

export function getLocationGroups() {
  const groups = { baalderborg: [], frion: [], beide: [], overig: [] }
  LOCATIONS.forEach(loc => {
    if (groups[loc.org]) groups[loc.org].push(loc)
  })
  return groups
}
