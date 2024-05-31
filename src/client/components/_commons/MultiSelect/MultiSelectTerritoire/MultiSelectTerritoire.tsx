import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import MultiSelectTerritoireProps from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire.interface';
import { MultiSelectOptionGroupée, MultiSelectOptions, MultiSelectOptionsGroupées } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import { trierParOrdreAlphabétique } from '@/client/utils/arrays';
import api from '@/server/infrastructure/api/trpc/api';
import { Territoire, TerritoireAvecNombreUtilisateurs } from '@/server/domain/territoire/Territoire.interface';

const générerLesOptions = (nom: string, code: string, nombreUtilisateur: number) => ({
  label: nom + ' ' + nombreUtilisateur,
  value: code,
});

export default function MultiSelectTerritoire({ territoiresCodesSélectionnésParDéfaut, changementValeursSélectionnéesCallback, groupesÀAfficher, territoiresSélectionnables, afficherBoutonsSélection }: MultiSelectTerritoireProps) {

  let territoires: TerritoireAvecNombreUtilisateurs[];
  if (!territoiresSélectionnables) {
    // const { data } = api.territoire.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
    territoires = [] as TerritoireAvecNombreUtilisateurs[];
  } else {
    const { data } = api.territoire.récupérerListe.useQuery({ territoireCodes: territoiresSélectionnables }, { staleTime: Number.POSITIVE_INFINITY });
    territoires = data as TerritoireAvecNombreUtilisateurs[];
  }
  
  const départements = territoires?.filter(territoire => territoire.maille === 'départementale') ?? [];
  const régions = territoires?.filter(territoire => territoire.maille === 'régionale') ?? [];

  const optionFR = {
    label: 'National',
    options: [{
      label: 'France',
      value: 'NAT-FR',
    }],
  };    

  const optionsRégions = {
    label: 'Régions',
    options: trierParOrdreAlphabétique<MultiSelectOptions>(régions.map(d => générerLesOptions(d.nomAffiché, d.code, d.nombreUtilisateur)), 'label'),
  };

  const optionsDépartements = {
    label: 'Départements',
    options: trierParOrdreAlphabétique<MultiSelectOptions>(départements.map(d => générerLesOptions(d.nomAffiché, d.code, d.nombreUtilisateur)), 'label'),
  };

  const options: MultiSelectOptionsGroupées = [
    groupesÀAfficher.nationale ? optionFR : null,
    groupesÀAfficher.régionale ? optionsRégions : null,
    groupesÀAfficher.départementale ? optionsDépartements : null,
  ].filter((option): option is MultiSelectOptionGroupée => option !== null);

  const optionsGroupées = options;

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label='Territoire(s)'
      optionsGroupées={optionsGroupées}
      suffixeLibellé='territoire(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={territoiresCodesSélectionnésParDéfaut}
    />
  );
}

