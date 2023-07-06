import { départementsTerritoiresStore, régionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import MultiSelectTerritoireProps from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire.interface';
import { MultiSelectOptionGroupée, MultiSelectOptions, MultiSelectOptionsGroupées } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import { trierParOrdreAlphabétique } from '@/client/utils/arrays';

const générerLesOptions = (nom: string, code: string) => ({
  label: nom,
  value: code,
});

export default function MultiSelectTerritoire({ territoiresCodesSélectionnésParDéfaut, changementValeursSélectionnéesCallback, groupesÀAfficher }: MultiSelectTerritoireProps) {
  const départements = départementsTerritoiresStore();
  const régions = régionsTerritoiresStore();

  const optionFR = {
    label: 'National',
    options: [{
      label: 'France',
      value: 'NAT-FR',
    }],
  };

  const optionsRégions = {
    label: 'Régions',
    options: trierParOrdreAlphabétique<MultiSelectOptions>(régions.map(d => générerLesOptions(d.nomAffiché, d.code)), 'label'),
  };

  const optionsDépartements = {
    label: 'Départements',
    options: trierParOrdreAlphabétique<MultiSelectOptions>(départements.map(d => générerLesOptions(d.nomAffiché, d.code)), 'label'),
  };

  const optionsGroupées: MultiSelectOptionsGroupées = [
    groupesÀAfficher.nationale ? optionFR : null,
    groupesÀAfficher.régionale ? optionsRégions : null,
    groupesÀAfficher.départementale ? optionsDépartements : null,
  ].filter((option): option is MultiSelectOptionGroupée => option !== null);

  return (
    <MultiSelect
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label='Territoire(s)'
      optionsGroupées={optionsGroupées}
      suffixeLibellé='territoire(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={territoiresCodesSélectionnésParDéfaut}
    />
  );
}
