// Explicit numeric allowlist: never send the profile object, name, DOB or letters.
export function summaryPayload(p) {
  return {core:p.core, indicators:p.indicators.map(i=>i.number),
    present:p.present, cycles:p.cycles, year:p.year, personalYear:p.personalYear};
}
