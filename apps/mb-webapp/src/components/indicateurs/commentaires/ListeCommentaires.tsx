import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { CheckCircle2, History, Pencil, Plus } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { CarteCommentaire } from '@/components/indicateurs/commentaires/CarteCommentaire'
import {
  EditeurCommentaire,
  type MeteoCourante,
} from '@/components/indicateurs/commentaires/EditeurCommentaire'
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
  commentaires,
  meteoParCommentaire,
}: {
  indicateurId: string
  individuId: string
  type: IndicateurIndividuCommentaireType
  avecMeteo: boolean
  commentaires: CommentaireApiModel[]
  meteoParCommentaire: Map<string, MeteoCourante>
}) {
  const [editionId, setEditionId] = useState<string | null>(null)
  const creer = useCreerCommentaire(indicateurId, individuId, type)

  const brouillon = commentaires.find((commentaire) => commentaire.statut === 'BROUILLON')
  const reste = commentaires.filter((commentaire) => commentaire.id !== brouillon?.id)
  const etatEnCours = reste.find((commentaire) => commentaire.statut === 'PUBLIE')
  const historique = reste.filter((commentaire) => commentaire.id !== etatEnCours?.id)

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

  if (commentaires.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState title="Aucun commentaire pour le moment." />
        <div>{ajouter}</div>
      </div>
    )
  }

  const carteOuEditeur = (commentaire: CommentaireApiModel) =>
    editionId === commentaire.id ? (
      <EditeurCommentaire
        indicateurId={indicateurId}
        individuId={individuId}
        type={type}
        commentaire={commentaire}
        avecMeteo={avecMeteo}
        meteo={meteoParCommentaire.get(commentaire.id)}
        onClose={() => setEditionId(null)}
      />
    ) : (
      <CarteCommentaire
        commentaire={commentaire}
        indice={meteoParCommentaire.get(commentaire.id)?.indice}
        onEdit={() => setEditionId(commentaire.id)}
      />
    )

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
          {carteOuEditeur(etatEnCours)}
        </section>
      )}

      {historique.length > 0 && (
        <section>
          <Intitule icon={<History />}>Historique</Intitule>
          <div className="flex flex-col gap-4">
            {historique.map((commentaire) => (
              <div key={commentaire.id}>{carteOuEditeur(commentaire)}</div>
            ))}
          </div>
        </section>
      )}

      {!brouillon && <div>{ajouter}</div>}
    </div>
  )
}
