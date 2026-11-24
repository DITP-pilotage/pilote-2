import { readSpreadsheet } from '@/lib/readSpreadsheet'

import { type LectureTableau, matriceVersTableau } from './matriceVersTableau'

// Lecture d'un fichier CSV ou Excel vers le tableau source de l'import.
export const readTableau = async ({ file }: { file: File }): Promise<LectureTableau> => {
  const lecture = await readSpreadsheet({ file })
  if (!lecture.ok) return { ok: false, error: { code: 'UNREADABLE' } }
  return matriceVersTableau({ matrice: lecture.rows })
}
