import { type UniteIndicateurApiModel } from '@pilote/mb-shared/indicateur'

import { DescriptionList } from '@/components/ui/DescriptionList'
import { formatDateTimeFr } from '@/lib/format'

type IndicateurMetadonneesProps = {
  indicateur: {
    id: string
    nom: string
    unite: UniteIndicateurApiModel | null
    createdAt: string
    updatedAt: string
  }
}

export function IndicateurMetadonnees({ indicateur }: IndicateurMetadonneesProps) {
  return (
    <DescriptionList>
      <DescriptionList.Item label="ID">{indicateur.id}</DescriptionList.Item>
      <DescriptionList.Item label="Nom">{indicateur.nom}</DescriptionList.Item>
      <DescriptionList.Item label="Unité">
        {indicateur.unite ? `${indicateur.unite.libelle} (${indicateur.unite.abbreviation})` : '—'}
      </DescriptionList.Item>
      <DescriptionList.Item label="Créé le">
        {formatDateTimeFr(indicateur.createdAt)}
      </DescriptionList.Item>
      <DescriptionList.Item label="Mis à jour le">
        {formatDateTimeFr(indicateur.updatedAt)}
      </DescriptionList.Item>
    </DescriptionList>
  )
}
