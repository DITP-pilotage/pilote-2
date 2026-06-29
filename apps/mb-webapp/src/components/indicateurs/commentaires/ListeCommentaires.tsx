import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { CheckCircle2, Eye, EyeOff, History, Pencil, Plus } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { CarteCommentaire } from '@/components/indicateurs/commentaires/CarteCommentaire'
import { EditeurCommentaire } from '@/components/indicateurs/commentaires/EditeurCommentaire'
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
  avecNiveauConfiance,
  brouillon,
  publies,
}: {
  indicateurId: string
  individuId: string
  type: IndicateurIndividuCommentaireType
  avecNiveauConfiance: boolean
  // Brouillon de l'utilisateur courant (l'API ne renvoie que le sien). Au plus un.
  brouillon?: CommentaireApiModel | undefined
  publies: CommentaireApiModel[]
}) {
  const [editionId, setEditionId] = useState<string | null>(null)
  const [brouillonVisible, setBrouillonVisible] = useState(true)
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-text-muted">
              <Pencil className="size-4" />
              <Text as="span" variant="kicker" tone="muted">
                Brouillon, à venir
              </Text>
            </div>
            <button
              type="button"
              onClick={() => setBrouillonVisible((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              {brouillonVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {brouillonVisible ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          {brouillonVisible ? (
            <EditeurCommentaire
              indicateurId={indicateurId}
              individuId={individuId}
              type={type}
              commentaire={brouillon}
              avecNiveauConfiance={avecNiveauConfiance}
            />
          ) : (
            <button
              type="button"
              onClick={() => setBrouillonVisible(true)}
              className="w-full rounded-r-sm border border-l-4 border-border border-l-warning bg-surface px-5 py-4 text-left text-sm text-text-muted transition-colors hover:bg-surface-tinted"
            >
              Brouillon en cours, masqué — cliquez pour l’afficher.
            </button>
          )}
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
              avecNiveauConfiance={avecNiveauConfiance}
              onClose={() => setEditionId(null)}
            />
          ) : (
            <CarteCommentaire
              indicateurId={indicateurId}
              individuId={individuId}
              commentaire={etatEnCours}
              avecNiveauConfiance={avecNiveauConfiance}
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
                indicateurId={indicateurId}
                individuId={individuId}
                commentaire={commentaire}
                avecNiveauConfiance={avecNiveauConfiance}
              />
            ))}
          </div>
        </section>
      )}

      {!brouillon && <div>{ajouter}</div>}
    </div>
  )
}
