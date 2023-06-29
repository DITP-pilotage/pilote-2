import { useEffect, useState } from 'react';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import api from '@/server/infrastructure/api/trpc/api';
import { MultiSelectOptionsGroupées } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import MultiSelectPérimètreMinistérielProps from './MultiSelectPérimètreMinistériel.interface';

export default function MultiSelectPérimètreMinistériel({ périmètresMinistérielsIdsSélectionnésParDéfaut, changementValeursSélectionnéesCallback }: MultiSelectPérimètreMinistérielProps) {
  const { data: périmètresMinistériels } = api.périmètreMinistériel.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const [optionsGroupées, setOptionsGroupées] = useState<MultiSelectOptionsGroupées>([]);

  useEffect(() => {
    if (périmètresMinistériels) {
      setOptionsGroupées([{
        label: 'Périmètres Ministériels',
        options: périmètresMinistériels.map(périmètreMinistériel => ({
          label: périmètreMinistériel.nom,
          value: périmètreMinistériel.id,
        })),
      }]);
    }
  }, [périmètresMinistériels]);

  return (
    <MultiSelect
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label='Périmètre(s) ministériel(s)'
      optionsGroupées={optionsGroupées}
      suffixeLibellé='périmètre(s) ministériel(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={périmètresMinistérielsIdsSélectionnésParDéfaut}
    />
  );
}
