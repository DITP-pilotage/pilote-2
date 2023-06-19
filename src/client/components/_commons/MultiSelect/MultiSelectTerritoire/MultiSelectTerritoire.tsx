import { useState, useMemo, useEffect } from 'react';
import { MultiValue } from 'react-select';
import { départementsTerritoiresStore, régionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import { MultiSelectOption } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import MultiSelectTerritoireProps from './MultiSelectTerritoire.interface';

const générerLesOptions = (nom: string, code: string, estSélectionné: boolean) => ({
  label: nom,
  value: code,
  estSélectionné,
});

export default function MultiSelectTerritoire({ changementValeursSélectionnéesCallback, territoiresCodesSélectionnéesParDéfaut }: MultiSelectTerritoireProps) {
  const départements = départementsTerritoiresStore();
  const régions = régionsTerritoiresStore();
  const [estOuvert, setEstOuvert] = useState(false);

  const [optionsSélectionnées, setOptionsSélectionnées ] = useState<MultiValue<MultiSelectOption>>([]);
 
  const [territoiresCodesSélectionnés, setTerritoiresCodesSélectionnés ] = useState<string[]>(territoiresCodesSélectionnéesParDéfaut ?? []);

  const changerOptionsSélectionnées = (options: MultiValue<MultiSelectOption>) => {
    const territoiresCodes = options.map(o => o.value);
    setOptionsSélectionnées(options);
    setTerritoiresCodesSélectionnés(territoiresCodes);
    changementValeursSélectionnéesCallback(territoiresCodes);
  };
  
  const départementsSélectionnés = useMemo(() => (
    départements.filter(d =>
      territoiresCodesSélectionnés.includes(d.code),
    ).sort((a, b) =>
      a.nomAffiché.localeCompare(b.nomAffiché),
    )
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert, territoiresCodesSélectionnéesParDéfaut]);

  const départementsNonSélectionnés = useMemo(() => (
    départements.filter(d =>
      !territoiresCodesSélectionnés.includes(d.code),
    ).sort((a, b) =>
      a.nomAffiché.localeCompare(b.nomAffiché),
    )
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert, territoiresCodesSélectionnéesParDéfaut]);

  const régionsSélectionnées = useMemo(() => (
    régions.filter(d =>
      territoiresCodesSélectionnés.includes(d.code),
    ).sort((a, b) =>
      a.nomAffiché.localeCompare(b.nomAffiché),
    )
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert, territoiresCodesSélectionnéesParDéfaut]);

  const régionsNonSélectionnées = useMemo(() => (
    régions.filter(d =>
      !territoiresCodesSélectionnés.includes(d.code),
    ).sort((a, b) =>
      a.nomAffiché.localeCompare(b.nomAffiché),
    )
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert, territoiresCodesSélectionnéesParDéfaut]);

  useEffect(() => {
    setOptionsSélectionnées([
      ...départementsSélectionnés.map(d => générerLesOptions(d.nomAffiché, d.code, true)),
      ...régionsSélectionnées.map(r => générerLesOptions(r.nomAffiché, r.code, true)),
    ]);
  }, [territoiresCodesSélectionnéesParDéfaut, départementsSélectionnés, régionsSélectionnées]);

  const optionsGroupées = useMemo(() => (
    [
      {
        label: 'Départements',
        options: [
          ...départementsSélectionnés.map(d => générerLesOptions(d.nomAffiché, d.code, true)),
          ...départementsNonSélectionnés.map(d => générerLesOptions(d.nomAffiché, d.code, false)),
        ],
      },
      {
        label: 'Régions',
        options: [
          ...régionsSélectionnées.map(r => générerLesOptions(r.nomAffiché, r.code, true)),
          ...régionsNonSélectionnées.map(r => générerLesOptions(r.nomAffiché, r.code, false)),
        ],
      },
      {
        label: 'National',
        options: [{
          label: 'France',
          value: 'NAT-FR',
          estSélectionné: false,
        }],
      },
    ]
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert]);

  return (
    <MultiSelect
      changementValeursSélectionnéesCallback={(options) => changerOptionsSélectionnées(options)}
      libellé='Territoire(s)'
      optionsGroupées={optionsGroupées}
      ouvertureCallback={(ouvert) => setEstOuvert(ouvert)}
    />
  );
}
