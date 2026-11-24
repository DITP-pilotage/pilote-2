export type LectureMatrice = { ok: true; matrice: unknown[][] } | { ok: false }

const isCsv = (file: File): boolean =>
  /\.(csv|tsv|txt)$/i.test(file.name) || file.type === 'text/csv'

// Un CSV est en général en UTF-8 ; les exports de tableur anciens sont en
// Windows-1252, qu'on reconnaît à ce que le fichier n'est pas de l'UTF-8 valide.
const decodeText = (data: ArrayBuffer): string => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(data)
  } catch {
    return new TextDecoder('windows-1252').decode(data)
  }
}

// Lecture bas niveau d'un fichier CSV ou Excel en matrice de cellules brutes.
// Seul point qui charge `xlsx` et lit le fichier.
export async function fichierVersMatrice({ file }: { file: File }): Promise<LectureMatrice> {
  const XLSX = await import('xlsx')
  try {
    const data = await file.arrayBuffer()
    // Les cellules d'un CSV restent du texte : la bibliothèque lirait « 12,4 »
    // comme 124 et « 03/04/2024 » à l'américaine. Dates et nombres sont lus plus
    // tard par les parseurs de l'import, qui connaissent les formats français.
    const workbook = isCsv(file)
      ? XLSX.read(decodeText(data), { type: 'string', raw: true })
      : XLSX.read(data, { type: 'array', cellDates: true })
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
