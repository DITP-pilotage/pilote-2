import { DescriptionList } from '@/components/ui/DescriptionList'

type IndicateurMetadonneesProps = {
  indicateur: {
    id: string
    nom: string
    createdAt: string
    updatedAt: string
  }
}

export function IndicateurMetadonnees({ indicateur }: IndicateurMetadonneesProps) {
  return (
    <DescriptionList>
      <DescriptionList.Item label="ID">{indicateur.id}</DescriptionList.Item>
      <DescriptionList.Item label="Nom">{indicateur.nom}</DescriptionList.Item>
      <DescriptionList.Item label="Créé le">
        {new Date(indicateur.createdAt).toLocaleString('fr-FR')}
      </DescriptionList.Item>
      <DescriptionList.Item label="Mis à jour le">
        {new Date(indicateur.updatedAt).toLocaleString('fr-FR')}
      </DescriptionList.Item>
    </DescriptionList>
  )
}
