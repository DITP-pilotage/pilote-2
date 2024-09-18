import { useFormContext, UseFormWatch } from 'react-hook-form';

export type MetadataParametrageAutresIndicateurForm = {
  indicIsPerseverant: boolean;
  indicIsPhare: boolean;
  reformePrioritaire: string | null;
  projetAnnuelPerf: boolean;
  detailProjetAnnuelPerf: string | null;
  indicTerritorialise: boolean;
  frequenceTerritoriale: string;
  mailles: string | null;
  adminSource: string;
  methodeCollecte: string | null;
  siSource: string | null;
  donneeOuverte: boolean;
  modalitesDonneeOuverte: string | null;
  respDonnees: string | null;
  respDonneesEmail: string | null;
  contactTechnique: string | null;
  contactTechniqueEmail: string;
  commentaire: string | null;
};

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageAutresIndicateurForm>) {
  watch('indicIsPerseverant');
  watch('indicIsPhare');
  watch('projetAnnuelPerf');
  watch('indicTerritorialise');
  watch('donneeOuverte');
}

export default function useSectionDétailsMetadataAutresIndicateurForm() {
  const {
    register,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext<MetadataParametrageAutresIndicateurForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
  };
}
