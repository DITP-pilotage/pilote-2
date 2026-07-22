export type LectureMatrice = { ok: true; matrice: unknown[][] } | { ok: false }

// Lecture bas niveau d'un fichier CSV/Excel en matrice de cellules brutes.
// Seul point qui charge `xlsx` et lit le fichier : les deux projections
// (rows strictes / records bruts) travaillent ensuite sur cette matrice.
export async function fichierVersMatrice({ file }: { file: File }): Promise<LectureMatrice> {
  const XLSX = await import('xlsx')
  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array', cellDates: true })
    const nomFeuille = workbook.SheetNames[0]
    if (nomFeuille === undefined) return { ok: false }
    const feuille = workbook.Sheets[nomFeuille]
    if (feuille === undefined) return { ok: false }
    const matrice = XLSX.utils.sheet_to_json<unknown[]>(feuille, {
      header: 1,
      raw: true,
      blankrows: false,
    })
    return { ok: true, matrice }
  } catch {
    return { ok: false }
  }
}
