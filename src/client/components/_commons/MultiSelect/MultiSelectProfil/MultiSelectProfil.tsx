import { useEffect, useState } from 'react';
import MultiSelect from '@/client/components/_commons/MultiSelect/MultiSelect';
import { MultiSelectOptions, MultiSelectOptionsGroupées } from '@/client/components/_commons/MultiSelect/MultiSelect.interface';
import { deuxTableauxSontIdentiques, trierParOrdreAlphabétique } from '@/client/utils/arrays';
import MultiSelectProfilsProps from './MultiSelectProfil.interface';

export default function MultiSelectProfil({ profilsIdsSélectionnésParDéfaut, changementValeursSélectionnéesCallback, valeursDésactivées, profils, afficherBoutonsSélection }: MultiSelectProfilsProps) {
  const [valeursSélectionnéesParDéfaut, setValeursSélectionnéesParDéfaut] = useState(profilsIdsSélectionnésParDéfaut);
  const [optionsGroupées, setOptionsGroupées] = useState<MultiSelectOptionsGroupées>([]);

  useEffect(() => {
    if (profils) {
      setOptionsGroupées([{
        label: '¨Profils',
        options: trierParOrdreAlphabétique<MultiSelectOptions>(profils.map(profil => ({
          label: profil.nom,
          value: profil.code,
          disabled: valeursDésactivées?.includes(profil.code),
        })), 'label'),
      }]);
    }
  }, [profils, valeursDésactivées]);

  useEffect(() => {
    if (!deuxTableauxSontIdentiques(profilsIdsSélectionnésParDéfaut ?? [], valeursSélectionnéesParDéfaut ?? [])) {
      setValeursSélectionnéesParDéfaut(profilsIdsSélectionnésParDéfaut);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilsIdsSélectionnésParDéfaut, valeursSélectionnéesParDéfaut, setValeursSélectionnéesParDéfaut]);

  return (
    <MultiSelect
      afficherBoutonsSélection={afficherBoutonsSélection}
      changementValeursSélectionnéesCallback={(valeursSélectionnées: string[]) => changementValeursSélectionnéesCallback(valeursSélectionnées)}
      label='Profil(s)'
      optionsGroupées={optionsGroupées}
      suffixeLibellé='profils(s) sélectionné(s)'
      valeursSélectionnéesParDéfaut={valeursSélectionnéesParDéfaut}
    />
  );
}
