import { MapInformationMetadataIndicateurContrat } from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';

export const mappingDisplayAcceptedValues = (mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat, indicateur: MetadataParametrageIndicateurContrat, originValue: keyof MapInformationMetadataIndicateurContrat, mappedValue: keyof MetadataParametrageIndicateurContrat) => {
  return mapInformationMetadataIndicateur[originValue].acceptedValues.find(acceptedValue => acceptedValue.valeur === indicateur[mappedValue])?.libellé || '_';
};
export const mappingAcceptedValues = (mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat, indicateur: MetadataParametrageIndicateurContrat, originValue: keyof MapInformationMetadataIndicateurContrat) => {
  return mapInformationMetadataIndicateur[originValue].acceptedValues.map(acceptedValue => ({
    valeur: acceptedValue.valeur,
    libellé: acceptedValue.libellé,
  }));
};
