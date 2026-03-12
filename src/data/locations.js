// Alle locaties met adres en organisatie
// Bijgewerkt op basis van Excel "locaties voor app.xlsx"
// org: 'baalderborg' | 'frion' | 'beide' | 'overig'
export const LOCATIONS = [
  // === FRION LOCATIES ===
  // Zwolle
  { id: 'frion_werkeren', name: 'Werkeren', address: 'Werkerlaan 50', postcode: '8043 LK', city: 'Zwolle', org: 'frion' },
  { id: 'frion_nicolaihof', name: 'Nicolaihof', address: 'Nicolaihof 23-47', postcode: '8031 PB', city: 'Zwolle', org: 'frion' },
  { id: 'frion_violierenstraat', name: 'Violierenstraat', address: 'Violierenstraat 44', postcode: '8013 TV', city: 'Zwolle', org: 'frion' },
  { id: 'frion_sprengpad', name: 'Sprengpad', address: 'Sprengpad 3-7', postcode: '8043 HD', city: 'Zwolle', org: 'frion' },
  { id: 'frion_stadshoeve', name: 'De Stadshoeve', address: 'Arendshorstlaan 23', postcode: '8043 VE', city: 'Zwolle', org: 'frion' },
  { id: 'frion_schumannlaan', name: 'Schumannlaan', address: 'Schumannlaan 2', postcode: '8031 PA', city: 'Zwolle', org: 'frion' },
  { id: 'frion_prunuspark', name: 'Prunuspark', address: 'Prunuspark 35', postcode: '8024 BA', city: 'Zwolle', org: 'frion' },
  { id: 'frion_beulakerwiede', name: 'Beulakerwiede', address: 'Beulakerwiede 25', postcode: '8033 CS', city: 'Zwolle', org: 'frion' },
  { id: 'frion_bachlaan', name: 'Bachlaan', address: 'Bachlaan 154-1', postcode: '8031 HL', city: 'Zwolle', org: 'frion' },
  { id: 'frion_arne', name: 'Arne', address: 'Arne 1-27', postcode: '8032 EH', city: 'Zwolle', org: 'frion' },
  { id: 'frion_eemhoeve', name: 'Eemhoeve', address: 'Eemlaan 25', postcode: '8033 EB', city: 'Zwolle', org: 'frion' },
  { id: 'frion_gouverneurlaan', name: 'Gouverneurlaan', address: 'Gouverneurlaan 26', postcode: '8016 BK', city: 'Zwolle', org: 'frion' },
  { id: 'frion_frankhuizerallee', name: 'Frankhuizerallee', address: 'Frankhuizerallee 68', postcode: '8043 XA', city: 'Zwolle', org: 'frion' },
  { id: 'frion_erasmuslaan', name: 'Erasmuslaan', address: 'Erasmuslaan 34', postcode: '8024 CR', city: 'Zwolle', org: 'frion' },
  { id: 'frion_molenkamp', name: 'Molenkamp', address: 'Molenkampsweg 1', postcode: '8022 CT', city: 'Zwolle', org: 'frion' },
  { id: 'frion_eekhoornveld', name: 'Eekhoornveld', address: 'Eekhoornveld 101-1', postcode: '8017 LP', city: 'Zwolle', org: 'frion' },
  { id: 'frion_kunstlijn', name: 'Kunst-Lijn', address: 'Esdoornstraat 3', postcode: '8021 WB', city: 'Zwolle', org: 'frion' },
  { id: 'frion_ternatestraat', name: 'Ternatestraat', address: 'Ternatestraat 2', postcode: '8022 NL', city: 'Zwolle', org: 'frion' },
  { id: 'frion_schubertstraat', name: 'Schubertstraat', address: 'Schubertstraat 72', postcode: '8031 ZE', city: 'Zwolle', org: 'frion' },
  { id: 'frion_staatsmanlaan', name: 'Staatsmanlaan', address: 'Staatsmanlaan 131', postcode: '8014 PW', city: 'Zwolle', org: 'frion' },
  { id: 'frion_wismarstraat', name: 'Wismarstraat', address: 'Wismarstraat 49', postcode: '8017 KW', city: 'Zwolle', org: 'frion' },
  { id: 'frion_schellerhoeve', name: 'De Schellerhoeve', address: 'Schellerpark 101', postcode: '8017 NZ', city: 'Zwolle', org: 'frion' },
  { id: 'frion_golfslag', name: 'Dagcentrum De Golfslag', address: 'Arne 1', postcode: '8032 EH', city: 'Zwolle', org: 'frion' },
  { id: 'frion_ijsselbolder', name: 'IJsselbolder', address: 'Commissarislaan 35', postcode: '8016 BE', city: 'Zwolle', org: 'frion' },
  { id: 'frion_commissarislaan', name: 'Commissarislaan 35', address: 'Commissarislaan 35', postcode: '8016 BE', city: 'Zwolle', org: 'frion' },
  { id: 'frion_vanyrtebelt', name: 'Van Yrtebelt', address: 'Van Yrtebelt 26/32', postcode: '8014 NM', city: 'Zwolle', org: 'frion' },
  { id: 'frion_oldpark', name: 'Oldpark', address: 'Prunuspark 35', postcode: '8024 BA', city: 'Zwolle', org: 'frion' },
  { id: 'frion_govertflinckstraat', name: 'Govert Flinckstraat', address: 'Govert Flinckstraat 31', postcode: '8021 ET', city: 'Zwolle', org: 'frion' },
  { id: 'frion_pietervanbleyswijkstraat', name: 'Pieter van Bleyswijkstraat', address: 'Pieter van Bleyswijkstraat 12', postcode: '8022 TN', city: 'Zwolle', org: 'frion' },
  // Steenwijk / omgeving
  { id: 'frion_anjelierstraat', name: 'Anjelierstraat', address: 'Anjelierstraat 30', postcode: '8331 WE', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_tgoor', name: "'t Goor", address: "'t Goor 1", postcode: '8336 KL', city: 'Baars', org: 'frion' },
  { id: 'frion_franshalsstraat', name: 'Frans Halsstraat', address: 'Frans Halsstraat 83', postcode: '8331 RH', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_onnastraat', name: 'Onnastraat', address: 'Onnastraat 2', postcode: '8331 HM', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_tukseweg', name: 'Tukseweg', address: 'Tukseweg 46', postcode: '8331 LC', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_slinger', name: 'Dagcentrum de Slinger', address: 'Meidoornstraat 1', postcode: '8331 NB', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_vangoghstraat', name: 'Van Goghstraat', address: 'Van Goghstraat 12', postcode: '8331 PS', city: 'Steenwijk', org: 'frion' },
  { id: 'frion_tukstheehuis', name: "Tuk's Theehuis", address: 'Bergweg 71', postcode: '8334 MC', city: 'Tuk', org: 'frion' },
  // Hasselt
  { id: 'frion_jutjesriet', name: 'Jutjesriet', address: 'Werkerlaan 1', postcode: '8061 RG', city: 'Hasselt', org: 'frion' },

  // === BAALDERBORG LOCATIES ===
  // Hardenberg cluster
  { id: 'hoogenweg', name: 'Hoogenweg', address: 'Hoogenweg 5', postcode: '7793 HN', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'vlasakkerkamp', name: 'Vlasakkerkamp', address: 'Vlasakkerkamp 2', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'spindel', name: 'Spindel', address: 'Vlasakkerkamp 13', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'oldenburg', name: 'De Oldenburg', address: 'Stationsstraat 5', postcode: '7772 CG', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'niehof', name: 'De Niehof', address: 'Singelberg 7a', postcode: '7772 DA', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'holte', name: 'Holte', address: 'Roeterskamp 6', postcode: '7772 MB', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'baaldergroen', name: 'Baaldergroen', address: 'Roeterskamp 5', postcode: '7772 MC', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'pijlkruid', name: 'Pijlkruid', address: 'Pijlkruid 31', postcode: '7772 ME', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'hofvanpepijn', name: 'Hof van Pepijn', address: 'Nijenstede 58C', postcode: '7772 CT', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'roots', name: 'Roots', address: 'Nachtegaalstraat 11', postcode: '7771 CK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'koppeling', name: 'Koppeling', address: 'Molensteen 3', postcode: '7773 NM', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'grasklokje80', name: 'Grasklokje 80', address: 'Grasklokje 80', postcode: '7772 NR', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'grasklokje45', name: 'Grasklokje 45', address: 'Grasklokje 45', postcode: '7772 NN', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'blanckvoortallee', name: 'Blanckvoortallee', address: 'Blanckvoortallee 8', postcode: '7773 AH', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'wijkboerderijbaalder', name: 'Wijkboerderij Baalder', address: 'Beekberg 45', postcode: '7772 DP', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'gilde', name: 'Gilde', address: 'Oosteinde 34a', postcode: '7772 CB', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'keet', name: 'Keet', address: 'Vlasakkerkamp 19', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  { id: 'wanne', name: 'Wanne', address: 'Vlasakkerkamp 6', postcode: '7772 MK', city: 'Hardenberg', org: 'baalderborg' },
  // Ommen cluster
  { id: 'vlinder', name: 'Vlinder', address: 'Van Reeuwijkstraat 50', postcode: '7731 EH', city: 'Ommen', org: 'baalderborg' },
  { id: 'elzenhoek', name: 'De Elzenhoek', address: 'Elzenstraat 1', postcode: '7731 VC', city: 'Ommen', org: 'baalderborg' },
  { id: 'ommeresstraat', name: 'Ommeresstraat', address: 'Ommeresstraat 7-9', postcode: '7731 XD', city: 'Ommen', org: 'baalderborg' },
  { id: 'hazelaar', name: 'De Hazelaar', address: 'Wilgenstraat 8', postcode: '7731 VH', city: 'Ommen', org: 'baalderborg' },
  { id: 'linde', name: 'De Linde', address: 'Wilgenstraat 6', postcode: '7731 VH', city: 'Ommen', org: 'baalderborg' },
  { id: 'esrand', name: 'De Esrand', address: 'Wilgenstraat 2-4', postcode: '7731 VH', city: 'Ommen', org: 'baalderborg' },
  { id: 'alteveer', name: 'Alteveer', address: 'Vermeerstraat 1a', postcode: '7731 SM', city: 'Ommen', org: 'baalderborg' },
  { id: 'heiendennen', name: 'Hei en Dennen', address: 'Stationsweg 37', postcode: '7731 AX', city: 'Ommen', org: 'baalderborg' },
  { id: 'mulert', name: 'De Mulert', address: 'Hessel Mulertstraat 22', postcode: '7731 CL', city: 'Ommen', org: 'baalderborg' },
  { id: 'gerarddoustraat', name: 'Gerard Doustraat', address: 'Gerard Doustraat 2', postcode: '7731 MX', city: 'Ommen', org: 'baalderborg' },
  { id: 'dante', name: 'Dante', address: 'Balkerweg 3', postcode: '7731 RX', city: 'Ommen', org: 'baalderborg' },
  { id: 'vandedemmarke', name: 'Van Dedem Marke', address: 'De Tjalk 49', postcode: '7701 LR', city: 'Dedemsvaart', org: 'baalderborg' },
  // Nijverdal cluster
  { id: 'nicolaasbeetsstraat', name: 'Nicolaas Beetsstraat', address: 'Nicolaas Beetsstraat 4', postcode: '7442 TL', city: 'Nijverdal', org: 'baalderborg' },
  { id: 'jeruzalemweg', name: 'Jeruzalemweg', address: 'Jeruzalemweg 36', postcode: '7443 TG', city: 'Nijverdal', org: 'baalderborg' },
  { id: 'onsstraatje', name: 'Ons Straatje', address: 'Jeruzalemweg 35', postcode: '7443 TG', city: 'Nijverdal', org: 'baalderborg' },
  { id: 'dahliastraat', name: 'Dahliastraat', address: 'Dahliastraat 2', postcode: '7442 LB', city: 'Nijverdal', org: 'baalderborg' },
  // Rijssen cluster
  { id: 'mauritshof', name: 'Mauritshof', address: 'Zeven Peggenweg 9', postcode: '7461 VA', city: 'Rijssen', org: 'baalderborg' },
  { id: 'grotestraat', name: 'Grotestraat', address: 'Grotestraat 29', postcode: '7461 KE', city: 'Rijssen', org: 'baalderborg' },
  { id: 'fluitekruid', name: 'Fluitekruid', address: 'Fluitekruid 4', postcode: '7463 EE', city: 'Rijssen', org: 'baalderborg' },
  { id: 'punt', name: 'Punt', address: 'H.J. van Opstallstraat 4', postcode: '7462 DM', city: 'Rijssen', org: 'baalderborg' },
  // Overige Baalderborg locaties
  { id: 'baalderschans', name: 'Baalderschans', address: 'Hardenbergerweg 23', postcode: '7778 HP', city: 'Loozen', org: 'baalderborg' },
  { id: 'bremstraat', name: 'Bremstraat', address: 'Bremstraat 2', postcode: '7676 BS', city: 'Westerhaar', org: 'baalderborg' },
  { id: 'spoor12', name: 'Spoor 12', address: 'Stationslaan 12', postcode: '7681 DL', city: 'Vroomshoop', org: 'baalderborg' },
  { id: 'koekange', name: 'Koekange', address: 'Koekangerdwarsdijk 2', postcode: '7958 ST', city: 'Koekange', org: 'baalderborg' },
  { id: 'waal', name: 'Het Waal', address: 'Het Waal 214', postcode: '7823 NB', city: 'Emmen', org: 'baalderborg' },
  { id: 'tyehof', name: 'Tyehof', address: 'De Tye 1', postcode: '7683 AS', city: 'Den Ham', org: 'baalderborg' },
  { id: 'nieuwewever', name: 'Nieuwe Wever', address: 'Kalanderij 1', postcode: '7776 XW', city: 'Slagharen', org: 'baalderborg' },
  { id: 'muldershoek', name: 'Muldershoek', address: 'Stationsweg 65', postcode: '7691 AP', city: 'Bergentheim', org: 'baalderborg' },
  { id: 'stegerveld', name: 'Zorglandgoed Stegerveld', address: 'Coevorderweg 35e', postcode: '7737 PE', city: 'Stegeren', org: 'baalderborg' },

  // === OVERIG ===
  { id: 'isala', name: 'Isala', address: 'Dr. Van Heesweg 2', postcode: '8025 AB', city: 'Zwolle', org: 'overig' },
  { id: 'ziekenhuishardenberg', name: 'Ziekenhuis Hardenberg', address: 'Jan Weitkamplaan 4a', postcode: '7772 SE', city: 'Hardenberg', org: 'overig' },
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
