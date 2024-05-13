import { useFormContext, UseFormWatch } from 'react-hook-form';

export type MetadataParametrageAutresIndicateurForm = {
  indicNomBaro: string | null;
  indicDescrBaro: string | null;
  indicIsPerseverant: boolean;
  indicIsPhare: boolean;
  indicSource: string;
  indicSourceUrl: string | null;
  indicMethodeCalcul: string;
  reformePrioritaire: string | null;
  projetAnnuelPerf: boolean;
  detailProjetAnnuelPerf: string | null;
  periodicite: string;
  delaiDisponibilite: string;
  indicTerritorialise: boolean;
  frequenceTerritoriale: string | null;
  mailles: string | null;
  adminSource: string;
  methodeCollecte: string;
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
