import { useState, useMemo } from 'react';
import { départementsTerritoiresStore, régionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';

export default function MultiSelectTerritoire() {
  const départements = départementsTerritoiresStore();
  const régions = régionsTerritoiresStore();
  const [estOuvert, setEstOuvert] = useState(false);

  const [territoiresSélectionnés, setTerritoiresSélectionnés ] = useState<string[]>([]);

  const départementsSélectionnés = useMemo(() => (
    départements.filter(d =>
      territoiresSélectionnés.includes(d.code),
    ).sort((a, b) =>
      a.nomAffiché.localeCompare(b.nomAffiché),
    )
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert]);

  const départementsNonSélectionnés = useMemo(() => (
    départements.filter(d =>
      !territoiresSélectionnés.includes(d.code),
    ).sort((a, b) =>
      a.nomAffiché.localeCompare(b.nomAffiché),
    )
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert]);

  const régionsSélectionnées = useMemo(() => (
    régions.filter(d =>
      territoiresSélectionnés.includes(d.code),
    ).sort((a, b) =>
      a.nomAffiché.localeCompare(b.nomAffiché),
    )
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert]);

  const régionsNonSélectionnées = useMemo(() => (
    régions.filter(d =>
      !territoiresSélectionnés.includes(d.code),
    ).sort((a, b) =>
      a.nomAffiché.localeCompare(b.nomAffiché),
    )
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert]);

  const optionsGroupées = useMemo(() => (
    [
      {
        label: 'Départements',
        options: [...départementsSélectionnés, ...départementsNonSélectionnés]
          .map(département => ({
            label: département.nomAffiché,
            value: département.code,
          })),
      },
      {
        label: 'Régions',
        options: [...régionsSélectionnées, ...régionsNonSélectionnées]
          .map(région => ({
            label: région.nomAffiché,
            value: région.code,
          })),
      },
      {
        label: 'National',
        options: [{
          label: 'France',
          value: 'NAT-FR',
        }],
      },
    ]
    //eslint-disable-next-line react-hooks/exhaustive-deps
  ), [estOuvert]);

  return (
    <MultiSelect
      changementValeursSélectionnéesCallback={(valeursSélectionnées) => setTerritoiresSélectionnés(valeursSélectionnées)}
      libellé='Territoire(s)'
      optionsGroupées={optionsGroupées} 
      ouvertureCallback={(ouvert) => setEstOuvert(ouvert)}
    />
  );
}
