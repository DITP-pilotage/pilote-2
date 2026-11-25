import { db } from '@/framework/persistence/dbStore'

// Valeurs saisies sur une combinaison qui contient la modalité, tous axes
// confondus. Les valeurs de ses descendants n'en font pas partie.
export const countValeursForModalite = ({ modaliteId }: { modaliteId: string }): Promise<number> =>
  db().valeurAvancement.count({
    where: { combinaison: { modalites: { some: { modaliteId } } } },
  })
