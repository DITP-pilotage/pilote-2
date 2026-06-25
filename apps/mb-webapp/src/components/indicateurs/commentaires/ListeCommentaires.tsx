import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { CheckCircle2, History, Pencil, Plus } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { CarteCommentaire } from '@/components/indicateurs/commentaires/CarteCommentaire'
import {
  EditeurCommentaire,
  type MeteoCourante,
} from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { LigneHistorique } from '@/components/indicateurs/commentaires/LigneHistorique'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Text } from '@/components/ui/Typography'
import { useCreerCommentaire } from '@/mutations/commentaires'

function Intitule({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-text-muted">
      <span className="[&_svg]:size-4">{icon}</span>
      <Text as="span" variant="kicker" tone="muted">
        {children}
      </Text>
    </div>
  )
}

export function ListeCommentaires({
  indicateurId,
  individuId,
  type,
  avecMeteo,
  brouillon,
  publies,
  meteoParCommentaire,
}: {
  indicateurId: string
  individuId: string
  type: IndicateurIndividuCommentaireType
  avecMeteo: boolean
  // Brouillon de l'utilisateur courant (l'API ne renvoie que le sien). Au plus un.
  brouillon?: CommentaireApiModel | undefined
  publies: CommentaireApiModel[]
  meteoParCommentaire: Map<string, MeteoCourante>
}) {
  const [editionId, setEditionId] = useState<string | null>(null)
  const creer = useCreerCommentaire(indicateurId, individuId, type)

  const etatEnCours = publies[0]
  const historique = publies.slice(1)

  const ajouter = (
    <Button
      variant="secondary"
      type="button"
      onClick={() => creer.mutate({ type, contenu: '', statut: 'BROUILLON' })}
      disabled={creer.isPending}
    >
      <Plus />
      Ajouter un commentaire
    </Button>
  )

  if (!brouillon && publies.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState title="Aucun commentaire pour le moment." />
        <div>{ajouter}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {brouillon && (
        <section>
          <Intitule icon={<Pencil />}>Brouillon, à venir</Intitule>
          <EditeurCommentaire
            indicateurId={indicateurId}
            individuId={individuId}
            type={type}
            commentaire={brouillon}
            avecMeteo={avecMeteo}
            meteo={meteoParCommentaire.get(brouillon.id)}
          />
        </section>
      )}

      {etatEnCours && (
        <section>
          <Intitule icon={<CheckCircle2 />}>État en cours</Intitule>
          {editionId === etatEnCours.id ? (
            <EditeurCommentaire
              indicateurId={indicateurId}
              individuId={individuId}
              type={type}
              commentaire={etatEnCours}
              avecMeteo={avecMeteo}
              meteo={meteoParCommentaire.get(etatEnCours.id)}
              onClose={() => setEditionId(null)}
            />
          ) : (
            <CarteCommentaire
              commentaire={etatEnCours}
              indice={meteoParCommentaire.get(etatEnCours.id)?.indice}
              onEdit={() => setEditionId(etatEnCours.id)}
            />
          )}
        </section>
      )}

      {historique.length > 0 && (
        <section>
          <Intitule icon={<History />}>Historique</Intitule>
          <div className="divide-y divide-border rounded-xl border border-border px-5">
            {historique.map((commentaire) => (
              <LigneHistorique
                key={commentaire.id}
                commentaire={commentaire}
                indice={meteoParCommentaire.get(commentaire.id)?.indice}
              />
            ))}
          </div>
        </section>
      )}

      {!brouillon && <div>{ajouter}</div>}
    </div>
  )
}
