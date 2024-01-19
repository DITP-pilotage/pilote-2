import { useFormContext, UseFormWatch } from 'react-hook-form';

export interface MetadataParametrageAutresIndicateurForm {
  indicNomBaro: string;
  indicDescrBaro: string;
  indicIsBaro: string;
  indicIsPerseverant: string;
  indicIsPhare: string;
  indicSource: string;
  indicSourceUrl: string;
  indicMethodeCalcul: string;
  reformePrioritaire: string;
  projetAnnuelPerf: string;
  detailProjetAnnuelPerf: string;
  periodicite: string;
  delaiDisponibilite: string;
  indicTerritorialise: string;
  frequenceTerritoriale: string;
  mailles: string;
  adminSource: string;
  methodeCollecte: string;
  siSource: string;
  donneeOuverte: string;
  modalitesDonneeOuverte: string;
  respDonnees: string;
  respDonneesEmail: string;
  contactTechnique: string;
  contactTechniqueEmail: string;
  commentaire: string;
}

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageAutresIndicateurForm>) {
  watch('indicIsBaro');
  watch('indicIsPerseverant');
  watch('indicIsPhare');
  watch('projetAnnuelPerf');
  watch('indicTerritorialise');
  watch('donneeOuverte');
}

export default function useSectionDétailsMetadataAutresIndicateurForm() {
  const { register, watch, getValues, formState: { errors } } = useFormContext<MetadataParametrageAutresIndicateurForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
  };
}
