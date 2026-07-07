import {
  PERIODE_MISE_A_JOUR_LABELS,
  type ConfigurationIndicateurReferentielApiModel,
  type PeriodeMiseAJour,
  type UniteIndicateurApiModel,
} from '@pilote/mb-shared/indicateur'
import { type ResponsableApiModel } from '@pilote/mb-shared/responsable'

import { DescriptionList } from '@/components/ui/DescriptionList'
import { ResponsablesList } from '@/components/ui/ResponsablesList'
import { Heading } from '@/components/ui/Typography'
import { formatDateTimeFr } from '@/lib/format'

const VALEUR_VIDE = '—'

const formatPeriodeMiseAJour = (periode: PeriodeMiseAJour | null, jour: number | null): string => {
  if (!periode) return VALEUR_VIDE
  const libelle = PERIODE_MISE_A_JOUR_LABELS[periode]
  return jour === null ? libelle : `${libelle} (le ${jour})`
}

const formatReferentiels = (
  referentiels: ReadonlyArray<ConfigurationIndicateurReferentielApiModel>,
): string => {
  if (referentiels.length === 0) return VALEUR_VIDE
  return referentiels.map((r) => r.nom).join(', ')
}

type IndicateurMetadonneesProps = {
  indicateur: {
    id: string
    nom: string
    unite: UniteIndicateurApiModel | null
    description: string | null
    methodeCalcul: string | null
    sourceDonnees: string | null
    sourceUrl: string | null
    periodeMiseAJour: PeriodeMiseAJour | null
    jourMiseAJour: number | null
    referentiels: ReadonlyArray<ConfigurationIndicateurReferentielApiModel>
    responsables: ReadonlyArray<ResponsableApiModel>
    createdAt: string
    updatedAt: string
  }
}

export function IndicateurMetadonnees({ indicateur }: IndicateurMetadonneesProps) {
  return (
    <div className="flex flex-col gap-8">
      <DescriptionList>
        <DescriptionList.Item label="ID">{indicateur.id}</DescriptionList.Item>
        <DescriptionList.Item label="Nom">{indicateur.nom}</DescriptionList.Item>
        <DescriptionList.Item label="Unité">
          {indicateur.unite
            ? indicateur.unite.abbreviation
              ? `${indicateur.unite.libelle} (${indicateur.unite.abbreviation})`
              : indicateur.unite.libelle
            : VALEUR_VIDE}
        </DescriptionList.Item>
        <DescriptionList.Item label="Description">
          <span className="whitespace-pre-line">{indicateur.description ?? VALEUR_VIDE}</span>
        </DescriptionList.Item>
        <DescriptionList.Item label="Méthode de calcul">
          <span className="whitespace-pre-line">{indicateur.methodeCalcul ?? VALEUR_VIDE}</span>
        </DescriptionList.Item>
        <DescriptionList.Item label="Source des données">
          {indicateur.sourceDonnees ?? VALEUR_VIDE}
        </DescriptionList.Item>
        <DescriptionList.Item label="Source (URL)">
          {indicateur.sourceUrl ? (
            <a
              href={indicateur.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {indicateur.sourceUrl}
            </a>
          ) : (
            VALEUR_VIDE
          )}
        </DescriptionList.Item>
        <DescriptionList.Item label="Période de mise à jour">
          {formatPeriodeMiseAJour(indicateur.periodeMiseAJour, indicateur.jourMiseAJour)}
        </DescriptionList.Item>
        <DescriptionList.Item label="Référentiels">
          {formatReferentiels(indicateur.referentiels)}
        </DescriptionList.Item>
        <DescriptionList.Item label="Créé le">
          {formatDateTimeFr(indicateur.createdAt)}
        </DescriptionList.Item>
        <DescriptionList.Item label="Mis à jour le">
          {formatDateTimeFr(indicateur.updatedAt)}
        </DescriptionList.Item>
      </DescriptionList>

      <div className="flex flex-col gap-4">
        <Heading size="sm">Responsables</Heading>
        <ResponsablesList responsables={[...indicateur.responsables]} />
      </div>
    </div>
  )
}
