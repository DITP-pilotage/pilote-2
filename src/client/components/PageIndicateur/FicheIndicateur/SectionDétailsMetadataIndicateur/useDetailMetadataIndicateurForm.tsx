import { useFormContext, UseFormWatch } from 'react-hook-form';
import api from '@/server/infrastructure/api/trpc/api';
import { SélecteurOption } from '@/components/_commons/Sélecteur/Sélecteur.interface';

export type MetadataParametrageIndicateurForm = {
  indicParentCh: string;
  indicParentIndic: string;
  indicNom: string;
  indicDescr: string;
  indicType: string;
  indicUnite: string | null;
  indicSchema: string;
  zgApplicable: string;
  indicTerritorialise: boolean;
  indicIsBaro: boolean;
  indicMethodeCalcul: string;
  indicSource: string;
  indicSourceUrl: string | null;
  periodicite: string;
  delaiDisponibilite: string;
  indicNomBaro: string | null;
  indicDescrBaro: string | null;

};

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageIndicateurForm>) {
  watch('indicType');
  watch('indicSchema');
  watch('indicParentCh');
  watch('indicParentIndic');
  watch('indicTerritorialise');
  watch('indicIsBaro');
  watch('zgApplicable');
  watch('periodicite');
}

export default function useDetailMetadataIndicateurForm() {
  const {
    register,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<MetadataParametrageIndicateurForm>();

  const { data: metadataIndicateurs = [] } = api.metadataIndicateur.récupérerMetadataIndicateurFiltrés.useQuery({
    filtres: {
      chantiers: !getValues('indicParentCh') || getValues('indicParentCh') === '_' ? ['Aucun chantier séléctionné'] : [getValues('indicParentCh')],
      perimetresMinisteriels: [],
      estTerritorialise: false,
      estBarometre: false,
    },
  });

  let optionsIndicateurParent: SélecteurOption<string>[];
  if (!getValues('indicParentCh') || getValues('indicParentCh') === '_') {
    optionsIndicateurParent = [{ valeur: '_', libellé: 'Selectionner d\'abord un chantier' }];
  } else {
    optionsIndicateurParent = metadataIndicateurs.length === 0 ? [{
      valeur: 'Aucun indicateur selectionné',
      libellé: 'Aucun indicateur parent disponible',
    }]
      : [{
        valeur: 'Aucun indicateur selectionné',
        libellé: 'Pas d\'indicateur parent',
      }, ...metadataIndicateurs.map(optionIndicateur => ({
        valeur: optionIndicateur.indicId,
        libellé: `${optionIndicateur.indicId} ${optionIndicateur.indicNom}`,
      }))];
  }

  const indicateurEstTerritorialise = getValues('indicTerritorialise');

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    setValue,
    errors,
    metadataIndicateurs,
    optionsIndicateurParent,
    indicateurEstTerritorialise,
  };
}
