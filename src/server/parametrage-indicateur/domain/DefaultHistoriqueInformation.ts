import {
  InformationDerniereModificationMetadataIndicateurContrat,
  InformationHistorisationMetadataIndicateurContrat,
} from '@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat';

export const defaultHistoriqueInformation: InformationHistorisationMetadataIndicateurContrat = {
  auteurCreation: 'DITP Admin',
  dateCreation: '2024-01-31',
  auteurModification: 'DITP Admin',
  dateDerniereModification: '2024-01-31',
};

export const defaultDeniereModificationInformation: InformationDerniereModificationMetadataIndicateurContrat = {
  auteurModification: 'DITP Admin',
  dateDerniereModification: '2024-01-31',
};
