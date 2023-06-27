import { useEffect, useState } from 'react';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import api from '@/server/infrastructure/api/trpc/api';
import { MultiSelectOptionsGroupées } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import MultiSelectChantierProps from './MultiSelectChantier.interface';

export default function MultiSelectChantier({ chantiersIdsSélectionnésParDéfaut, changementValeursSélectionnéesCallback }: MultiSelectChantierProps) {
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const [optionsGroupées, setOptionsGroupées] = useState<MultiSelectOptionsGroupées>([]);

  useEffect(() => {
    if (chantiers) {
      setOptionsGroupées([{
        label: 'Chantiers',
        options: chantiers.map(chantier => ({
          label: chantier.nom,
          value: chantier.id,
        })),
      }]);
    }
  }, [chantiers]);

  return (
    <MultiSelect
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      optionsGroupées={optionsGroupées}
      suffixeLibellé='chantier(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={chantiersIdsSélectionnésParDéfaut}
    />
  );
}
