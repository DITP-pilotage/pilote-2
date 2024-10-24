import { FunctionComponent, useEffect, useState } from 'react';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import api from '@/server/infrastructure/api/trpc/api';
import { MultiSelectOptions, MultiSelectOptionsGroupées } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import { trierParOrdreAlphabétique } from '@/client/utils/arrays';

interface MultiSelectPérimètreMinistérielProps {
  changementValeursSélectionnéesCallback: (périmètresMinistérielsIdsSélectionnés: string[]) => void
  périmètresMinistérielsIdsSélectionnésParDéfaut?: string[]
  périmètresId?: string[]
  afficherBoutonsSélection?: boolean
}

const MultiSelectPérimètreMinistériel: FunctionComponent<MultiSelectPérimètreMinistérielProps> = ({ périmètresMinistérielsIdsSélectionnésParDéfaut, changementValeursSélectionnéesCallback, périmètresId, afficherBoutonsSélection }) => {
  const { data: périmètresMinistériels } = api.périmètreMinistériel.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  
  const [optionsGroupées, setOptionsGroupées] = useState<MultiSelectOptionsGroupées>([]);

  useEffect(() => {
    const périmètresSélectionnables = !!périmètresId ? périmètresMinistériels?.filter(p => périmètresId.includes(p.id)) : périmètresMinistériels;
    if (périmètresSélectionnables) {
      setOptionsGroupées([{
        label: 'Périmètres Ministériels',
        options: trierParOrdreAlphabétique<MultiSelectOptions>(périmètresSélectionnables.map(périmètreMinistériel => ({
          label: périmètreMinistériel.nom,
          value: périmètreMinistériel.id,
        })), 'label'),
      }]);
    }
  }, [périmètresMinistériels, périmètresId]);

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label='Périmètre(s) ministériel(s)'
      optionsGroupées={optionsGroupées}
      suffixeLibellé='périmètre(s) ministériel(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={périmètresMinistérielsIdsSélectionnésParDéfaut}
    />
  );
};

export default MultiSelectPérimètreMinistériel;
