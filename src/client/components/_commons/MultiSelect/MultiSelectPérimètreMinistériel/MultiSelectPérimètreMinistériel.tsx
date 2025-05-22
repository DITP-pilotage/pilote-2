import { FunctionComponent, useEffect, useState } from 'react';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import {
  MultiSelectOptions,
  MultiSelectOptionsGroupées,
} from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import { trierParOrdreAlphabétique } from '@/client/utils/arrays';
import { PerimetreMinisteriel } from '@/server/gestion-utilisateur/domain/PerimetreMinisteriel';

interface MultiSelectPérimètreMinistérielProps {
  changementValeursSélectionnéesCallback: (périmètresMinistérielsIdsSélectionnés: string[]) => void
  périmètresMinistérielsIdsSélectionnésParDéfaut?: string[]
  périmètresId?: string[]
  afficherBoutonsSélection?: boolean
  perimetresSelectionnables: PerimetreMinisteriel[]
  desactive?: boolean
}

const MultiSelectPérimètreMinistériel: FunctionComponent<MultiSelectPérimètreMinistérielProps> = ({
  périmètresMinistérielsIdsSélectionnésParDéfaut,
  changementValeursSélectionnéesCallback,
  périmètresId,
  afficherBoutonsSélection,
  perimetresSelectionnables,
  desactive,
}) => {

  const [optionsGroupées, setOptionsGroupées] = useState<MultiSelectOptionsGroupées>([]);

  useEffect(() => {
    if (perimetresSelectionnables) {
      setOptionsGroupées([{
        label: 'Périmètres Ministériels',
        options: trierParOrdreAlphabétique<MultiSelectOptions>(perimetresSelectionnables.map(perimetreMinisteriel => ({
          label: perimetreMinisteriel.nom,
          value: perimetreMinisteriel.id,
        })), 'label'),
      }]);
    }
  }, [perimetresSelectionnables, périmètresId]);

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      desactive={desactive}
      label='Périmètre(s) ministériel(s)'
      optionsGroupées={optionsGroupées}
      suffixeLibellé='périmètre(s) ministériel(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={périmètresMinistérielsIdsSélectionnésParDéfaut}
    />
  );
};

export default MultiSelectPérimètreMinistériel;
