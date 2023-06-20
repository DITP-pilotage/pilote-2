import { départementsTerritoiresStore, régionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import MultiSelectTerritoireProps
  from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire.interface';

const générerLesOptions = (nom: string, code: string) => ({
  label: nom,
  value: code,
});

export default function MultiSelectTerritoire({ territoiresCodesSélectionnésParDéfaut, changementValeursSélectionnéesCallback }: MultiSelectTerritoireProps) {
  const départements = départementsTerritoiresStore();
  const régions = régionsTerritoiresStore();

  const optionsGroupées = 
    [
      {
        label: 'National',
        options: [{
          label: 'France',
          value: 'NAT-FR',
        }],
      },
      {
        label: 'Régions',
        options: régions.map(d => générerLesOptions(d.nomAffiché, d.code)),
      },
      {
        label: 'Départements',
        options: départements.map(d => générerLesOptions(d.nomAffiché, d.code)),
      },
    ];

  return (
    <MultiSelect
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      optionsGroupées={optionsGroupées}
      suffixeLibellé='territoire(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={territoiresCodesSélectionnésParDéfaut}
    />
  );
}
