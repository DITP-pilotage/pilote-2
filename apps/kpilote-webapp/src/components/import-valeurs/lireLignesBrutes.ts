const celluleVersTexte = (cellule: unknown): string => {
  if (cellule == null) return ''
  if (typeof cellule === 'string') return cellule
  if (typeof cellule === 'number' || typeof cellule === 'boolean' || typeof cellule === 'bigint') {
    return String(cellule)
  }
  return ''
}

export function lignesDepuisMatrice({
  matrice,
}: {
  matrice: unknown[][]
}): Array<Record<string, unknown>> {
  const [ligneEntetes, ...lignes] = matrice
  if (ligneEntetes === undefined) return []
  const entetes = ligneEntetes.map((cellule) => celluleVersTexte(cellule).trim())

  return lignes
    .filter((ligne) => ligne.some((cellule) => celluleVersTexte(cellule).trim().length > 0))
    .map((ligne) => {
      const record: Record<string, unknown> = {}
      entetes.forEach((entete, index) => {
        if (entete.length > 0) record[entete] = ligne[index]
      })
      return record
    })
}

export async function lireLignesBrutes({
  file,
}: {
  file: File
}): Promise<Array<Record<string, unknown>>> {
  const XLSX = await import('xlsx')
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array', cellDates: true })
  const nomFeuille = workbook.SheetNames[0]
  if (nomFeuille === undefined) return []
  const feuille = workbook.Sheets[nomFeuille]
  if (feuille === undefined) return []
  const matrice = XLSX.utils.sheet_to_json<unknown[]>(feuille, {
    header: 1,
    raw: true,
    blankrows: false,
  })
  return lignesDepuisMatrice({ matrice })
}
