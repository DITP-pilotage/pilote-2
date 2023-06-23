import { départementsTerritoiresStore, régionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import MultiSelectTerritoireProps from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire.interface';
import { MultiSelectOptionsGroupées } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';

const générerLesOptions = (nom: string, code: string) => ({
  label: nom,
  value: code,
});

export default function MultiSelectTerritoire({ territoiresCodesSélectionnésParDéfaut, changementValeursSélectionnéesCallback, mailleÀAfficher }: MultiSelectTerritoireProps) {
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
    options: régions.map(d => générerLesOptions(d.nomAffiché, d.code)),
  };

  const optionsDépartements = {
    label: 'Départements',
    options: départements.map(d => générerLesOptions(d.nomAffiché, d.code)),
  };

  const optionsGroupées = [
    mailleÀAfficher.nationale ? optionFR : null,
    mailleÀAfficher.régionale ? optionsRégions : null,
    mailleÀAfficher.départementale ? optionsDépartements : null,
  ].filter(option => option !== null) as MultiSelectOptionsGroupées;

  return (
    <MultiSelect
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      optionsGroupées={optionsGroupées}
      suffixeLibellé='territoire(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={territoiresCodesSélectionnésParDéfaut}
    />
  );
}
