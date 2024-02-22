import { useFormContext, UseFormWatch } from 'react-hook-form';

export type MetadataParametrageAutresIndicateurForm = {
  indicNomBaro: string;
  indicDescrBaro: string;
  indicIsPerseverant: boolean;
  indicIsPhare: boolean;
  indicSource: string;
  indicSourceUrl: string;
  indicMethodeCalcul: string;
  reformePrioritaire: string;
  projetAnnuelPerf: boolean; 
  detailProjetAnnuelPerf: string;
  periodicite: string;
  delaiDisponibilite: string;
  indicTerritorialise: boolean;
  frequenceTerritoriale: string;
  mailles: string;
  adminSource: string;
  methodeCollecte: string;
  siSource: string;
  donneeOuverte: boolean;
  modalitesDonneeOuverte: string;
  respDonnees: string;
  respDonneesEmail: string;
  contactTechnique: string;
  contactTechniqueEmail: string;
  commentaire: string;
};

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageAutresIndicateurForm>) {
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
