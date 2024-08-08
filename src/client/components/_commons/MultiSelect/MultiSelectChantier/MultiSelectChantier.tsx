import { FunctionComponent, useEffect, useState } from 'react';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import { MultiSelectOptions, MultiSelectOptionsGroupées } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import { deuxTableauxSontIdentiques, trierParOrdreAlphabétique } from '@/client/utils/arrays';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

interface MultiSelectChantierProps {
  changementValeursSélectionnéesCallback: (chantiersIdsSélectionnés: string[]) => void
  chantiers: ChantierSynthétisé[]
  chantiersIdsSélectionnésParDéfaut?: string[]
  valeursDésactivées?: string[]
  afficherBoutonsSélection?: boolean
  desactive?: boolean
}

const MultiSelectChantier: FunctionComponent<MultiSelectChantierProps> = ({ chantiersIdsSélectionnésParDéfaut, changementValeursSélectionnéesCallback, valeursDésactivées, chantiers, afficherBoutonsSélection, desactive }) => {
  const [valeursSélectionnéesParDéfaut, setValeursSélectionnéesParDéfaut] = useState(chantiersIdsSélectionnésParDéfaut);
  const [optionsGroupées, setOptionsGroupées] = useState<MultiSelectOptionsGroupées>([]);

  useEffect(() => {
    if (chantiers) {
      setOptionsGroupées([{
        label: 'Chantiers',
        options: trierParOrdreAlphabétique<MultiSelectOptions>(chantiers.map(chantier => ({
          label: chantier.nom,
          value: chantier.id,
          disabled: valeursDésactivées?.includes(chantier.id),
        })), 'label'),
      }]);
    }
  }, [chantiers, valeursDésactivées]);

  useEffect(() => {
    if (!deuxTableauxSontIdentiques(chantiersIdsSélectionnésParDéfaut ?? [], valeursSélectionnéesParDéfaut ?? [])) {
      setValeursSélectionnéesParDéfaut(chantiersIdsSélectionnésParDéfaut);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantiersIdsSélectionnésParDéfaut, valeursSélectionnéesParDéfaut, setValeursSélectionnéesParDéfaut]);

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      desactive={desactive}
      label='Chantier(s)'
      optionsGroupées={optionsGroupées}
      suffixeLibellé='chantier(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={valeursSélectionnéesParDéfaut}
    />
  );
};

export default MultiSelectChantier;
